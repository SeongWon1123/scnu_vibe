# Task 1 Completion Record: Project Scaffold

## Purpose

Task 1 creates the repeatable development baseline for the Sunmoa MVP. It intentionally does not implement product behavior. Later tasks add crawl targets, parsing, storage, UI, notifications, and deployment automation.

## Completed requirements

- Next.js App Router scaffold with TypeScript, Tailwind CSS, and ESLint.
- Runtime dependencies for HTML parsing, Web Push, and Supabase.
- Development dependencies for testing, TypeScript execution, and Web Push types.
- Vitest Node configuration with the root import alias.
- Scripts for development, linting, build, one-shot testing, watch testing, and the reserved crawler command.
- Safe environment-variable template with names only, no credentials.
- A smoke test proving Vitest can execute.

## Verification record

On 2026-08-13, the local Windows development machine passed npm test, npm run lint, and npm run build. The build generated the static root route and the not-found route with exit code zero.

## Intentional boundaries

The crawl command name is introduced in Task 1 so later tasks can rely on it. It is expected to fail until Task 7 creates crawler/index.ts. This is not a Task 1 defect.

The root page remains the generated starter page until Task 9. The feed UI needs the later notice, deadline, calendar, and source-link interfaces before it can be built correctly.

## Environment contract

Copy .env.local.example to .env.local only when a later task needs local credentials. Never commit .env.local, VAPID private keys, or Supabase service-role keys. The public Supabase URL, public anonymous key, public VAPID key, server-only service-role key, private VAPID key, and VAPID contact are all named in the example file.

## Next task

Proceed with Task 2 in the implementation plan. It adds six verified board configurations, fixture HTML, crawl-target documentation, and tests. Keep requests to school systems minimal and follow the polite-crawling rules in CLAUDE.md.
