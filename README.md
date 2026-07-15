## Sitemap Links and Metadata/og checker (niche usecase)

Easily review your sitemap links and metadata/og stuff easily

<img width="1440" alt="Screenshot 2024-02-29 at 11 47 50 AM" src="https://github.com/shrix1/maybeusefull/assets/92677078/0401c4d9-d882-4a92-90b9-ace0e49d13cd">

---

## TECH STACK

- Stack : `NextJS`
- UI : `TailwindCSS and ShadcnUI`
- Buttons : `Syntax UI`
- Images/svg : `Popsy`
- Icons : `Luicde`
- Hosting : `Vercel`

---

## Setup

1. Fork and Clone the repo
2. If you don't have pnpm run `npm install -g pnpm`
3. run `pnpm install`
4. Copy env template: `cp .env.example .env.local` and fill in values (see below)
5. run `pnpm run dev`
6. Create a new branch, make code changes, open a PR (contributions welcome)

## Environment variables

See [`.env.example`](.env.example). Required for production/preview on Vercel:

| Variable | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Yes | Rate limiting (`/api/v1`, `/api/sitemap`, `/api/audit`, `/api/domain-rating`) |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Rate limiting |
| `DISCORD_LOGS_ID` | Recommended | Discord webhook ID (server-only usage logs) |
| `DISCORD_LOGS_TOKEN` | Recommended | Discord webhook token |

Optional / deprecated: `NEXT_PUBLIC_DISCORD_LOGS_*` — server fallback only; remove after migrating to `DISCORD_LOGS_*`.

Ahrefs Domain Rating needs **no** API key (public free endpoint).

---
