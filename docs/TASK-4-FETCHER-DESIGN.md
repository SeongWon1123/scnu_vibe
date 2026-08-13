# Task 4 설계: 매너 크롤링 Fetcher

## 1. 목적과 범위

Task 4의 목표는 순천대 공지 목록 페이지를 **한 게시판씩 안전하게 요청**하는 공통 fetcher를 만드는 것이다. 이 단계는 공지 행을 해석하거나, 여러 게시판을 순회하거나, 데이터베이스에 저장하거나, 스케줄을 실행하지 않는다. 그 책임은 각각 Task 3의 파서, Task 7의 오케스트레이터, Task 5의 저장소 계층, Task 13의 GitHub Actions에 남겨 둔다.

> **핵심 원칙:** 요청 실패는 `throw`가 아니라 `null`로 변환한다. 이후 오케스트레이터가 게시판 단위로 실패를 기록하고 다음 게시판을 계속 처리할 수 있어야 한다.

| 구분 | Task 4에서 담당 | Task 4에서 하지 않음 |
| --- | --- | --- |
| HTTP 요청 | `BoardConfig`에서 목록 URL을 만들고 HTML을 한 번 요청 | 페이지네이션, 재시도, 동시 요청 |
| 식별 | 투명한 `SunmoaBot` User-Agent 전송 | 브라우저 위장, 헤더 우회 |
| 속도 제어 | 3초 지연 상수와 `sleep` 함수 제공 | 함수 내부에서 임의 대기 또는 분 단위 폴링 |
| 실패 처리 | HTTP·네트워크·본문 읽기 실패를 `null`로 통일 | 오류를 삼키고 성공처럼 처리 |
| 파싱 | 파서에 전달할 HTML 문자열 반환 | HTML 셀렉터 처리, 날짜·제목 추출 |

## 2. 현재 코드와의 연결

`crawler/boards.ts`가 `BoardConfig`와 `listUrl(board)`을 이미 제공하고, `crawler/parse.ts`가 성공한 HTML에서 `NoticeRow[]`를 만든다. 따라서 fetcher는 두 레이어 사이의 좁은 어댑터여야 한다. 이 분리는 네트워크 실패와 HTML 구조 변경을 분리해 진단할 수 있게 한다.

```text
BoardConfig ── listUrl ──> fetchBoardHtml ── HTML 또는 null ──> parseNoticeList ──> NoticeRow[]
                                      │                                  │
                                      └─ HTTP/네트워크 실패               └─ 오류 HTML·구조 변경
```

## 3. 공개 인터페이스

`crawler/fetch.ts`는 아래 네 항목만 내보낸다.

| 항목 | 타입 | 계약 |
| --- | --- | --- |
| `USER_AGENT` | `string` | `SunmoaBot`, 저장소 URL, `contact` 식별자를 포함한다. |
| `DELAY_MS` | `3000` | 게시판 간 최소 3초 지연의 단일 기준값이다. |
| `sleep(ms)` | `Promise<void>` | Task 7이 다음 게시판 요청 전 호출하는 순수 대기 함수다. |
| `fetchBoardHtml(board, fetchFn?)` | `Promise<string \| null>` | 성공한 2xx 응답의 HTML만 반환하고, 그 밖의 모든 실패는 `null`을 반환한다. |

권장 User-Agent 형식은 다음과 같다. 운영 이메일이 준비되기 전에는 공개 저장소의 Issues URL을 연락 창구로 사용하고, 배포 직전에 실제 모니터링 가능한 서비스 연락처로 교체한다. 개인 Git 설정의 이메일은 명시적 동의 없이 사용하지 않는다.

```text
SunmoaBot/1.0 (+https://github.com/SeongWon1123/scnu_vibe; contact: https://github.com/SeongWon1123/scnu_vibe/issues)
```

## 4. 요청·응답 규칙

`fetchBoardHtml`은 `listUrl(board)`만 요청하고, 헤더에는 테스트 가능한 단일 `User-Agent`만 보낸다. 기본값은 Node 22의 전역 `fetch`이며, 두 번째 인수 `fetchFn`으로 대체할 수 있어야 단위 테스트가 실제 학교 서버를 호출하지 않는다.

| 상황 | 동작 | 반환 | 로그 |
| --- | --- | --- | --- |
| 2xx + 본문 읽기 성공 | `response.text()` 실행 | HTML 문자열 | 없음 |
| 3xx/4xx/5xx | 본문을 파싱하지 않음 | `null` | 게시판 key와 HTTP 상태 |
| DNS·연결·TLS 오류 | 예외를 잡음 | `null` | 게시판 key와 오류 메시지 |
| `response.text()` 실패 | 예외를 잡음 | `null` | 게시판 key와 오류 메시지 |
| 200이지만 학교의 오류 HTML | HTML 반환 | 문자열 | 없음; Task 3 파서가 `[]` 처리 |

HTTP 200은 전송 성공일 뿐 목록이 유효하다는 뜻은 아니다. 실제로 `bbsId`가 누락된 학교 페이지는 HTTP 200으로 오류 문서를 반환한다. 이 경우 fetcher가 본문을 그대로 반환하고, `parseNoticeList`가 오류 문구를 감지해 빈 배열을 반환하는 현재 분리가 맞다.

## 5. 크롤링 매너의 책임 분리

3초 대기는 fetch 함수 안이 아니라 **Task 7의 게시판 순회 루프**에 둔다. 그래야 단위 테스트가 불필요하게 3초씩 느려지지 않고, 요청 순서가 생기는 곳에서만 정확히 한 번 대기할 수 있다. 오케스트레이터의 의사 코드는 다음과 같다.

```ts
for (const board of BOARDS) {
  const html = await fetchBoardHtml(board)
  if (html !== null) {
    const rows = parseNoticeList(html, board)
    // 저장·변경분 계산은 Task 7에서 수행
  }
  await sleep(DELAY_MS)
}
```

> 스케줄 시간(07:00, 12:30, 18:30 KST), 최신 1~2페이지 제한, robots.txt 재확인, 마지막 글 번호 비교는 Task 7·Task 13에서 조합해 강제한다. Task 4는 그 정책을 깨뜨리지 않는 최소 네트워크 함수만 제공한다.

## 6. 테스트 설계

`tests/fetch.test.ts`는 `vi.fn()`으로 주입한 `fetchFn`만 사용한다. 단위 테스트가 실제 학교 홈페이지에 요청하면 느리고 변동 가능하며 매너 크롤링 정책도 흐려진다.

| 테스트 | 준비 | 기대 결과 |
| --- | --- | --- |
| 정상 요청 | 200 `Response` mock | 정확한 목록 URL·User-Agent로 한 번 호출되고 HTML 반환 |
| HTTP 실패 | 403 또는 500 `Response` mock | `null` 반환, 예외 전파 없음 |
| 네트워크 실패 | `ECONNRESET` reject mock | `null` 반환, 예외 전파 없음 |
| 지연 기준 | 상수 검사 | `DELAY_MS >= 3000` |
| 식별성 | 문자열 검사 | `SunmoaBot`, `contact`, 저장소 URL 포함 |
| 본문 읽기 실패 | `text()`가 reject되는 Response mock | `null` 반환 |

첫 다섯 항목은 Task 4의 최소 완료 기준이고, 마지막 항목은 실패 경로를 더 명확히 하는 권장 보강 테스트다.

## 7. 구현 순서와 완료 기준

1. `tests/fetch.test.ts`를 먼저 작성하고 모듈 부재 실패를 확인한다.
2. `crawler/fetch.ts`에 상수·대기 함수·주입 가능한 `fetchFn`을 구현한다.
3. fetcher 전용 테스트를 실행한다.
4. 전체 검증으로 `npm test`, `npm run lint`, `npm run build`를 실행한다.
5. `HANDOVER.md`에 Task 4 완료와 Task 5 시작 조건을 갱신한다.
6. `feat: polite board fetcher with bot UA and error tolerance` 커밋으로 분리하고 GitHub `main`에 반영한다.

| 완료 조건 | 판정 방법 |
| --- | --- |
| 실서버를 단위 테스트에서 호출하지 않음 | 테스트의 모든 응답이 mock임을 확인 |
| 실패가 다음 게시판으로 전파되지 않음 | HTTP·네트워크·본문 실패 테스트가 모두 `null` 반환 |
| 식별 가능하고 저비용임 | User-Agent·3초 지연 상수 검증, 재시도·유료 API 없음 |
| Task 7과 연결 가능 | `BoardConfig`, `listUrl`, `parseNoticeList` 계약을 변경하지 않음 |
| 배포 전 품질 확보 | 전체 테스트·린트·빌드 통과 |

## 8. 구현 시 피해야 할 것

- fetcher 내부의 자동 재시도, 병렬 요청, 숨겨진 폴링을 추가하지 않는다.
- 오류 응답 본문이나 전체 HTML을 로그에 남기지 않는다. 로그에는 게시판 key와 상태/오류 메시지만 남긴다.
- 실제 운영 연락처가 준비되지 않은 상태에서 개인 이메일을 코드에 하드코딩하지 않는다.
- Supabase, Web Push, 마감일 추출, GitHub Actions cron을 이 태스크에 섞지 않는다.
- `null`을 빈 문자열로 바꾸지 않는다. `null`은 **네트워크 계층 실패**, 빈 배열은 **파싱 계층에서 유효한 공지를 찾지 못함**이라는 구분을 보존한다.
