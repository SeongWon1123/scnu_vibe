# Task 5 준비 설계: Supabase 저장소 계층

## 1. 목표와 경계

Task 5는 순모아의 **공지 읽기 모델**과 **키워드 푸시 구독 저장소**를 만든다. 크롤러가 수집한 공지를 중복 없이 저장하고, 향후 피드 UI는 누구나 읽을 수 있으며, 푸시 구독 정보는 서버·크롤러만 다룰 수 있도록 분리한다.

> **완료 기준:** 공지는 공개 읽기만 가능하고 쓰기는 service role만 가능해야 한다. 푸시 구독 테이블은 어떤 브라우저 역할에도 직접 노출되지 않아야 한다.

| Task 5에서 구현 | Task 5에서 보류 |
| --- | --- |
| 공지·푸시 구독 테이블, 인덱스, RLS 정책 | 로그인·회원 계정·프로필 |
| anon 읽기 클라이언트와 service-role 클라이언트 | 푸시 구독 API route와 실제 발송 |
| 마이그레이션 적용·역할별 읽기/쓰기 검증 | 전문 검색 엔진·벡터 검색 |
| 크롤러 중복 방지에 필요한 고유 제약 | 조회수·개인화 이력·분석 추적 |

## 2. 최소 데이터 모델

### `notices`

| 열 | 타입 | 목적과 규칙 |
| --- | --- | --- |
| `id` | `bigint identity` | 내부 정렬·참조용 기본 키 |
| `board` | `text not null` | Task 2의 `BoardKey` 값 |
| `ntt_sn` | `bigint not null` | 학교 원문 공지 식별자 |
| `title` | `text not null` | 파서가 추출한 제목 |
| `author` | `text not null default ''` | 공지 작성 부서·작성자 |
| `posted_at` | `date not null` | 한국 시간 기준 날짜만 저장 |
| `url` | `text not null` | 학교 원문 링크, 항상 보존 |
| `is_pinned` | `boolean not null default false` | 고정 공지 구분 |
| `deadline` | `date nullable` | Task 6 정규식 추출 결과, 자동 인식 배지의 근거 |
| `created_at` | `timestamptz not null default now()` | 순모아가 처음 저장한 시점 |

**필수 제약과 인덱스**는 `unique (board, ntt_sn)`, `posted_at desc`, `(board, posted_at desc)`다. 학교 공지 번호가 게시판마다 독립적일 수 있으므로 `ntt_sn` 단독 고유 제약은 두지 않는다. 원문이 수정돼도 키는 유지되므로 이후 Task 7의 upsert·변경분 비교가 안정적이다.

### `push_subscriptions`

| 열 | 타입 | 목적과 규칙 |
| --- | --- | --- |
| `id` | `bigint identity` | 내부 기본 키 |
| `endpoint` | `text not null unique` | 브라우저 Web Push endpoint, 중복 구독 방지 |
| `p256dh` | `text not null` | Web Push 공개 키 재료 |
| `auth` | `text not null` | Web Push 인증 재료 |
| `keywords` | `text[] not null default '{}'` | 사용자가 선택한 알림 키워드 |
| `created_at` | `timestamptz not null default now()` | 최초 구독 시점 |

여기에는 이름, 이메일, 학생 번호, 로그인 식별자, IP 주소, 브라우저 지문을 추가하지 않는다. endpoint와 키워드도 서비스 운영에 필요한 최소 데이터로 취급한다.

## 3. RLS 보안 경계

| 리소스 | anon / 브라우저 | authenticated | service role |
| --- | --- | --- | --- |
| `notices` 읽기 | 허용 | 허용 | 허용 |
| `notices` 쓰기·수정·삭제 | 거부 | 거부 | 허용 |
| `push_subscriptions` 읽기 | 거부 | 거부 | 허용 |
| `push_subscriptions` 쓰기·수정·삭제 | 거부 | 거부 | 허용 |

`notices`에는 `select` 정책 하나만 둔다. `push_subscriptions`는 RLS를 활성화한 뒤 **정책을 전혀 만들지 않는다**. service role은 RLS를 우회하므로 크롤러와 서버 API route만 이 키를 사용한다.

> service role key는 `.env.local`, GitHub Actions secrets, Vercel 환경변수에만 둔다. `NEXT_PUBLIC_` 접두사, 클라이언트 번들, 테스트 출력, 커밋에 절대 넣지 않는다.

## 4. 클라이언트 분리

`lib/supabase.ts`는 아래 두 진입점을 제공한다.

| 함수 | 사용 위치 | 키 | 금지 사항 |
| --- | --- | --- | --- |
| `supabaseAnon()` | 서버 컴포넌트의 공개 피드 조회, 향후 브라우저 읽기 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 쓰기·푸시 테이블 접근에 사용 금지 |
| `supabaseService()` | Task 7 크롤러, 향후 푸시 구독 API route | `SUPABASE_SERVICE_ROLE_KEY` | client component import 금지 |

두 함수 모두 필요한 환경변수가 비어 있으면 즉시 이해 가능한 오류를 내도록 구현하는 것을 권장한다. 현재 계획의 non-null assertion만 사용하면 누락된 키가 뒤늦게 모호한 네트워크 오류로 나타날 수 있다. 다만 환경변수 값 자체는 오류 메시지에 넣지 않는다.

## 5. 구현 순서

1. Supabase 대시보드 또는 연결된 관리 도구에서 기존 프로젝트 유무와 **Free tier**를 확인한다. 프로젝트를 새로 만들기 전에는 사용자에게 지역·프로젝트명 선택이 필요한지 확인한다.
2. URL과 publishable/anon key만 `.env.local`에 넣는다. service role key가 필요하면 사용자에게 안전한 대시보드 입력 경로를 안내한다.
3. `supabase/migrations/0001_init.sql`에 두 테이블, 고유 제약, 인덱스, RLS, 정책을 한 마이그레이션으로 작성한다.
4. 마이그레이션을 적용하고, 두 테이블의 RLS 활성화 상태를 확인한다.
5. `lib/supabase.ts`에 읽기 전용 anon 클라이언트와 서버 전용 service 클라이언트를 작성한다.
6. 아래 검증 매트릭스를 모두 통과한 뒤에만 크롤러 오케스트레이터로 진행한다.

## 6. 필수 검증 매트릭스

| 검증 | 방법 | 기대 결과 |
| --- | --- | --- |
| 스키마 존재 | 테이블·열·인덱스 목록 확인 | `notices`, `push_subscriptions`가 정확한 열로 존재 |
| RLS 활성 | 테이블 메타데이터 확인 | 두 테이블 모두 RLS enabled |
| 공개 읽기 | anon 클라이언트로 공지 1건 조회 | 허용 |
| 공개 쓰기 차단 | anon 클라이언트로 공지 insert 시도 | 권한 오류 |
| 구독 데이터 차단 | anon 클라이언트로 구독 select/insert 시도 | 권한 오류 |
| 서버 쓰기 | service role로 임시 공지 insert | 성공 |
| 중복 방지 | 같은 `(board, ntt_sn)` 다시 insert/upsert | 중복 행 없음 |
| 정리 | 검증용 임시 행 delete | 데이터 0건 복구 |
| 비밀 유출 | `git diff --check`, `git status`, 환경 파일 확인 | 실제 키가 추적되지 않음 |

검증용 공지는 예를 들어 `board='academic'`, `ntt_sn=1`, `url='https://example.com'`처럼 명백히 비운영 값으로 넣고 같은 세션에서 삭제한다. 실제 학교 공지를 수동으로 삽입해 검증하지 않는다.

## 7. 고도화 방향과 우선순위

아래 항목은 MVP를 넓히지 않으면서 Task 5 이후의 안정성을 높이는 방향이다. **P0은 Task 5에 포함**, P1·P2는 이후 태스크가 실제로 필요로 할 때만 추가한다.

| 우선순위 | 방향 | 이유 | 착수 시점 |
| --- | --- | --- | --- |
| P0 | 고유 제약·RLS·최소 인덱스 | 중복 공지·개인정보 노출 방지의 기반 | Task 5 |
| P0 | 환경변수 fail-fast | 키 누락을 배포 전에 발견 | Task 5 |
| P1 | `updated_at` 또는 `last_seen_at`의 내부 운영 필드 | 원문 수정·수집 상태 진단 | Task 7에서 실제 변경 감지가 필요할 때 |
| P1 | 제목·작성자·게시판 복합 검색 인덱스 검토 | Task 9 피드 검색이 느릴 때만 | 실제 데이터 수와 검색 쿼리 확인 후 |
| P1 | 만료된 Web Push endpoint 정리 정책 | 410/404 발송 실패를 줄임 | Task 11 푸시 발송 구현 후 |
| P2 | 제한된 보존 기간 또는 아카이브 정책 | 무료 티어 저장 용량 관리 | 실제 용량·운영 정책이 필요할 때 |
| P2 | 읽기 전용 DB 타입 생성 | UI·크롤러 간 스키마 불일치 감소 | 데이터 모델이 안정된 뒤 |

`notices` 전문 검색, 알림 전달 로그, 사용자 선호도, 계정 기반 동기화, 행동 분석은 지금 추가하지 않는다. 비용·개인정보·운영 부담을 늘리고 현재 MVP 범위를 벗어난다.

## 8. Task 6·7과의 연결

Task 6은 `deadline` 열에 들어갈 날짜 추출 함수만 추가한다. Task 7은 `notices`의 `(board, ntt_sn)` 고유 제약을 이용해 새 공지만 upsert하고, RLS를 우회하는 `supabaseService()`를 사용한다. 따라서 Task 5는 파서의 `NoticeRow` 계약을 바꾸지 않고도 수집·저장·알림 흐름을 연결하는 안정적인 경계가 된다.
