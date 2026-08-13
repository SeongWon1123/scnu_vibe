# Sunmoa Handover

## Project identity

- Name: Sunmoa.
- Purpose: a zero-cost notifier that centralizes Sunchon National University announcements and commuter-bus information.
- Intended GitHub repository: https://github.com/SeongWon1123/scnu_vibe
- Current local branch: feature/sunmoa-mvp.
- Current milestone: Task 1 complete; Task 2 is next.

## Current repository state

The repository contains the Task 1 Next.js scaffold, dependency manifest, Vitest setup, safe environment template, smoke test, and project documentation. The Next.js page is still the starter screen by design. No crawler, Supabase migration, board fixture, GitHub Actions workflow, push route, PWA manifest, or production deployment is present yet.

## Verified commands

Run npm ci, npm test, npm run lint, and npm run build before a task handoff. Task 1 verification passed on 2026-08-13 for testing, linting, and the production build.

## Secrets and external services

No production secret, Supabase project, VAPID key pair, Vercel project, or GitHub Actions secret has been created or committed. Use .env.local.example as the name-only contract. The Supabase service-role key and VAPID private key must remain server-side and must never be committed.

## Operating constraints

- No paid APIs or permanent server processes.
- No user accounts; retain only the Web Push endpoint, keys, and selected keywords when that feature is implemented.
- Crawl only at the three KST times stated in CLAUDE.md; maintain at least a three-second delay between board requests.
- Keep the non-official-service disclaimer prominent and preserve a source link for every notice.
- Keep code, variables, and commits in English; keep user-facing UI in Korean.

## Immediate next action

Implement Task 2 exactly as specified in the implementation plan: add six verified board configurations, fixture HTML, crawl-target documentation, and tests. Update this file after every meaningful environment, deployment, credential, or architecture change.
