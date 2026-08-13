# Development Workflow

## Read before editing

1. Read CLAUDE.md for product boundaries and operating rules.
2. Read HANDOVER.md for current repository and credential state.
3. Read the relevant task in docs/superpowers/plans/2026-08-12-sunmoa-mvp.md.
4. For a board, selector, or parser change, update docs/crawl-targets.md after Task 2 creates it.

## Definition of done

A task is complete only when its scoped code and tests are present, relevant quality checks pass, documentation reflects the current state, and a small English commit records the change. Do not mark a later task complete only because one dependency is installed.

## Quality gates

- For source or configuration changes: run lint, tests, and the production build.
- For board configuration or parser work: include fixture-based tests.
- For crawler work: test error isolation, user agent, three-second delay, and fixed schedule.
- For database migrations: apply only to the intended Supabase project and verify tables plus RLS.
- For UI work: inspect a mobile-width view and verify title, board, date, deadline, disclaimer, and source-link visibility.
- For push work: verify a test subscription without retaining unrelated personal information.

## Git workflow

Use one focused English commit per completed task or independently reviewable correction. Inspect git status, review the staged diff, run quality gates, and then commit. Never commit environment files, VAPID private keys, Supabase service-role keys, build output, or node_modules.

## Sustainable crawler policy

The future GitHub Actions workflow must run only at 07:00, 12:30, and 18:30 KST. It must request no more than one or two listing pages per board, wait at least three seconds between requests, use an identifiable SunmoaBot user agent with a service contact, respect robots.txt, and isolate each board failure so the remaining boards can continue.

## Product guardrails

Keep the MVP limited to the unified notice feed, keyword Web Push, commuter-bus timetable, and calendar export. Avoid features that cost money, require a permanent operator, collect additional personal data, or compete with the university Everytime community.
