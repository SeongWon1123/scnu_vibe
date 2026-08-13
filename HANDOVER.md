# Sunmoa Handover

## Project identity

| Item | Current state |
| --- | --- |
| Name | Sunmoa |
| Purpose | Zero-cost central notifier for Sunchon National University announcements and commuter-bus information. |
| GitHub | https://github.com/SeongWon1123/scnu_vibe |
| Branch | current working branch |
| Current milestone | Notice feed, calendar export, commuter-bus page, keyword push subscribe/send, and a 3x-daily Actions workflow are in code. |

## What is in the repo

- Crawl pipeline: polite fetch, parse, deadline extraction, insert-only new notices, non-zero exit on board errors.
- Feed UI: disclaimer, board tabs, search, D-day/NEW badges, source links, Google Calendar + ICS.
- Bus page: Yeosu / Donggwangyang / Gwangju cards plus the published Suncheon morning loop. Intercity times are PDF-only behind `/upload/` (disallowed by robots.txt), so those arrays stay empty and the UI links to the official page and `scnu.unibus.kr`.
- Web Push: `/alerts` keyword subscribe, `/api/subscribe`, `public/sw.js`. Crawl sends at most 3 matching notifications per subscriber.
- GitHub Actions: `.github/workflows/crawl.yml` at 07:00 / 12:30 / 18:30 KST. Secrets must be added in the GitHub repo before the first scheduled run.

## Required secrets

Do not commit these. Put them in `.env.local` and in GitHub Actions secrets / Vercel env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (`mailto:` operator email)

Generate VAPID keys with `npx web-push generate-vapid-keys`.

## Immediate next action

1. Confirm a local `npm run crawl` stored notices and `/` shows them.
2. Add VAPID keys, register a keyword on `/alerts`, and confirm a row in `push_subscriptions`.
3. Add the Actions secrets listed above, then run the `crawl` workflow once with `workflow_dispatch`.
4. Deploy to Vercel with the same public and server env vars.
5. Each term, update `data/bus-schedules.json` from the official bus page if times become available as text.

Passwords and private keys are never recorded here. Locations only: `.env.local`, GitHub Actions secrets, Vercel env.
