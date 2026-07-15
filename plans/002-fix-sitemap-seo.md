# 002 — Fix product sitemap + SEO routes

**Commit stamped:** `f80b491`  
**Depends on:** 001 (or at least a compiling tree)  
**Status:** PENDING

## Why

[`app/sitemap.ts`](../app/sitemap.ts) has a broken path: `"metadata"` lacks a leading `/`, producing `https://seocheckup.vercel.appmetadata`. Product SEO is wrong today.

## Current state

```ts
const pages = ["/", "/sitemap", "metadata"]
```

[`app/robots.ts`](../app/robots.ts) points sitemap to `https://seocheckup.vercel.app/sitemap.xml` — keep in sync with new routes after 004.

## Steps

1. Fix pages array to absolute paths:
   ```ts
   const pages = ["/", "/sitemap", "/metadata"] as const
   ```
2. After 004 adds `/robots` tool, append `"/robots"` to the same array and set sensible `changeFrequency` / `priority` (home `1`, tools `0.8`).
3. Ensure [`lib/utils.ts`](../lib/utils.ts) `constructMetadata` `metadataBase` / canonicals stay consistent with `https://seocheckup.vercel.app`.
4. Manually verify generated route mentally: each URL must be `baseUrl + path` with a single slash join (use `new URL(page, baseUrl).toString()` if joining is error-prone).

## Done when

- No path without leading `/` in the sitemap pages list.
- `pnpm build` still passes.
- Visiting `/sitemap.xml` (dev or build start) lists valid absolute URLs including `/metadata`.

## Out of scope

- Rewriting the Sitemap Link Checker tool UI (004).
