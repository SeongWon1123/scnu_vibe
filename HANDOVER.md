# Sunmoa Handover

## Project identity

| Item | Current state |
| --- | --- |
| Name | Sunmoa |
| Purpose | Zero-cost central notifier for Sunchon National University announcements and commuter-bus information. |
| GitHub | https://github.com/SeongWon1123/scnu_vibe |
| Branch | current working branch, tracking `origin/main` |
| Current milestone | Crawl pipeline, deadline extraction, calendar export, and the unified notice feed are in code. A live Supabase crawl is still required to fill the feed. |

## Completed foundation

Task 1–5 cover the Next.js scaffold, six board targets, parser, polite fetcher, and Supabase schema/clients. The crawl pipeline inserts only new notices, extracts title deadlines, treats empty parses as layout-change errors, and exits non-zero when a board fails. `npm run crawl` loads `.env.local` when present.

Task 8 adds Google Calendar template URLs and an `/api/ics` download. Task 9 replaces the starter page with a mobile-first Korean feed: sticky disclaimer, board tabs, title search, D-day / NEW / 자동 인식 badges, source links, and calendar actions. The homepage returns an empty state when public Supabase env is missing, so production builds do not require credentials.

## Verification and constraints

Run `npm test`, `npm run lint`, and `npm run build` after source changes. Unit tests do not request the school site or a real database.

The project must remain free to operate, avoid user accounts, store only the future push endpoint/keys/keywords, show the non-official-service disclaimer, retain a source link per notice, and run its production crawler only three times daily with at least three seconds between requests.

## Required activation before the first real crawl

1. Create or connect a Supabase Free-tier project.
2. Apply `supabase/migrations/0001_init.sql` and run `supabase/verify/0001_init_verify.sql`.
3. Put the real project URL, anon key, and service-role key in the untracked `.env.local` file or secure deployment secrets.
4. Run `npm run crawl` once manually and inspect only aggregate board results.
5. Do not commit secrets, raw live notice responses, or push endpoints.

## Immediate next action

If Supabase is connected locally, run `npm run crawl` once and confirm the feed shows notices. Then implement Task 10 commuter-bus timetable. Do not enable the three-times-daily GitHub Actions workflow until a successful manual crawl against the live database.
