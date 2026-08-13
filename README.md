# Sunmoa

Sunmoa is a zero-cost web notifier for Sunchon National University students. It gives commuters one place to check university announcements and commuter-bus information each morning.

> 본 서비스는 국립순천대학교 공식 서비스가 아닙니다. 크롤링 지연·오류로 정보가 다를 수 있으니, 마감일 등 중요한 정보는 반드시 학교 홈페이지 원문을 확인하세요.

## Current milestone

**Tasks 1–5 plus crawl storage are in the repository.** The project has a Next.js and Vitest scaffold, six verified announcement-board configurations, resilient parsing, a polite fetcher, a Supabase schema with RLS, deadline extraction from titles, and a crawl pipeline that inserts only new notices. A live Supabase project still has to be connected before `npm run crawl` can persist real data. The root page remains a placeholder until the unified feed UI is built.

## MVP scope

The MVP includes a unified announcement feed with filters and search, keyword-triggered Web Push notifications, structured Yeosu/Gwangyang/Gwangju commuter-bus schedules, and Google Calendar links plus ICS downloads for detected deadlines.

It intentionally excludes community features, comments, course schedules, course reviews, cafeteria reviews, native apps, live city-bus arrival data, paid messaging, and external AI extraction services.

## Local setup

Use Node.js 22 or newer. Do not commit a real `.env.local` file or any credential.

```powershell
Copy-Item .env.local.example .env.local
npm ci
npm run dev
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js server. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run Vitest once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run build` | Create a production build. |
| `npm run crawl` | Fetch, parse, and upsert the configured boards. Requires an applied migration and real Supabase environment values. |

## Repository guide

| Document | Purpose |
| --- | --- |
| `CLAUDE.md` | Product rules, operating constraints, and architecture. |
| `docs/superpowers/plans/2026-08-12-sunmoa-mvp.md` | Task-by-task implementation plan. |
| `docs/crawl-targets.md` | Board URLs, selectors, fixtures, and change history. |
| `docs/TASK-1-SETUP.md` | Task 1 completion record and acceptance checks. |
| `docs/DEVELOPMENT.md` | Quality gates and contribution workflow. |
| `HANDOVER.md` | Current state, handover, and immediate next action. |

## Non-negotiable operating rules

Keep user-facing UI text in Korean and code, variable names, and commit messages in English. Preserve free-tier operation, minimum data collection, and the MVP boundary. The crawler must run only three times a day, wait at least three seconds between board requests, use an identifiable SunmoaBot contact string, request only recent listing pages, and respect `robots.txt`.
