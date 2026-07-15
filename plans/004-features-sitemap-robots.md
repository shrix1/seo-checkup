# 004 — Sitemap tool UX + Robots.txt tool + API hygiene

**Commit stamped:** `f80b491`  
**Depends on:** 001, 003  
**Status:** PENDING

## Why

Sitemap checker is the core product but lacks basic operator UX (counts, copy, loading skeletons). A natural third tool is a **Robots.txt viewer**. API rate-limit responses incorrectly bury HTTP status in JSON body.

## Feature set (locked — implement all)

### A. Sitemap Link Checker upgrades

Files: [`app/(tools)/sitemap/input-field.tsx`](../app/(tools)/sitemap/input-field.tsx), [`generate-deep-routes.tsx`](../app/(tools)/sitemap/generate-deep-routes.tsx)

1. Show **URL count** and parse status after load.
2. **Copy all URLs** button (clipboard) once results exist.
3. Replace spinner-only wait with **Skeleton** list (existing [`components/ui/skeleton.tsx`](../components/ui/skeleton.tsx)).
4. Stagger-fade result list once (not on every re-render) via Framer helpers from 003.
5. Guard empty/`undefined` query (from async searchParams).

### B. New tool: Robots.txt viewer

1. Add route group page: `app/(tools)/robots/page.tsx` + `input-field.tsx`.
2. Fetch via existing `GET /api/v1?q=<origin>/robots.txt` (or user-pasted robots URL).
3. Render plain-text body in a monospace block; highlight `Sitemap:` / `Disallow:` / `Allow:` / `User-agent:` lines with simple regex spans (no heavy parser dependency).
4. Add ToolCard on home linking to `/robots?q=https://example.com/robots.txt` (use a real demo URL consistent with other cards).
5. Metadata via `constructMetadata`; register `/robots` in product `app/sitemap.ts` (002).

### C. API hygiene

File: [`app/api/v1/route.ts`](../app/api/v1/route.ts)

1. Rate-limit failure must return real HTTP 429:
   ```ts
   return NextResponse.json({ error: "Rate limit exceeded", limit, reset, remaining }, {
     status: 429,
     headers: {
       "X-RateLimit-Limit": String(limit),
       "X-RateLimit-Reset": String(reset),
       "X-RateLimit-Remaining": String(remaining),
     },
   })
   ```
2. Same pattern for 4xx/5xx fetch failures (status on `NextResponse`, not only body).
3. Prefer `new URL(req.url).searchParams.get("q")` over `split("q=")[1]`.
4. **Do not** move Discord secrets in this plan unless review flags them as blocking; note `NEXT_PUBLIC_` Discord usage for 005 security review.

### D. Nav / footer

Update [`components/navbar.tsx`](../components/navbar.tsx) (and footer links if tools are listed) to include Robots tool.

## Out of scope

- Full HTTP status crawler for every sitemap URL (too heavy for rate limits).
- Auth / paid tiers.

## Done when

- Three tools on home: Sitemap, Metadata, Robots.
- Sitemap tool has count + copy + skeletons.
- API returns proper status codes.
- Product `sitemap.ts` includes `/robots`.
- `pnpm build` && `pnpm lint` pass.
