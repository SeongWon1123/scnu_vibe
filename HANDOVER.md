# Sunmoa Handover

## Project identity

| Item | Current state |
| --- | --- |
| Name | Sunmoa |
| Purpose | Zero-cost central notifier for Sunchon National University announcements and commuter-bus information. |
| GitHub | https://github.com/SeongWon1123/scnu_vibe |
| Branch | `feature/sunmoa-mvp`, tracking `origin/main` |
| Current milestone | Task 1 through Task 3 complete; Task 4 is next. |

## Completed foundation

Task 1 created the Next.js scaffold, dependencies, Vitest setup, environment template, and smoke test. Task 2 added `crawler/boards.ts`, six verified board targets, list/detail URL builders, live academic and invalid-request fixtures, `docs/crawl-targets.md`, and fixture-integrity tests.

Task 3 added `crawler/parse.ts` and parser tests. The parser returns an empty array for empty HTML, invalid-request pages, unrelated markup, or parser exceptions. It strips pinned badges from titles, trims authors, normalizes posting dates, and builds canonical source URLs.

## Live validation on 2026-08-13

One list page per board was requested with the SunmoaBot user agent and a three-second pause between requests. All six returned HTTP 200 and produced parsable rows: general 10, academic 23, scholarship 11, event 10, recruit 10, and dorm 19. No validation error occurred. The live result was inspected but is not committed because it contains transient announcement content.

## Verification and constraints

Run `npm test`, `npm run lint`, and `npm run build` before handoff. No production secret, Supabase project, VAPID key pair, Vercel project, or GitHub Actions secret has been created or committed.

The project must remain free to operate, avoid user accounts, store only the future push endpoint/keys/keywords, show the non-official-service disclaimer, retain a source link per notice, and follow the three-times-daily polite-crawling policy.

## Immediate next action

Implement Task 4 from the plan: `crawler/fetch.ts` and fetcher tests. Preserve the transparent user agent, three-second request delay, one-board error isolation, and no-throw behavior for HTTP or network errors.