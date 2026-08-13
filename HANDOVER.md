# Sunmoa Handover

## Project identity

| Item | Current state |
| --- | --- |
| Name | Sunmoa |
| Purpose | Zero-cost central notifier for Sunchon National University announcements and commuter-bus information. |
| GitHub | https://github.com/SeongWon1123/scnu_vibe |
| Branch | `feature/sunmoa-mvp`, tracking `origin/main` |
| Current milestone | Task 1 and Task 2 complete; Task 3 is next. |

## Completed foundation

Task 1 created the Next.js scaffold, dependencies, Vitest setup, environment template, and smoke test. Task 2 added `crawler/boards.ts`, the six verified board targets, list and detail URL builders, live academic and invalid-request fixtures, `docs/crawl-targets.md`, and fixture-integrity tests.

## Verification and constraints

Run `npm test`, `npm run lint`, and `npm run build` before handoff. No production secret, Supabase project, VAPID key pair, Vercel project, or GitHub Actions secret has been created or committed.

The project must remain free to operate, avoid user accounts, store only the future push endpoint/keys/keywords, show the non-official-service disclaimer, retain a source link per notice, and follow the three-times-daily polite-crawling policy.

## Immediate next action

Implement Task 3 from the plan: `crawler/parse.ts` and parser tests that consume the saved academic and invalid-request fixtures. The parser must return an empty array for error pages or malformed HTML so one broken board cannot halt a later crawl run.