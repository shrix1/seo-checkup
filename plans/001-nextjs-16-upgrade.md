# 001 — Next.js 14 → 16 upgrade

**Commit stamped:** `f80b491`  
**Category:** dependencies & migrations  
**Effort:** M  
**Status:** PENDING

## Why

App is on **Next.js `14.2.35`** + **React 18**. Latest stable is **Next.js 16.2.x** with **React 19**. v16 fully removes sync `searchParams`/`params` (already breaking for this app’s tool pages). `eslint-config-next` is skewed at `14.1.0`.

## Package manager

Already **pnpm**. Use only `pnpm` / `pnpm dlx` commands. Do **not** add yarn or npm lockfiles.

## Current state (excerpts)

`package.json`:

```json
"next": "14.2.35",
"react": "^18",
"react-dom": "^18",
"eslint-config-next": "14.1.0"
```

Sync `searchParams` (must become async):

- [`app/(tools)/sitemap/page.tsx`](../app/(tools)/sitemap/page.tsx) — `{ searchParams: { q: string } }`
- [`app/(tools)/metadata/page.tsx`](../app/(tools)/metadata/page.tsx) — same pattern

No `middleware.ts`. No custom webpack in [`next.config.mjs`](../next.config.mjs). Turbopack-default in v16 should be fine.

## Steps

1. Ensure Node ≥ **20.9** (local has Node 26 — OK).
2. Run the official upgrade codemod:
   ```bash
   pnpm dlx @next/codemod@canary upgrade latest
   ```
   Accept updates for Next, React, React DOM, eslint-config-next, types.
3. If codemod incomplete, manually:
   ```bash
   pnpm add next@latest react@latest react-dom@latest
   pnpm add -D eslint-config-next@latest @types/react@latest @types/react-dom@latest typescript@latest
   ```
4. Convert both tool pages to async pages:
   ```tsx
   export default async function Sitemap({
     searchParams,
   }: {
     searchParams: Promise<{ q?: string }>
   }) {
     const { q } = await searchParams
     const query = q ? decodeURIComponent(q) : ""
     return (/* ... */ <InputField query={query} />)
   }
   ```
   Same for metadata page. Guard missing `q` (empty string) so decode does not throw.
5. Align lint for Next 16: if `next lint` was removed/migrated by codemod, update `package.json` `"lint"` script to the ESLint CLI the codemod writes (do not invent a parallel lint setup).
6. Bump `framer-motion` to a React-19-compatible release if peer deps warn (`pnpm add framer-motion@latest`).
7. Clean `tailwind.config.ts` content globs: remove nonexistent `./pages/**/*` and `./src/**/*` if still present.
8. Add `"packageManager": "pnpm@<installed-major>"` only if missing and easy to detect via `pnpm -v` — optional hygiene, not required for build.

## Out of scope

- UI redesign (003)
- New tools (004)
- API rate-limit HTTP status fix (004/005 — can land in 004)
- Cache Components / PPR migration (not required for this app)

## Done when

```bash
pnpm build   # exits 0
pnpm lint    # exits 0
```

`package.json` shows `next` ≥ 16.2 and `react` ≥ 19. Tool pages use `await searchParams`. No `yarn.lock` / `package-lock.json` introduced.

## Escape hatches

- If Turbopack build fails on a plugin webpack inject: try `next build --webpack` once to isolate; prefer fixing Turbopack issue over permanent webpack opt-out.
- If a peer-dep conflict blocks install: report exact conflict; do not `--force` silently without noting it in the PR notes.
