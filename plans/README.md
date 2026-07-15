# SEO Checkup — Execution Plans

**Written against:** `f80b491`  
**Target:** Next.js `16.2.x` (stable `@latest`), React 19, pnpm (already in use)  
**Status:** DONE — build/lint green; Bugbot clean; Security no HIGH (SSRF accepted)

## Accepted residual risks

| Risk | Decision |
| --- | --- |
| Open proxy / SSRF via `GET /api/v1` | **Accepted product behavior** (SEO fetch tools). Mitigations added: http(s)-only, 15s timeout, ~2MB body cap, rate limit. No private-IP block yet. |
| Legacy `NEXT_PUBLIC_DISCORD_*` env names | Server still accepts as fallback; migrate Vercel env to `DISCORD_LOGS_ID` / `DISCORD_LOGS_TOKEN` and remove public vars. Client no longer embeds webhook. |

## Package manager

| Check | Result |
| --- | --- |
| Lockfile | `pnpm-lock.yaml` present |
| `yarn.lock` | Absent |
| `package-lock.json` | Absent |
| README | Documents `pnpm install` / `pnpm run dev` |
| Verdict | **Already on pnpm — no Yarn→pnpm migration** |

## Recommended order

| # | Plan | Depends on | Status |
| --- | --- | --- | --- |
| 001 | [Next.js 14 → 16 upgrade](001-nextjs-16-upgrade.md) | — | DONE |
| 002 | [Fix product sitemap + SEO routes](002-fix-sitemap-seo.md) | 001 (build green) | DONE |
| 003 | [UI structure + motion system](003-ui-motion-polish.md) | 001 | DONE |
| 004 | [Sitemap tool UX + new Robots tool](004-features-sitemap-robots.md) | 001, 003 | DONE |
| 005 | [Review loop: build → Bugbot → Security → fix](005-review-fix-loop.md) | 001–004 | DONE |

## Verification gates (every plan)

```bash
pnpm install
pnpm build
pnpm lint
```

No automated test suite exists today; build + lint are the hard gates. Manual smoke: `/`, `/sitemap`, `/metadata`, `/robots` (after 004), theme toggle, API `GET /api/v1?q=…`.

## Execution model (multi-agent)

1. **Implementer** executes 001 → 004 in order (or parallelize 002+003 after 001).
2. **Reviewer loop (005):** Bugbot + Security Review on branch diff; any FAIL → implementer fixes → re-review until both PASS and `pnpm build` succeeds.
3. Do not merge/push unless the user asks.
