# Sunmoa Handover

## Project identity

| Item | Current state |
| --- | --- |
| Name | Sunmoa |
| Purpose | Zero-cost central notifier for Sunchon National University announcements and commuter-bus information. |
| GitHub | https://github.com/SeongWon1123/scnu_vibe |
| Branch | `feature/sunmoa-mvp`, tracking `origin/main` |
| Current milestone | Task 1 through Task 4 complete; Task 5 connection and deployment validation are next. |

## Completed foundation

Task 1 created the Next.js scaffold, dependencies, Vitest setup, environment template, and smoke test. Task 2 added the six verified board targets, URL builders, fixtures, and crawl-target documentation. Task 3 added the resilient list parser and fixture tests.

Task 4 now provides `crawler/fetch.ts`, `crawler/run.ts`, and `crawler/store.ts`. The fetcher sends an identifiable SunmoaBot user agent, exposes a three-second delay constant, and returns `null` for HTTP, network, or body-read failures. The runner processes boards sequentially, waits between boards, parses returned HTML, and continues after a board-level failure. The store module maps parsed notices to the Supabase schema and upserts on `(board, ntt_sn)` without throwing a database error into later boards.

The Task 5 DDL and verification SQL are committed under `supabase/`. `lib/supabase.ts` provides fail-fast anon and service-role clients. No Supabase project has been connected or modified in this task because the session's Supabase integration is disabled and no real credentials were provided.

## Verification and constraints

The current codebase passes `npm test` with 23 tests, `npm run lint`, and `npm run build`. Fetcher, store, and runner tests use injected mocks; no unit test requests the school site or a real database.

The project must remain free to operate, avoid user accounts, store only the future push endpoint/keys/keywords, show the non-official-service disclaimer, retain a source link per notice, and run its production crawler only three times daily with at least three seconds between requests.

## Required activation before the first real crawl

1. Create or connect a Supabase Free-tier project.
2. Apply `supabase/migrations/0001_init.sql` and run `supabase/verify/0001_init_verify.sql`.
3. Put the real project URL, anon key, and service-role key in the untracked `.env.local` file or secure deployment secrets.
4. Run `npm run crawl` once manually and inspect only aggregate board results.
5. Do not commit secrets, raw live notice responses, or push endpoints.

## Immediate next action

Complete Task 5 by connecting the actual Supabase project and verifying RLS boundaries. Then implement Task 6 deadline extraction and extend the runner in Task 7 with new-notice detection before enabling the three-times-daily GitHub Actions workflow.