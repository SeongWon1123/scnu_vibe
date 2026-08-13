# Sunmoa Handover

## Project identity

| Item | Current state |
| --- | --- |
| Name | Sunmoa |
| Purpose | Zero-cost central notifier for Sunchon National University announcements and commuter-bus information. |
| GitHub | https://github.com/SeongWon1123/scnu_vibe |
| Branch | current working branch, tracking `origin/main` |
| Current milestone | Tasks 1–5 plus crawl storage, deadline extraction, and new-notice detection are in code. A live Supabase project is still required before the first real crawl. |

## Completed foundation

Task 1 created the Next.js scaffold, dependencies, Vitest setup, environment template, and smoke test. Task 2 added the six verified board targets, URL builders, fixtures, and crawl-target documentation. Task 3 added the resilient list parser and fixture tests. Task 4 added the polite fetcher with an identifiable SunmoaBot user agent and a three-second delay constant.

Task 5 committed `supabase/migrations/0001_init.sql`, verification SQL, and fail-fast anon/service-role clients in `lib/supabase.ts`. No Supabase project has been connected in this environment because credentials were not provided.

The crawl pipeline (`crawler/run.ts`, `crawler/store.ts`, `crawler/index.ts`) fetches boards sequentially, waits between requests, continues after a board-level failure, extracts deadlines from titles, and inserts only unseen `(board, ntt_sn)` rows. An empty parse is treated as a layout-change error. The CLI exits non-zero when any board fails so a future GitHub Actions schedule can alert on crawler problems. `npm run crawl` loads `.env.local` when that file exists and still works in CI when environment variables are injected directly.

## Verification and constraints

Run `npm test`, `npm run lint`, and `npm run build` after source changes. Fetcher, store, runner, deadline, and diff tests use injected mocks or fixtures; unit tests do not request the school site or a real database.

The project must remain free to operate, avoid user accounts, store only the future push endpoint/keys/keywords, show the non-official-service disclaimer, retain a source link per notice, and run its production crawler only three times daily with at least three seconds between requests.

## Required activation before the first real crawl

1. Create or connect a Supabase Free-tier project.
2. Apply `supabase/migrations/0001_init.sql` and run `supabase/verify/0001_init_verify.sql`.
3. Put the real project URL, anon key, and service-role key in the untracked `.env.local` file or secure deployment secrets.
4. Run `npm run crawl` once manually and inspect only aggregate board results.
5. Do not commit secrets, raw live notice responses, or push endpoints.

## Immediate next action

Connect the actual Supabase project and verify RLS boundaries. Then implement Task 8 calendar export and Task 9 unified feed UI (disclaimer banner, source links, D-day, and the Korean starter-page replacement). Do not enable the three-times-daily GitHub Actions workflow until a successful manual crawl against the live database.
