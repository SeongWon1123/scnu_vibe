# Sunmoa

Sunmoa is a zero-cost web notifier for Sunchon National University students. It gives commuters one place to check university announcements and commuter-bus information each morning.

> Sunmoa is not an official Sunchon National University service. The product UI must later show the required Korean disclaimer prominently and link every notice to its school source page.

## MVP scope

The MVP includes a unified announcement feed with filters and search, keyword-triggered Web Push notifications, structured Yeosu/Gwangyang/Gwangju commuter-bus schedules, and Google Calendar links plus ICS downloads for detected deadlines.

It intentionally excludes community features, comments, course schedules, course reviews, cafeteria reviews, native apps, live city-bus arrival data, paid messaging, and external AI extraction services.

## Current milestone

Task 1 is complete. The repository has a Next.js App Router scaffold, dependencies, Vitest configuration, a safe environment-variable template, a smoke test, and maintained handover documentation. Product features are scheduled work, not incomplete Task 1 requirements.

The next implementation step is Task 2: verified crawl-target documentation, six board configurations, HTML fixtures, and tests. Read docs/TASK-1-SETUP.md, docs/DEVELOPMENT.md, HANDOVER.md, and the implementation plan before changing code.

## Architecture

- Next.js App Router with TypeScript and Tailwind CSS, deployable on the Vercel free tier.
- Supabase free tier for notices and future server-side push subscriptions.
- GitHub Actions for the scheduled Node crawler; no permanent server.
- Web Push with VAPID keys; no paid messaging provider.
- Regular-expression deadline extraction; no external AI API.

## Local setup

Use Node.js 22 or newer. Do not commit a real .env.local file or any credential.

1. Copy .env.local.example to .env.local when a later task requires local credentials.
2. Run npm ci.
3. Run npm run dev.
4. Open http://localhost:3000.

The starter route remains until the notice-feed UI task, so this milestone does not show product data yet.

## Commands

- npm run dev: start the local Next.js server.
- npm run lint: run ESLint.
- npm test: run Vitest once.
- npm run test:watch: run Vitest in watch mode.
- npm run build: create a production build.
- npm run crawl: reserved for Task 7 and unavailable until crawler/index.ts exists.

## Repository guide

- CLAUDE.md: product rules, operating constraints, and architecture.
- docs/superpowers/plans/2026-08-12-sunmoa-mvp.md: task-by-task implementation plan.
- docs/TASK-1-SETUP.md: Task 1 completion record and acceptance checks.
- docs/DEVELOPMENT.md: quality gates and contribution workflow.
- HANDOVER.md: current state, handover, and immediate next action.

## Non-negotiable operating rules

Keep user-facing UI text in Korean and code, variable names, and commit messages in English. Preserve free-tier operation, minimum data collection, and the MVP boundary. The crawler must later run only three times a day, wait at least three seconds between board requests, use an identifiable SunmoaBot contact string, request only recent listing pages, and respect robots.txt.
