# 순모아 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 순천대의 분산된 공지 6개 게시판 + 통학버스 시간표를 한 화면에 모으고, 키워드 웹푸시 알림과 "캘린더에 추가"를 제공하는 무료 웹 서비스.

**Architecture:** Next.js(App Router, Vercel 무료) 프론트 + Supabase(무료 티어) 저장소 + GitHub Actions 크론(1일 3회)으로 도는 Node 크롤러. 크롤러가 새 공지를 Supabase에 넣고, 키워드 매칭된 구독자에게 web-push로 알림을 보낸다. 서버 상주 프로세스 없음 → 월 유지비 0원.

**Tech Stack:** Next.js 15+ (TypeScript, Tailwind), Supabase (Postgres), node-html-parser, web-push, tsx, Vitest, GitHub Actions.

## Global Constraints

CLAUDE.md(스펙)에서 그대로 가져온 프로젝트 전역 규칙 — 모든 태스크에 적용:

- 크롤링 주기 1일 3회: KST 07:00 / 12:30 / 18:30 (UTC cron: `0 22 * * *`, `30 3 * * *`, `30 9 * * *`). 분 단위 폴링 절대 금지.
- 게시판 간 요청 딜레이 최소 3초, 게시판당 목록 1페이지만 조회.
- User-Agent: `SunmoaBot/1.0 (+github repo URL; contact: 운영자 이메일)` — 실제 값으로 채울 것.
- 면책 문구(모든 페이지 상단 고정, 원문 그대로):
  "본 서비스는 국립순천대학교 공식 서비스가 아닙니다. 크롤링 지연·오류로 정보가 다를 수 있으니, 마감일 등 중요한 정보는 반드시 학교 홈페이지 원문을 확인하세요."
- 모든 공지 항목에 학교 홈페이지 원문 링크 필수.
- 자동 추출된 마감일에는 "자동 인식" 배지 표시.
- UI 텍스트는 한국어, 코드·커밋 메시지는 영어.
- 개인정보 최소화: 푸시 endpoint/keys + 키워드 외에는 아무것도 저장하지 않는다. 로그인·회원가입 없음.
- 파서는 게시판별 설정 기반 모듈로 분리 — 한 게시판이 깨져도 나머지는 동작해야 함.
- 유료 서비스·유료 API 사용 금지 (Vercel/Supabase/GitHub 무료 티어만).

## 사전 검증된 사실 (2026-08-12 확인)

- 게시판 목록 URL: `https://www.scnu.ac.kr/{site}/na/ntt/selectNttList.do?mi={mi}&bbsId={bbsId}` — **mi와 bbsId 둘 다 필수** (하나라도 빠지면 "유효하지 않은 요청입니다" alert 페이지 반환, HTTP 200이지만 본문 ~209 bytes).
- 서버렌더링 HTML. 목록은 `<table>` 이고 컬럼: 번호(고정공지는 `<b class="btn_S btn_red">공지</b>`) / 제목 / 작성자 / 등록일(`YYYY.MM.DD`) / 조회 / 첨부.
- 제목 셀: `<td class="ta_l"><a href="/SCNU/na/ntt/selectNttInfo.do?nttSn=281316080&mi=1132&currPage=1">…제목 텍스트…</a></td>`. 고정공지는 `<a>` 안에 배지 `<b>` 가 한 번 더 들어감.
- 작성자 셀: `<td class="BD_listUser">교무학사과 학사지원팀 </td>` (뒤 공백 있음).
- 검증된 게시판 6개:

| key | 이름 | site | mi | bbsId |
|---|---|---|---|---|
| general | 공지 | SCNU | 1131 | 1040 |
| academic | 학사 | SCNU | 1132 | 1041 |
| scholarship | 장학 | SCNU | 8690 | 4487 |
| event | 교내행사 | SCNU | 1188 | 1067 |
| recruit | 모집·채용 | SCNU | 1189 | 1068 |
| dorm | 생활관 | dorm | 1337 | 1126 |

- 통학버스 공식 안내 페이지(시간표 원천): `https://www.scnu.ac.kr/haksa/cm/cntnts/cntntsView.do?mi=1511&cntntsId=1353`
- 크롤링은 데스크톱 UA로 차단 없이 동작 확인됨 (curl 200, 목록 페이지 ~120KB).

---

### Task 1: 프로젝트 스캐폴드 (Next.js + Vitest)

**Files:**
- Create: 프로젝트 루트에 Next.js 앱 (create-next-app이 생성)
- Create: `vitest.config.ts`
- Create: `.env.local.example`
- Modify: `package.json` (scripts 추가)

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `npm test` = vitest 실행, `npm run crawl` = `tsx crawler/index.ts` 실행 (이후 모든 태스크가 이 스크립트 사용)

- [ ] **Step 1: Next.js 앱 생성**

프로젝트 루트(`C:\Users\Administrator\Desktop\Vibe Coding`)가 이미 git 저장소이고 CLAUDE.md/docs가 있으므로, 현재 디렉토리에 생성한다:

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

기존 CLAUDE.md·docs 폴더와 충돌 경고가 나오면 임시 폴더에 생성 후 파일을 루트로 이동한다 (`.git`, `CLAUDE.md`, `docs/` 는 보존).

- [ ] **Step 2: 테스트/크롤러 도구 설치**

```powershell
npm install node-html-parser web-push @supabase/supabase-js
npm install -D vitest tsx @types/web-push
```

- [ ] **Step 3: vitest 설정 및 스크립트 추가**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
```

`package.json` scripts에 추가:

```json
"test": "vitest run",
"test:watch": "vitest",
"crawl": "tsx crawler/index.ts"
```

- [ ] **Step 4: 환경변수 예시 파일 작성**

`.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY   # server/crawler only, NEVER exposed to client
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:YOUR_EMAIL
```

- [ ] **Step 5: 스모크 테스트 작성 및 실행**

`tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('project setup', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test` → Expected: 1 passed.
Run: `npm run build` → Expected: 빌드 성공.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with vitest and crawler tooling"
```

---

### Task 2: 크롤링 대상 문서화 + HTML 픽스처 확보

**Files:**
- Create: `docs/crawl-targets.md`
- Create: `crawler/boards.ts`
- Create: `tests/fixtures/list-academic.html` (학사 게시판 실제 HTML)
- Create: `tests/fixtures/list-invalid.html` (파라미터 누락 시 에러 페이지)
- Test: `tests/boards.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `BoardKey = 'general' | 'academic' | 'scholarship' | 'event' | 'recruit' | 'dorm'`
  - `interface BoardConfig { key: BoardKey; label: string; site: 'SCNU' | 'dorm'; mi: number; bbsId: number }`
  - `const BOARDS: BoardConfig[]` (6개)
  - `function listUrl(board: BoardConfig): string`
  - `function detailUrl(board: BoardConfig, nttSn: number): string`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/boards.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { BOARDS, listUrl, detailUrl } from '@/crawler/boards'

describe('board config', () => {
  it('has 6 boards with unique keys', () => {
    expect(BOARDS).toHaveLength(6)
    expect(new Set(BOARDS.map(b => b.key)).size).toBe(6)
  })

  it('builds list URL with both mi and bbsId', () => {
    const academic = BOARDS.find(b => b.key === 'academic')!
    expect(listUrl(academic)).toBe(
      'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttList.do?mi=1132&bbsId=1041'
    )
  })

  it('builds dorm URLs on the dorm site path', () => {
    const dorm = BOARDS.find(b => b.key === 'dorm')!
    expect(listUrl(dorm)).toContain('/dorm/na/ntt/selectNttList.do')
    expect(detailUrl(dorm, 123)).toBe(
      'https://www.scnu.ac.kr/dorm/na/ntt/selectNttInfo.do?nttSn=123&mi=1337'
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/boards.test.ts`
Expected: FAIL — "Cannot find module '@/crawler/boards'"

- [ ] **Step 3: boards.ts 구현**

`crawler/boards.ts`:

```ts
export type BoardKey = 'general' | 'academic' | 'scholarship' | 'event' | 'recruit' | 'dorm'

export interface BoardConfig {
  key: BoardKey
  label: string
  site: 'SCNU' | 'dorm'
  mi: number
  bbsId: number
}

export const BASE = 'https://www.scnu.ac.kr'

// Verified 2026-08-12. Both mi AND bbsId are required — missing either
// returns a 200 "유효하지 않은 요청입니다" alert page (~209 bytes).
export const BOARDS: BoardConfig[] = [
  { key: 'general',     label: '공지',      site: 'SCNU', mi: 1131, bbsId: 1040 },
  { key: 'academic',    label: '학사',      site: 'SCNU', mi: 1132, bbsId: 1041 },
  { key: 'scholarship', label: '장학',      site: 'SCNU', mi: 8690, bbsId: 4487 },
  { key: 'event',       label: '교내행사',  site: 'SCNU', mi: 1188, bbsId: 1067 },
  { key: 'recruit',     label: '모집·채용', site: 'SCNU', mi: 1189, bbsId: 1068 },
  { key: 'dorm',        label: '생활관',    site: 'dorm', mi: 1337, bbsId: 1126 },
]

export function listUrl(b: BoardConfig): string {
  return `${BASE}/${b.site}/na/ntt/selectNttList.do?mi=${b.mi}&bbsId=${b.bbsId}`
}

export function detailUrl(b: BoardConfig, nttSn: number): string {
  return `${BASE}/${b.site}/na/ntt/selectNttInfo.do?nttSn=${nttSn}&mi=${b.mi}`
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/boards.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 실제 HTML 픽스처 다운로드**

```powershell
New-Item -ItemType Directory -Force tests/fixtures
curl.exe -s -A "SunmoaBot/1.0 (fixture download)" "https://www.scnu.ac.kr/SCNU/na/ntt/selectNttList.do?mi=1132&bbsId=1041" -o tests/fixtures/list-academic.html
curl.exe -s -A "SunmoaBot/1.0 (fixture download)" "https://www.scnu.ac.kr/SCNU/na/ntt/selectNttList.do?mi=1132" -o tests/fixtures/list-invalid.html
```

검증: `list-academic.html` 크기가 50KB 이상이고 `selectNttInfo.do` 문자열 포함, `list-invalid.html`은 "유효하지 않은 요청" 포함. 아니라면 네트워크/차단 문제이므로 중단하고 보고.

- [ ] **Step 6: docs/crawl-targets.md 작성**

이 계획 상단의 "사전 검증된 사실" 섹션 내용(URL 패턴, 게시판 표, HTML 구조, 확인 날짜)을 그대로 문서로 옮긴다. 이후 학교 홈페이지 개편으로 파서가 깨지면 이 문서를 갱신한다는 안내 한 줄 포함.

- [ ] **Step 7: Commit**

```bash
git add crawler/boards.ts tests/boards.test.ts tests/fixtures docs/crawl-targets.md
git commit -m "feat: add verified board configs, fixtures, and crawl target docs"
```

---

### Task 3: 게시판 목록 파서

**Files:**
- Create: `crawler/parse.ts`
- Test: `tests/parse.test.ts`

**Interfaces:**
- Consumes: `BoardConfig`, `detailUrl` (Task 2)
- Produces:
  - `interface NoticeRow { nttSn: number; title: string; author: string; postedAt: string /* 'YYYY-MM-DD' */; isPinned: boolean; url: string }`
  - `function parseNoticeList(html: string, board: BoardConfig): NoticeRow[]` — 에러 페이지·빈 페이지면 `[]` 반환 (throw 금지: 게시판 하나가 깨져도 전체 크롤은 계속)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/parse.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { parseNoticeList } from '@/crawler/parse'
import { BOARDS } from '@/crawler/boards'

const academic = BOARDS.find(b => b.key === 'academic')!
const fixture = readFileSync('tests/fixtures/list-academic.html', 'utf-8')
const invalid = readFileSync('tests/fixtures/list-invalid.html', 'utf-8')

describe('parseNoticeList', () => {
  it('extracts rows from a real board page', () => {
    const rows = parseNoticeList(fixture, academic)
    expect(rows.length).toBeGreaterThanOrEqual(5)
    for (const r of rows) {
      expect(r.nttSn).toBeGreaterThan(0)
      expect(r.title.length).toBeGreaterThan(0)
      expect(r.title).not.toContain('공지')       // badge text must be stripped... see note below
      expect(r.postedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(r.url).toMatch(/^https:\/\/www\.scnu\.ac\.kr\/SCNU\/na\/ntt\/selectNttInfo\.do\?nttSn=\d+&mi=1132$/)
    }
  })

  it('marks pinned rows and trims author whitespace', () => {
    const rows = parseNoticeList(fixture, academic)
    const pinned = rows.filter(r => r.isPinned)
    expect(pinned.length).toBeGreaterThanOrEqual(1)
    for (const r of rows) expect(r.author).toBe(r.author.trim())
  })

  it('returns [] for the invalid-request error page', () => {
    expect(parseNoticeList(invalid, academic)).toEqual([])
  })

  it('returns [] for empty html', () => {
    expect(parseNoticeList('', academic)).toEqual([])
  })
})
```

주의: 첫 테스트의 `not.toContain('공지')` 단언은 제목 자체에 "공지"가 들어간 글(예: "휴학 공지")에서 오탐할 수 있다. 픽스처를 열어 실제 제목을 확인하고, 오탐하면 해당 단언을 `expect(r.title).not.toMatch(/^\s*공지\s*/)` (앞머리 배지 잔재 검사)로 교체한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/parse.test.ts`
Expected: FAIL — "Cannot find module '@/crawler/parse'"

- [ ] **Step 3: 파서 구현**

`crawler/parse.ts`:

```ts
import { parse } from 'node-html-parser'
import { BoardConfig, detailUrl } from './boards'

export interface NoticeRow {
  nttSn: number
  title: string
  author: string
  postedAt: string // 'YYYY-MM-DD'
  isPinned: boolean
  url: string
}

export function parseNoticeList(html: string, board: BoardConfig): NoticeRow[] {
  if (!html || html.includes('유효하지 않은 요청')) return []
  const root = parse(html)
  const rows: NoticeRow[] = []

  for (const tr of root.querySelectorAll('table tbody tr')) {
    const link = tr.querySelector('td.ta_l a')
    if (!link) continue

    const href = link.getAttribute('href') ?? ''
    const sn = href.match(/nttSn=(\d+)/)
    if (!sn) continue
    const nttSn = Number(sn[1])

    // The title cell may contain a pinned badge <b>공지</b> inside the <a>.
    const isPinned = link.querySelector('b') !== null
    link.querySelectorAll('b').forEach(b => b.remove())
    const title = link.text.replace(/\s+/g, ' ').trim()
    if (!title) continue

    const author = (tr.querySelector('td.BD_listUser')?.text ?? '').trim()

    const dateMatch = tr.text.match(/(\d{4})\.(\d{2})\.(\d{2})/)
    if (!dateMatch) continue
    const postedAt = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`

    rows.push({ nttSn, title, author, postedAt, isPinned, url: detailUrl(board, nttSn) })
  }
  return rows
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/parse.test.ts`
Expected: PASS (4 tests). 실패하면 픽스처 HTML을 직접 열어 셀렉터를 실제 구조에 맞게 조정한다 (구조는 docs/crawl-targets.md 참조).

- [ ] **Step 5: Commit**

```bash
git add crawler/parse.ts tests/parse.test.ts
git commit -m "feat: parse notice list rows from board HTML"
```

---

### Task 4: 매너 크롤링 fetcher

**Files:**
- Create: `crawler/fetch.ts`
- Test: `tests/fetch.test.ts`

**Interfaces:**
- Consumes: `BoardConfig`, `listUrl` (Task 2)
- Produces:
  - `const USER_AGENT: string`
  - `const DELAY_MS = 3000`
  - `function sleep(ms: number): Promise<void>`
  - `function fetchBoardHtml(board: BoardConfig, fetchFn?: typeof fetch): Promise<string | null>` — HTTP 오류·네트워크 오류 시 null (throw 금지)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/fetch.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { fetchBoardHtml, USER_AGENT, DELAY_MS } from '@/crawler/fetch'
import { BOARDS, listUrl } from '@/crawler/boards'

const board = BOARDS[0]

describe('fetchBoardHtml', () => {
  it('requests the list URL with the SunmoaBot user agent', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('<html>ok</html>', { status: 200 }))
    const html = await fetchBoardHtml(board, fetchFn as unknown as typeof fetch)
    expect(html).toBe('<html>ok</html>')
    expect(fetchFn).toHaveBeenCalledWith(listUrl(board), {
      headers: { 'User-Agent': USER_AGENT },
    })
  })

  it('returns null on http error status', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('blocked', { status: 403 }))
    expect(await fetchBoardHtml(board, fetchFn as unknown as typeof fetch)).toBeNull()
  })

  it('returns null on network failure instead of throwing', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    expect(await fetchBoardHtml(board, fetchFn as unknown as typeof fetch)).toBeNull()
  })

  it('declares a polite delay of at least 3 seconds', () => {
    expect(DELAY_MS).toBeGreaterThanOrEqual(3000)
  })

  it('identifies the bot and a contact in the user agent', () => {
    expect(USER_AGENT).toContain('SunmoaBot')
    expect(USER_AGENT).toContain('contact')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/fetch.test.ts`
Expected: FAIL — "Cannot find module '@/crawler/fetch'"

- [ ] **Step 3: fetcher 구현**

`crawler/fetch.ts`:

```ts
import { BoardConfig, listUrl } from './boards'

// TODO-at-execution: replace repo URL and email with the real ones before first deploy.
export const USER_AGENT =
  'SunmoaBot/1.0 (+https://github.com/OWNER/sunmoa; contact: OWNER_EMAIL)'

export const DELAY_MS = 3000

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchBoardHtml(
  board: BoardConfig,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const res = await fetchFn(listUrl(board), { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      console.error(`[fetch] ${board.key}: HTTP ${res.status}`)
      return null
    }
    return await res.text()
  } catch (err) {
    console.error(`[fetch] ${board.key}: ${(err as Error).message}`)
    return null
  }
}
```

`USER_AGENT`의 OWNER/OWNER_EMAIL은 GitHub 저장소를 만드는 Task 13에서 실제 값으로 교체한다 (교체 전까지 테스트는 'SunmoaBot'과 'contact' 포함 여부만 검사하므로 통과함).

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/fetch.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add crawler/fetch.ts tests/fetch.test.ts
git commit -m "feat: polite board fetcher with bot UA and error tolerance"
```

---

### Task 5: Supabase 스키마 + 클라이언트

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `lib/supabase.ts`
- Test: 수동 검증 (아래 Step 4)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `notices` 테이블 (unique (board, ntt_sn)), anon은 select만 가능
  - `push_subscriptions` 테이블, anon 정책 없음 (service role 전용)
  - `function supabaseAnon(): SupabaseClient` — 브라우저/SSR 읽기용
  - `function supabaseService(): SupabaseClient` — 크롤러/API route 쓰기용 (SUPABASE_SERVICE_ROLE_KEY 필요)

- [ ] **Step 1: Supabase 프로젝트 준비**

Supabase MCP 도구(`list_projects`)로 기존 프로젝트를 확인하고, 없으면 무료 티어 프로젝트를 생성한다(`create_project`, 비용 확인 시 free 티어 $0 확인). 생성 후 `get_project_url`·`get_publishable_keys`로 URL과 anon key를 얻어 `.env.local`에 기록한다. service role key는 대시보드에서 복사하도록 사용자에게 안내한다 (자동화 불가 시).

- [ ] **Step 2: 마이그레이션 SQL 작성**

`supabase/migrations/0001_init.sql`:

```sql
-- notices: crawled school announcements. Public read, service-role write.
create table public.notices (
  id bigint generated always as identity primary key,
  board text not null,
  ntt_sn bigint not null,
  title text not null,
  author text not null default '',
  posted_at date not null,
  url text not null,
  is_pinned boolean not null default false,
  deadline date,
  created_at timestamptz not null default now(),
  unique (board, ntt_sn)
);

create index notices_posted_at_idx on public.notices (posted_at desc, id desc);
create index notices_board_posted_idx on public.notices (board, posted_at desc);

alter table public.notices enable row level security;

create policy notices_public_read on public.notices
  for select to anon, authenticated using (true);
-- no insert/update/delete policies: only the service role (bypasses RLS) writes.

-- push_subscriptions: web push endpoints + user keywords. No client access at all;
-- all reads/writes go through the service role (crawler + Next.js API route).
create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
-- intentionally zero policies.
```

- [ ] **Step 3: 마이그레이션 적용**

Supabase MCP `apply_migration` 도구로 위 SQL을 적용한다 (name: `init`). 적용 후 `list_tables`로 두 테이블 존재와 `rls_enabled: true` 확인.

- [ ] **Step 4: 클라이언트 헬퍼 작성 및 수동 검증**

`lib/supabase.ts`:

```ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function supabaseAnon(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Server-side only (crawler, API routes). Never import from client components.
export function supabaseService(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}
```

검증 (Supabase MCP `execute_sql` 사용):

```sql
insert into public.notices (board, ntt_sn, title, author, posted_at, url)
values ('academic', 1, 'test notice', 'tester', '2026-08-12', 'https://example.com')
on conflict (board, ntt_sn) do nothing;
select count(*) from public.notices;
delete from public.notices where ntt_sn = 1 and board = 'academic';
```

Expected: insert 성공, count 1, delete 후 0.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_init.sql lib/supabase.ts
git commit -m "feat: notices and push_subscriptions schema with RLS, supabase clients"
```

---

### Task 6: 마감일 자동 추출

**Files:**
- Create: `lib/deadline.ts`
- Test: `tests/deadline.test.ts`

**Interfaces:**
- Consumes: 없음 (순수 함수)
- Produces: `function extractDeadline(title: string, postedAt: string): string | null` — 제목에서 마감일을 찾으면 'YYYY-MM-DD', 없으면 null. `postedAt`('YYYY-MM-DD')은 연도 생략된 날짜의 연도 추론에 사용.

동작 규칙 (v1, 제목만 분석):
1. 인식 패턴: `2026. 8. 13.` / `2026.8.13` / `2026-08-13` / `8. 13.` / `8.13` / `8월 13일`
2. 제목에 `~` 또는 `까지`가 있으면 → 발견된 날짜 중 **마지막** 날짜를 마감일로 반환
3. `~`/`까지` 가 없으면 → null (개최일·행사일을 마감일로 오인하지 않기 위해)
4. 연도 없는 날짜는 postedAt의 연도를 쓰되, 결과가 postedAt보다 6개월 이상 과거면 이듬해로 보정 (12월 공지의 1월 마감 케이스)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/deadline.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { extractDeadline } from '@/lib/deadline'

describe('extractDeadline', () => {
  it('extracts full date after a tilde range', () => {
    expect(extractDeadline('2026-2학기 국가장학금 신청 안내(~2026. 8. 13.)', '2026-07-28'))
      .toBe('2026-08-13')
  })

  it('extracts short date with 까지, inferring year from postedAt', () => {
    expect(extractDeadline('셔틀 신청 8. 13.(목)까지', '2026-07-28')).toBe('2026-08-13')
  })

  it('handles 월/일 korean format', () => {
    expect(extractDeadline('수강 정정 8월 13일까지 접수', '2026-08-01')).toBe('2026-08-13')
  })

  it('takes the last date of a range', () => {
    expect(extractDeadline('신청기간: 8. 7. ~ 8. 13.', '2026-08-01')).toBe('2026-08-13')
  })

  it('rolls year forward for january deadline posted in december', () => {
    expect(extractDeadline('동계 근로 신청 ~1. 10.', '2026-12-20')).toBe('2027-01-10')
  })

  it('returns null when no range marker exists', () => {
    expect(extractDeadline('2026학년도 입학식 8. 20. 개최', '2026-08-01')).toBeNull()
  })

  it('returns null when no date exists', () => {
    expect(extractDeadline('생활관 소음 관련 안내', '2026-08-01')).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/deadline.test.ts`
Expected: FAIL — "Cannot find module '@/lib/deadline'"

- [ ] **Step 3: 구현**

`lib/deadline.ts`:

```ts
const FULL = /(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/g
const SHORT = /(?<!\d[.\-/]\s?)(\d{1,2})\s*[.월]\s*(\d{1,2})\s*일?/g

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function extractDeadline(title: string, postedAt: string): string | null {
  if (!/[~∼]|까지/.test(title)) return null

  const posted = new Date(`${postedAt}T00:00:00`)
  const dates: Date[] = []

  for (const m of title.matchAll(FULL)) {
    dates.push(new Date(`${m[1]}-${pad(+m[2])}-${pad(+m[3])}T00:00:00`))
  }
  // Only look for short dates in text with full-date matches removed,
  // so "2026. 8. 13." does not also match as short "8. 13.".
  const remainder = title.replace(FULL, ' ')
  for (const m of remainder.matchAll(SHORT)) {
    const month = +m[1], day = +m[2]
    if (month < 1 || month > 12 || day < 1 || day > 31) continue
    let d = new Date(`${posted.getFullYear()}-${pad(month)}-${pad(day)}T00:00:00`)
    // A "deadline" far in the past relative to posting means next year (Dec -> Jan).
    if (posted.getTime() - d.getTime() > 180 * 24 * 3600 * 1000) {
      d = new Date(`${posted.getFullYear() + 1}-${pad(month)}-${pad(day)}T00:00:00`)
    }
    dates.push(d)
  }

  if (dates.length === 0) return null
  const last = dates[dates.length - 1]
  if (isNaN(last.getTime())) return null
  return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/deadline.test.ts`
Expected: PASS (7 tests). 정규식 미세조정이 필요하면 테스트를 기준으로 수정 (테스트가 스펙이다).

- [ ] **Step 5: Commit**

```bash
git add lib/deadline.ts tests/deadline.test.ts
git commit -m "feat: extract deadlines from notice titles"
```

---

### Task 7: 크롤러 오케스트레이터

**Files:**
- Create: `crawler/index.ts`
- Create: `crawler/diff.ts`
- Test: `tests/diff.test.ts`

**Interfaces:**
- Consumes: `BOARDS`, `fetchBoardHtml`, `sleep`, `DELAY_MS` (Task 4), `parseNoticeList`, `NoticeRow` (Task 3), `supabaseService` (Task 5), `extractDeadline` (Task 6)
- Produces:
  - `function selectNew(rows: NoticeRow[], knownSns: Set<number>): NoticeRow[]` (diff.ts)
  - `npm run crawl` 실행 시: 전 게시판 순회(3초 간격) → 새 공지 insert → 삽입된 공지 배열을 리턴하는 `runCrawl(): Promise<InsertedNotice[]>` (push 태스크가 재사용)
  - `interface InsertedNotice { board: string; nttSn: number; title: string; url: string }`

- [ ] **Step 1: diff 로직 실패하는 테스트 작성**

`tests/diff.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { selectNew } from '@/crawler/diff'
import type { NoticeRow } from '@/crawler/parse'

function row(nttSn: number): NoticeRow {
  return { nttSn, title: `t${nttSn}`, author: 'a', postedAt: '2026-08-12', isPinned: false, url: `u${nttSn}` }
}

describe('selectNew', () => {
  it('keeps only rows whose nttSn is not already known', () => {
    const rows = [row(1), row(2), row(3)]
    expect(selectNew(rows, new Set([1, 3])).map(r => r.nttSn)).toEqual([2])
  })

  it('returns all rows when nothing is known (first run)', () => {
    expect(selectNew([row(1), row(2)], new Set()).length).toBe(2)
  })

  it('returns [] when everything is known', () => {
    expect(selectNew([row(1)], new Set([1]))).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/diff.test.ts`
Expected: FAIL — "Cannot find module '@/crawler/diff'"

- [ ] **Step 3: diff.ts 구현**

`crawler/diff.ts`:

```ts
import type { NoticeRow } from './parse'

export function selectNew(rows: NoticeRow[], knownSns: Set<number>): NoticeRow[] {
  return rows.filter(r => !knownSns.has(r.nttSn))
}
```

Run: `npx vitest run tests/diff.test.ts` → Expected: PASS (3 tests)

- [ ] **Step 4: 오케스트레이터 구현**

`crawler/index.ts`:

```ts
import { BOARDS } from './boards'
import { fetchBoardHtml, sleep, DELAY_MS } from './fetch'
import { parseNoticeList } from './parse'
import { selectNew } from './diff'
import { extractDeadline } from '../lib/deadline'
import { supabaseService } from '../lib/supabase'

export interface InsertedNotice {
  board: string
  nttSn: number
  title: string
  url: string
}

export async function runCrawl(): Promise<InsertedNotice[]> {
  const db = supabaseService()
  const inserted: InsertedNotice[] = []

  for (const board of BOARDS) {
    const html = await fetchBoardHtml(board)
    if (html === null) {
      await sleep(DELAY_MS)
      continue // one broken board must not kill the rest
    }

    const rows = parseNoticeList(html, board)
    if (rows.length === 0) {
      console.error(`[crawl] ${board.key}: parsed 0 rows (layout change?)`)
      await sleep(DELAY_MS)
      continue
    }

    const { data: known, error: selErr } = await db
      .from('notices')
      .select('ntt_sn')
      .eq('board', board.key)
      .in('ntt_sn', rows.map(r => r.nttSn))
    if (selErr) throw selErr

    const fresh = selectNew(rows, new Set((known ?? []).map(k => Number(k.ntt_sn))))
    if (fresh.length === 0) {
      console.log(`[crawl] ${board.key}: no new notices`)
      await sleep(DELAY_MS)
      continue
    }

    const { error: insErr } = await db.from('notices').upsert(
      fresh.map(r => ({
        board: board.key,
        ntt_sn: r.nttSn,
        title: r.title,
        author: r.author,
        posted_at: r.postedAt,
        url: r.url,
        is_pinned: r.isPinned,
        deadline: extractDeadline(r.title, r.postedAt),
      })),
      { onConflict: 'board,ntt_sn', ignoreDuplicates: true },
    )
    if (insErr) throw insErr

    console.log(`[crawl] ${board.key}: +${fresh.length} new`)
    inserted.push(...fresh.map(r => ({ board: board.key, nttSn: r.nttSn, title: r.title, url: r.url })))
    await sleep(DELAY_MS)
  }

  return inserted
}

// CLI entry: `npm run crawl`
if (process.argv[1]?.includes('crawler')) {
  runCrawl()
    .then(n => console.log(`[crawl] done, ${n.length} inserted total`))
    .catch(err => { console.error(err); process.exit(1) }) // non-zero exit -> Actions failure alert
}
```

환경변수 로드: tsx는 `.env.local`을 자동 로드하지 않으므로 `package.json`의 crawl 스크립트를 `"crawl": "tsx --env-file=.env.local crawler/index.ts"`로 수정한다 (GitHub Actions에서는 env가 직접 주입되므로 `--env-file` 없이도 동작하도록 `--env-file-if-exists=.env.local` 사용, Node 22+/tsx 4.20+ 지원. 미지원 버전이면 crawl 스크립트를 로컬용 `crawl:local`과 CI용 `crawl`로 분리).

- [ ] **Step 5: 전체 테스트 + 실제 1회 실행**

Run: `npm test` → Expected: 전부 PASS
Run: `npm run crawl` (Supabase env 설정 후) → Expected: 각 게시판 로그가 3초 간격으로 출력되고, 첫 실행이므로 게시판당 10건 내외 insert. 두 번째 실행에서는 전부 "no new notices".

Supabase MCP `execute_sql`로 확인: `select board, count(*) from public.notices group by board;` → 6개 board 각각 1건 이상.

- [ ] **Step 6: Commit**

```bash
git add crawler/index.ts crawler/diff.ts tests/diff.test.ts package.json
git commit -m "feat: crawl orchestrator with per-board isolation and dedup"
```

---

### Task 8: 캘린더 연동 (Google Calendar URL + ICS)

**Files:**
- Create: `lib/calendar.ts`
- Create: `app/api/ics/route.ts`
- Test: `tests/calendar.test.ts`

**Interfaces:**
- Consumes: 없음 (순수 함수)
- Produces:
  - `function googleCalendarUrl(title: string, dateISO: string, noticeUrl: string): string` — 종일 일정 템플릿 URL
  - `function buildIcs(title: string, dateISO: string, noticeUrl: string): string` — VCALENDAR 텍스트
  - `GET /api/ics?title=...&date=YYYY-MM-DD&url=...` → `text/calendar` 다운로드 (아이폰용)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/calendar.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { googleCalendarUrl, buildIcs } from '@/lib/calendar'

describe('googleCalendarUrl', () => {
  it('builds an all-day event url (end date exclusive, +1 day)', () => {
    const url = googleCalendarUrl('장학금 신청 마감', '2026-08-13', 'https://scnu.ac.kr/x')
    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE')
    expect(url).toContain('dates=20260813%2F20260814')
    expect(url).toContain(encodeURIComponent('장학금 신청 마감'))
    expect(url).toContain(encodeURIComponent('https://scnu.ac.kr/x'))
  })
})

describe('buildIcs', () => {
  it('produces a valid all-day VEVENT', () => {
    const ics = buildIcs('장학금 신청 마감', '2026-08-13', 'https://scnu.ac.kr/x')
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART;VALUE=DATE:20260813')
    expect(ics).toContain('DTEND;VALUE=DATE:20260814')
    expect(ics).toContain('SUMMARY:장학금 신청 마감')
    expect(ics).toContain('END:VCALENDAR')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/calendar.test.ts`
Expected: FAIL — "Cannot find module '@/lib/calendar'"

- [ ] **Step 3: 구현**

`lib/calendar.ts`:

```ts
function compact(dateISO: string): string {
  return dateISO.replaceAll('-', '')
}

function nextDay(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function googleCalendarUrl(title: string, dateISO: string, noticeUrl: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${compact(dateISO)}/${compact(nextDay(dateISO))}`,
    details: `순모아에서 추가됨. 원문: ${noticeUrl}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildIcs(title: string, dateISO: string, noticeUrl: string): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//sunmoa//ko',
    'BEGIN:VEVENT',
    `UID:${compact(dateISO)}-${encodeURIComponent(title).slice(0, 40)}@sunmoa`,
    `DTSTART;VALUE=DATE:${compact(dateISO)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(dateISO))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:원문: ${noticeUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
```

`app/api/ics/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { buildIcs } from '@/lib/calendar'

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const title = p.get('title') ?? ''
  const date = p.get('date') ?? ''
  const url = p.get('url') ?? ''
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'invalid params' }, { status: 400 })
  }
  return new NextResponse(buildIcs(title, date, url), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sunmoa.ics"',
    },
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/calendar.test.ts` → Expected: PASS (2 tests)
Run: `npm run build` → Expected: 빌드 성공 (route 포함)

- [ ] **Step 5: Commit**

```bash
git add lib/calendar.ts app/api/ics tests/calendar.test.ts
git commit -m "feat: google calendar url and ics download for deadlines"
```

---

### Task 9: 통합 공지 피드 UI (프로젝트의 심장)

**Files:**
- Create: `app/page.tsx` (피드, 서버 컴포넌트)
- Create: `components/NoticeCard.tsx`
- Create: `components/BoardTabs.tsx`
- Create: `components/DisclaimerBanner.tsx`
- Create: `lib/notices.ts` (조회 쿼리)
- Modify: `app/layout.tsx` (메타데이터, 폰트, 배너 포함)
- Test: `tests/notices.test.ts` (D-day 계산) + 수동 UI 검증

**Interfaces:**
- Consumes: `supabaseAnon` (Task 5), `googleCalendarUrl` (Task 8), `BOARDS` (Task 2)
- Produces:
  - `interface Notice { id: number; board: string; title: string; author: string; postedAt: string; url: string; isPinned: boolean; deadline: string | null; createdAt: string /* NEW 배지 판단용 */ }`
  - `function fetchNotices(board?: string): Promise<Notice[]>` (최신 50건)
  - `function dday(deadline: string, today: string): number` — D-day 일수 (0 = 오늘 마감, 음수 = 지남)

스펙 §4-1 요구사항 체크리스트 (구현 시 전부 충족할 것):
- 모바일 우선. 한 화면에서 제목·카테고리·날짜·D-day가 스캔 가능
- 마감 임박(D-3 이내) 시각적 구분, 게시판(카테고리)별 일관된 색
- 면책 배너 최상단 고정, 모든 카드에 원문 링크, 자동 인식 마감일에 "자동 인식" 배지
- 새 공지(24시간 이내 크롤됨) "NEW" 표시
- 로그인 없이 열람 가능

- [ ] **Step 1: D-day 계산 실패하는 테스트 작성**

`tests/notices.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { dday } from '@/lib/notices'

describe('dday', () => {
  it('is 0 on the deadline day', () => {
    expect(dday('2026-08-13', '2026-08-13')).toBe(0)
  })
  it('is positive before the deadline', () => {
    expect(dday('2026-08-13', '2026-08-10')).toBe(3)
  })
  it('is negative after the deadline', () => {
    expect(dday('2026-08-13', '2026-08-15')).toBe(-2)
  })
})
```

Run: `npx vitest run tests/notices.test.ts` → Expected: FAIL

- [ ] **Step 2: lib/notices.ts 구현**

```ts
import { supabaseAnon } from './supabase'

export interface Notice {
  id: number
  board: string
  title: string
  author: string
  postedAt: string
  url: string
  isPinned: boolean
  deadline: string | null
  createdAt: string
}

export function dday(deadline: string, today: string): number {
  const ms = new Date(`${deadline}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()
  return Math.round(ms / 86400000)
}

export async function fetchNotices(board?: string): Promise<Notice[]> {
  let q = supabaseAnon()
    .from('notices')
    .select('id, board, title, author, posted_at, url, is_pinned, deadline, created_at')
    .order('posted_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(50)
  if (board) q = q.eq('board', board)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id, board: r.board, title: r.title, author: r.author,
    postedAt: r.posted_at, url: r.url, isPinned: r.is_pinned,
    deadline: r.deadline, createdAt: r.created_at,
  }))
}
```

Run: `npx vitest run tests/notices.test.ts` → Expected: PASS (3 tests)

- [ ] **Step 3: UI 컴포넌트 구현**

디자인 방향 (frontend-design 스킬을 로드해 참고하되 아래는 최소 요구):
- `DisclaimerBanner`: 얇은 상단 고정 바. 면책 문구(Global Constraints의 원문 그대로) + 학교 홈페이지 링크. 접을 수 있되 기본 노출.
- `BoardTabs`: 가로 스크롤 탭 — 전체 / 공지 / 학사 / 장학 / 교내행사 / 모집·채용 / 생활관. 현재 탭은 `?board=` searchParam. 게시판별 고정 색 토큰: general=slate, academic=blue, scholarship=amber, event=violet, recruit=emerald, dorm=rose.
- `NoticeCard`: 한 줄 요약 스캔에 최적화 —
  - 상단: 카테고리 칩(게시판 색) + 게시일 + (크롤 24h 이내면) NEW 칩
  - 제목: 최대 2줄, 굵게. 카드 전체가 원문 링크(`<a href={notice.url} target="_blank">`)
  - 하단(마감일 있을 때만): `D-3` 배지(D-3 이내는 빨강, 그 외 회색) + "자동 인식" 미니 배지 + "캘린더에 추가" 버튼(구글 캘린더 URL 새 탭) + "iOS" ics 링크(`/api/ics?...`)
- `app/page.tsx`: 서버 컴포넌트. `export const revalidate = 1800` (30분 캐시 — 크롤이 하루 3번이므로 충분). `searchParams`의 board로 `fetchNotices` 호출. 빈 상태면 "아직 수집된 공지가 없어요" 표시.
- `app/layout.tsx`: `<html lang="ko">`, 제목 "순모아 — 순천대 공지·통학버스 알리미", 시스템 폰트 스택 또는 Pretendard CDN 제외(외부 의존 최소화, next/font 로컬만 허용), 하단 풋터에 "학교 공식 서비스 아님" 재고지 + GitHub 링크.

- [ ] **Step 4: 수동 검증**

Run: `npm run dev` 후 브라우저(Playwright 도구 가능)에서:
- `/` 접속 → 크롤된 실제 공지 50건, 카테고리 칩 색 구분, 면책 배너 확인
- `/?board=scholarship` → 장학만 필터
- 마감일 있는 공지에서 "캘린더에 추가" 클릭 → 구글 캘린더 새 탭에 제목·날짜 프리필 확인
- 모바일 뷰포트(390px)에서 가로 스크롤 없이 스캔 가능한지 확인
- Run: `npm run build` → Expected: 성공

- [ ] **Step 5: Commit**

```bash
git add app components lib/notices.ts tests/notices.test.ts
git commit -m "feat: unified notice feed with board tabs, d-day badges, calendar links"
```

---

### Task 10: 통학버스 시간표

**Files:**
- Create: `data/bus-schedules.json`
- Create: `lib/bus.ts`
- Create: `app/bus/page.tsx`
- Create: `components/RouteCard.tsx`
- Test: `tests/bus.test.ts`

**Interfaces:**
- Consumes: 없음 (정적 JSON + 순수 함수)
- Produces:
  - `interface BusRoute { id: string; name: string; toSchool: string[]; fromSchool: string[]; stops: string[]; notes: string }`
  - `function nextDeparture(times: string[], now: Date): { time: string; minutesLeft: number } | null` — 오늘 남은 첫 출발, 없으면 null

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/bus.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { nextDeparture } from '@/lib/bus'

const times = ['08:00', '12:30', '17:30']

describe('nextDeparture', () => {
  it('returns the next remaining departure today', () => {
    const now = new Date('2026-08-12T11:00:00+09:00')
    expect(nextDeparture(times, now)).toEqual({ time: '12:30', minutesLeft: 90 })
  })

  it('returns the first bus when called before service starts', () => {
    const now = new Date('2026-08-12T06:00:00+09:00')
    expect(nextDeparture(times, now)?.time).toBe('08:00')
  })

  it('returns null after the last bus', () => {
    const now = new Date('2026-08-12T20:00:00+09:00')
    expect(nextDeparture(times, now)).toBeNull()
  })

  it('returns null for an empty timetable', () => {
    expect(nextDeparture([], new Date())).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/bus.test.ts` → Expected: FAIL

- [ ] **Step 3: lib/bus.ts 구현**

```ts
export interface BusRoute {
  id: string
  name: string
  toSchool: string[]
  fromSchool: string[]
  stops: string[]
  notes: string
}

// times are 'HH:MM' in KST; `now` is compared in KST regardless of server TZ.
export function nextDeparture(
  times: string[],
  now: Date,
): { time: string; minutesLeft: number } | null {
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const nowMin = kst.getHours() * 60 + kst.getMinutes()
  for (const t of [...times].sort()) {
    const [h, m] = t.split(':').map(Number)
    const dep = h * 60 + m
    if (dep >= nowMin) return { time: t, minutesLeft: dep - nowMin }
  }
  return null
}
```

Run: `npx vitest run tests/bus.test.ts` → Expected: PASS (4 tests)

- [ ] **Step 4: 시간표 데이터 입력**

공식 페이지 `https://www.scnu.ac.kr/haksa/cm/cntnts/cntntsView.do?mi=1511&cntntsId=1353` 를 열어(WebFetch/curl) 여수·광양·광주 3개 노선의 등·하교 시각과 정차지를 `data/bus-schedules.json`에 옮겨 적는다. 구조:

```json
{
  "updatedAt": "2026-08-12",
  "source": "https://www.scnu.ac.kr/haksa/cm/cntnts/cntntsView.do?mi=1511&cntntsId=1353",
  "routes": [
    {
      "id": "yeosu",
      "name": "여수",
      "toSchool": [],
      "fromSchool": [],
      "stops": [],
      "notes": "방학 중 미운영 여부는 원문 확인"
    }
  ]
}
```

⚠️ 페이지에 접근이 안 되거나 시간표가 이미지/PDF로만 제공되어 판독 불가면: routes의 시간 배열을 비워 두고 진행한다 — UI가 빈 시간표일 때 "시간표 준비 중 — 공식 안내 바로가기" 링크를 보여주므로 서비스는 성립한다. 판독 가능하면 3개 노선을 전부 채운다.

- [ ] **Step 5: 버스 페이지 구현**

- `app/bus/page.tsx`: `data/bus-schedules.json` import. 노선별 `RouteCard`. 상단에 `updatedAt` + "공식 안내 원문" 링크 + 면책 배너(공용 컴포넌트).
- `RouteCard`: 클라이언트 컴포넌트. `nextDeparture`로 "다음 버스 HH:MM (N분 후)"를 크게 표시, 1분마다 갱신(`setInterval`, cleanup 필수). 등교/하교 토글. 전체 시각 리스트는 그 아래 그리드. 막차 지난 뒤엔 "오늘 운행 종료".
- `app/layout.tsx` 또는 피드 상단에 `/bus` 탭 내비게이션 추가 (피드 ↔ 버스 ↔ 알림 3-탭 하단 내비, 모바일 우선).

- [ ] **Step 6: 수동 검증 + 빌드**

`npm run dev` → `/bus` 에서 카운트다운 동작 확인. `npm run build` 성공 확인.

- [ ] **Step 7: Commit**

```bash
git add data lib/bus.ts app/bus components/RouteCard.tsx tests/bus.test.ts
git commit -m "feat: commuter bus timetable page with next-departure countdown"
```

---

### Task 11: 웹푸시 구독 + 키워드 설정

**Files:**
- Create: `public/sw.js`
- Create: `public/manifest.json`
- Create: `app/alerts/page.tsx`
- Create: `components/KeywordForm.tsx`
- Create: `app/api/subscribe/route.ts`
- Create: `lib/keywords.ts`
- Modify: `app/layout.tsx` (manifest 링크)
- Test: `tests/keywords.test.ts`

**Interfaces:**
- Consumes: `supabaseService` (Task 5)
- Produces:
  - `function normalizeKeywords(raw: string): string[]` — 쉼표/공백 구분 입력 → 중복 제거·트림·소문자화, 최대 10개, 각 1~20자
  - `function matchesAny(title: string, keywords: string[]): boolean` — 대소문자 무시 부분일치
  - `POST /api/subscribe` body `{ subscription: PushSubscriptionJSON, keywords: string /* 사용자가 입력한 원문, 서버에서 normalizeKeywords로 정제 */ }` → endpoint 기준 upsert
  - `DELETE /api/subscribe` body `{ endpoint: string }` → 구독 해제
  - `public/sw.js`: push 이벤트 → `showNotification(title, { body, data: { url } })`, notificationclick → 원문 열기

- [ ] **Step 1: 키워드 로직 실패하는 테스트 작성**

`tests/keywords.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalizeKeywords, matchesAny } from '@/lib/keywords'

describe('normalizeKeywords', () => {
  it('splits on commas and whitespace, trims, dedupes', () => {
    expect(normalizeKeywords('장학, 기숙사 장학  셔틀')).toEqual(['장학', '기숙사', '셔틀'])
  })
  it('caps at 10 keywords and drops empty/oversized entries', () => {
    const raw = Array.from({ length: 15 }, (_, i) => `k${i}`).join(',') + ',,' + 'x'.repeat(30)
    const out = normalizeKeywords(raw)
    expect(out).toHaveLength(10)
    expect(out.every(k => k.length >= 1 && k.length <= 20)).toBe(true)
  })
})

describe('matchesAny', () => {
  it('matches case-insensitive substrings', () => {
    expect(matchesAny('2026-2학기 국가장학금 신청 안내', ['장학'])).toBe(true)
    expect(matchesAny('SW중심대학 특강', ['sw'])).toBe(true)
  })
  it('returns false when nothing matches or keywords empty', () => {
    expect(matchesAny('수강신청 안내', ['기숙사'])).toBe(false)
    expect(matchesAny('수강신청 안내', [])).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/keywords.test.ts` → Expected: FAIL

- [ ] **Step 3: lib/keywords.ts 구현**

```ts
export function normalizeKeywords(raw: string): string[] {
  const seen = new Set<string>()
  for (const part of raw.split(/[,\s]+/)) {
    const k = part.trim().toLowerCase()
    if (k.length >= 1 && k.length <= 20) seen.add(k)
    if (seen.size >= 10) break
  }
  return [...seen]
}

export function matchesAny(title: string, keywords: string[]): boolean {
  const t = title.toLowerCase()
  return keywords.some(k => t.includes(k))
}
```

Run: `npx vitest run tests/keywords.test.ts` → Expected: PASS (4 tests)

- [ ] **Step 4: VAPID 키 생성 및 환경변수 설정**

```powershell
npx web-push generate-vapid-keys
```

출력된 public/private 키를 `.env.local`의 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`에, `VAPID_SUBJECT`는 `mailto:운영자이메일`로 기록. (키는 커밋 금지 — `.env.local`은 gitignore에 이미 포함됨을 확인.)

- [ ] **Step 5: 서비스워커·manifest·구독 API 구현**

`public/sw.js`:

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? '순모아 새 공지', {
      body: data.body ?? '',
      data: { url: data.url },
      icon: '/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
```

`public/manifest.json` (iOS 웹푸시는 홈화면 추가 필수 조건):

```json
{
  "name": "순모아",
  "short_name": "순모아",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

아이콘 2개는 단색 배경에 "순" 글자 텍스트를 넣은 PNG를 생성해 `public/`에 둔다 (node 스크립트나 수동 — 외부 서비스 금지). `app/layout.tsx` metadata에 `manifest: '/manifest.json'` 추가.

`app/api/subscribe/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { normalizeKeywords } from '@/lib/keywords'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const sub = body?.subscription
  const keywords = normalizeKeywords(String(body?.keywords ?? ''))
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth || keywords.length === 0) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }
  const { error } = await supabaseService().from('push_subscriptions').upsert(
    { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, keywords },
    { onConflict: 'endpoint' },
  )
  if (error) return NextResponse.json({ error: 'db error' }, { status: 500 })
  return NextResponse.json({ ok: true, keywords })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.endpoint) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  await supabaseService().from('push_subscriptions').delete().eq('endpoint', body.endpoint)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: 알림 설정 페이지 구현**

`app/alerts/page.tsx` + `components/KeywordForm.tsx` (클라이언트 컴포넌트):
1. 브라우저 지원 검사 (`'serviceWorker' in navigator && 'PushManager' in window`) — 미지원(iOS Safari 미설치 상태 등)이면 안내 문구: "아이폰은 공유 → 홈 화면에 추가 후 이용 가능해요."
2. 키워드 입력창(placeholder: "장학, 기숙사, 수강신청") + 추천 키워드 칩(장학/기숙사/수강신청/등록금/통학) 탭하여 추가
3. "알림 받기" 클릭 → `navigator.serviceWorker.register('/sw.js')` → `Notification.requestPermission()` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: <NEXT_PUBLIC_VAPID_PUBLIC_KEY를 Uint8Array로 변환> })` → `POST /api/subscribe`
4. 성공 시 등록된 키워드 칩 표시 + "알림 끄기" 버튼(구독 해제 → `DELETE /api/subscribe`)
5. 알림 권한 거부 상태면 브라우저 설정 안내 문구

- [ ] **Step 7: 수동 검증 + 빌드**

`npm run dev` → Chrome에서 `/alerts` 접속, 키워드 "장학" 등록 → 알림 권한 허용 → Supabase MCP `execute_sql`: `select endpoint, keywords from push_subscriptions;` → 1행 존재 확인. `npm run build` 성공.

- [ ] **Step 8: Commit**

```bash
git add public app/alerts app/api/subscribe components/KeywordForm.tsx lib/keywords.ts tests/keywords.test.ts app/layout.tsx
git commit -m "feat: web push subscription with keyword alerts"
```

---

### Task 12: 크롤러 → 푸시 발송 연결

**Files:**
- Create: `crawler/push.ts`
- Modify: `crawler/index.ts` (CLI 엔트리에서 발송 호출)
- Test: `tests/push.test.ts`

**Interfaces:**
- Consumes: `InsertedNotice` (Task 7), `matchesAny` (Task 11), `supabaseService` (Task 5)
- Produces:
  - `interface Sub { endpoint: string; p256dh: string; auth: string; keywords: string[] }`
  - `function planPushes(notices: InsertedNotice[], subs: Sub[]): { sub: Sub; notice: InsertedNotice }[]` — 매칭 계획 (순수 함수, 구독자×공지 중 키워드 일치 쌍, 구독자당 최대 3건으로 상한)
  - `function sendPushes(notices: InsertedNotice[]): Promise<void>` — 계획 실행, 404/410 응답 구독은 DB에서 삭제

- [ ] **Step 1: 매칭 계획 실패하는 테스트 작성**

`tests/push.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { planPushes, Sub } from '@/crawler/push'
import type { InsertedNotice } from '@/crawler/index'

const n = (title: string): InsertedNotice => ({ board: 'academic', nttSn: 1, title, url: 'u' })
const s = (keywords: string[]): Sub => ({ endpoint: 'e' + keywords.join(''), p256dh: 'p', auth: 'a', keywords })

describe('planPushes', () => {
  it('pairs subscribers with notices matching their keywords', () => {
    const plan = planPushes([n('국가장학금 신청'), n('수강신청 일정')], [s(['장학'])])
    expect(plan).toHaveLength(1)
    expect(plan[0].notice.title).toBe('국가장학금 신청')
  })

  it('caps at 3 notifications per subscriber per run', () => {
    const notices = ['장학A', '장학B', '장학C', '장학D'].map(n)
    expect(planPushes(notices, [s(['장학'])])).toHaveLength(3)
  })

  it('returns [] when there are no matches', () => {
    expect(planPushes([n('수강신청')], [s(['기숙사'])])).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/push.test.ts` → Expected: FAIL

- [ ] **Step 3: 구현**

`crawler/push.ts`:

```ts
import webpush from 'web-push'
import { supabaseService } from '../lib/supabase'
import { matchesAny } from '../lib/keywords'
import type { InsertedNotice } from './index'

export interface Sub {
  endpoint: string
  p256dh: string
  auth: string
  keywords: string[]
}

const MAX_PER_SUB = 3 // don't spam a subscriber in a single run

export function planPushes(
  notices: InsertedNotice[],
  subs: Sub[],
): { sub: Sub; notice: InsertedNotice }[] {
  const plan: { sub: Sub; notice: InsertedNotice }[] = []
  for (const sub of subs) {
    let count = 0
    for (const notice of notices) {
      if (count >= MAX_PER_SUB) break
      if (matchesAny(notice.title, sub.keywords)) {
        plan.push({ sub, notice })
        count++
      }
    }
  }
  return plan
}

export async function sendPushes(notices: InsertedNotice[]): Promise<void> {
  if (notices.length === 0) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )

  const db = supabaseService()
  const { data, error } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, keywords')
  if (error) throw error

  for (const { sub, notice } of planPushes(notices, (data ?? []) as Sub[])) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: `[순모아] ${notice.title}`, body: '새 공지가 올라왔어요', url: notice.url }),
      )
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        console.log('[push] pruned dead subscription')
      } else {
        console.error('[push] send failed:', status)
      }
    }
  }
}
```

`crawler/index.ts`의 CLI 엔트리를 수정:

```ts
if (process.argv[1]?.includes('crawler')) {
  runCrawl()
    .then(async inserted => {
      const { sendPushes } = await import('./push')
      await sendPushes(inserted)
      console.log(`[crawl] done, ${inserted.length} inserted total`)
    })
    .catch(err => { console.error(err); process.exit(1) })
}
```

(circular import 방지를 위해 push는 동적 import. `InsertedNotice` 타입 import는 `import type`이므로 순환 문제 없음.)

- [ ] **Step 4: 테스트 통과 + 실발송 검증**

Run: `npm test` → Expected: 전부 PASS
실발송 검증: Task 11에서 등록한 "장학" 구독이 있는 상태에서, Supabase의 장학 공지 1건을 삭제(`delete from notices where board='scholarship' and ntt_sn = <최신 sn>;`) 후 `npm run crawl` → 해당 공지가 재수집되며 브라우저에 알림 도착 확인.

- [ ] **Step 5: Commit**

```bash
git add crawler/push.ts crawler/index.ts tests/push.test.ts
git commit -m "feat: send keyword-matched web push after each crawl"
```

---

### Task 13: GitHub 저장소 + Actions 크론

**Files:**
- Create: `.github/workflows/crawl.yml`
- Modify: `crawler/fetch.ts` (USER_AGENT의 OWNER/이메일 실제 값으로 교체)
- Modify: `README.md` (프로젝트 소개로 교체)

**Interfaces:**
- Consumes: `npm run crawl` (Task 7/12)
- Produces: 1일 3회 자동 크롤 + 실패 시 GitHub 알림 메일

- [ ] **Step 1: GitHub 저장소 생성 및 push**

```bash
gh repo create sunmoa --public --source . --push
```

(사용자 gh 로그인 필요 — 로그인 안 되어 있으면 `! gh auth login` 안내 후 대기. 저장소 공개 여부는 스펙 §4-4 "공개 저장소 + 인수인계" 원칙에 따라 public.)

- [ ] **Step 2: USER_AGENT 실제 값 교체**

`crawler/fetch.ts`의 `OWNER/sunmoa`와 `OWNER_EMAIL`을 실제 저장소 URL과 운영자 이메일로 교체. Run: `npm test` → PASS 유지 확인.

- [ ] **Step 3: Actions secrets 등록**

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "<url>"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "<key>"
gh secret set NEXT_PUBLIC_VAPID_PUBLIC_KEY --body "<key>"
gh secret set VAPID_PRIVATE_KEY --body "<key>"
gh secret set VAPID_SUBJECT --body "mailto:<email>"
```

- [ ] **Step 4: 워크플로 작성**

`.github/workflows/crawl.yml`:

```yaml
name: crawl
on:
  schedule:
    # KST 07:00 / 12:30 / 18:30 (UTC+9)
    - cron: '0 22 * * *'
    - cron: '30 3 * * *'
    - cron: '30 9 * * *'
  workflow_dispatch: {}

jobs:
  crawl:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run crawl
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}
          VAPID_PRIVATE_KEY: ${{ secrets.VAPID_PRIVATE_KEY }}
          VAPID_SUBJECT: ${{ secrets.VAPID_SUBJECT }}
```

크롤 실패(process.exit(1)) 시 GitHub이 저장소 소유자에게 워크플로 실패 메일을 보낸다 — 스펙 §4-4의 "별도 모니터링 서버 없는 장애 감지" 충족.

- [ ] **Step 5: 수동 트리거로 검증**

```bash
git add .github README.md crawler/fetch.ts
git commit -m "ci: schedule crawler 3x daily via github actions"
git push
gh workflow run crawl
gh run watch
```

Expected: 워크플로 성공, 로그에 게시판별 "no new notices" 또는 insert 카운트.

---

### Task 14: Vercel 배포

**Files:** 코드 변경 없음 (배포 설정)

- [ ] **Step 1: Vercel 프로젝트 연결 및 배포**

```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
npx vercel env add VAPID_PRIVATE_KEY production
npx vercel env add VAPID_SUBJECT production
npx vercel --prod
```

(Vercel 로그인 필요 시 `! npx vercel login` 안내. 또는 Vercel 웹에서 GitHub 저장소 import — 이 경우 env만 대시보드에서 등록.)

- [ ] **Step 2: 프로덕션 스모크 테스트**

배포 URL에서: 피드 로드 / 장학 탭 필터 / `/bus` 카운트다운 / `/alerts`에서 키워드 등록 → Supabase에 행 생김 / `/api/ics?title=t&date=2026-08-20&url=u` 다운로드. 모바일(실기기)에서 1회 확인.

- [ ] **Step 3: 완료 커밋 (배포 URL 기록)**

README.md에 배포 URL 기재 후:

```bash
git add README.md
git commit -m "docs: add production url"
git push
```

---

### Task 15: HANDOVER.md + 마무리 문서

**Files:**
- Create: `HANDOVER.md`
- Modify: `README.md`

- [ ] **Step 1: HANDOVER.md 작성**

스펙 §4-4 요구 항목을 실제 값으로 채워 작성:
- 서비스 구성도 (Vercel ← Supabase ← GitHub Actions 크롤러) 텍스트 다이어그램
- 계정 목록: GitHub 저장소 URL, Vercel 프로젝트명, Supabase 프로젝트명 — 각각 "소유자 이메일" 항목 포함 (비밀번호·키는 절대 기록 금지, 위치만: "Actions secrets / Vercel env 참조")
- 정기 작업: 없음(전자동). 단, 학기마다 `data/bus-schedules.json` 갱신 방법 (원문 URL → JSON 수정 → push하면 자동 재배포)
- 장애 대응: Actions 실패 메일 수신 시 → `gh run view --log`로 원인 확인 → 파서 문제면 `docs/crawl-targets.md` 절차로 셀렉터 갱신 → `tests/fixtures` 재다운로드 → 테스트 수정
- 인수인계 절차: GitHub repo transfer + Vercel/Supabase 멤버 초대 순서

- [ ] **Step 2: README.md 최종화**

프로젝트 한 줄 소개, 스크린샷 자리, 로컬 실행법(`npm i` → `.env.local` 작성 → `npm run dev`), 테스트(`npm test`), 크롤러 수동 실행(`npm run crawl`), 면책 고지, 라이선스(MIT).

- [ ] **Step 3: 최종 검증 및 커밋**

Run: `npm test` → 전부 PASS
Run: `npm run build` → 성공

```bash
git add HANDOVER.md README.md
git commit -m "docs: handover guide and readme"
git push
```

---

## 태스크 의존성 요약

```
Task 1 (scaffold)
 ├─ Task 2 (boards+fixtures) ─ Task 3 (parser) ─┐
 ├─ Task 4 (fetcher) ───────────────────────────┤
 ├─ Task 5 (supabase) ──────────────────────────┼─ Task 7 (crawler) ─┐
 ├─ Task 6 (deadline) ──────────────────────────┘                    │
 ├─ Task 8 (calendar) ─┐                                             │
 │                     ├─ Task 9 (feed UI)                           │
 ├─ Task 10 (bus)      │                                             │
 └─ Task 11 (push sub)─┴──────────────── Task 12 (push send) ────────┤
                                                                     │
Task 13 (actions) ← 7,12    Task 14 (deploy) ← 9,10,11    Task 15 (docs) ← 전부
```

병렬 실행 가능 그룹: (3,4,5,6 동시) → 7 / (8,9,10,11은 5 이후 동시) → 12 → 13,14 → 15.

## 스펙 커버리지 매핑

| CLAUDE.md 요구 | 태스크 |
|---|---|
| 통합 공지 피드 (가독성 최우선) | 9 |
| 키워드 알림 (웹푸시) | 11, 12 |
| 통학버스 시간표 + 남은 시간 | 10 |
| 캘린더에 추가 (gcal URL + ics) | 8, 9 |
| 매너 크롤링 (3회/일, 3초 딜레이, UA, 변경분만) | 4, 7, 13 |
| 면책 조항 + 원문 링크 + 자동 인식 배지 | 9, 10 |
| 지속 가능성 (0원, 자동화, 장애 감지, 파서 모듈화, HANDOVER) | 2, 7, 13, 15 |
| 개인정보 최소화 (로그인 없음, 푸시 토큰만) | 5, 11 |
| 마케팅 플랜 | 코드 범위 아님 — 배포 후 CLAUDE.md §5 실행 |
