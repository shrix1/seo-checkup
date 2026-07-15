# 003 — UI structure + motion system

**Commit stamped:** `f80b491`  
**Depends on:** 001  
**Status:** PENDING  
**Skills bar:** `/improve-animations` + existing frontend design rules (preserve shadcn New York + Geist; do not invent purple/cream/broadsheet looks)

## Why

Landing hero is generic (feature headline overpowers brand; brand only in nav). `framer-motion` is installed but unused. `Meteors` in [`components/tool-card.tsx`](../components/tool-card.tsx) is dead code. No motion tokens / `prefers-reduced-motion` discipline.

## Design decisions (locked)

1. **Keep** Tailwind + `tailwindcss-animate` for Radix; **use** `framer-motion` for page/hero/result entrances and BMC toast.
2. **Brand-first hero** on [`app/page.tsx`](../app/page.tsx): product name `SeoCheckup` as the dominant first-viewport signal; one short supporting sentence; tool cards as the CTA group. No stats strips, no floating badges on media.
3. **Visual atmosphere:** refine existing grid background (subtle, token-aligned) — not a flat single color; no purple-gradient AI cliché.
4. **Ship 2–3 intentional motions:** (a) hero text fade-up, (b) tool-card stagger, (c) BMC toast enter/exit. Respect `prefers-reduced-motion: reduce` (skip or instant).
5. **Wire or delete Meteors:** wire tastefully behind tool-card hover with reduced-motion off; else delete component + `meteor` keyframes from [`tailwind.config.ts`](../tailwind.config.ts). Prefer **wire with reduced-motion guard** to use existing inventory.
6. Add CSS motion tokens in [`app/globals.css`](../app/globals.css):
   ```css
   --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
   --duration-fast: 150ms;
   --duration-normal: 250ms;
   ```
   Use these in Framer `transition` configs and Tailwind where practical.

## Steps

1. Refactor home hero composition (brand → one line → cards). Keep one composition; cards remain interactive containers.
2. Extract small `components/motion.tsx` helpers: `FadeIn`, `StaggerChildren` wrapping `motion` with reduced-motion check via `window.matchMedia` or Framer’s `useReducedMotion`.
3. Animate tool cards on home; keep hover transitions CSS (interruptible, short).
4. Animate BMC toast in [`components/buy-me-coffee.tsx`](../components/buy-me-coffee.tsx) enter/exit (no `scale(0)` — use opacity + slight translateY).
5. Soften/align one-off colors (BMC `#FFDD00`, meteor slate) toward tokens where possible without redesigning brand yellow CTA.
6. Tool page shells ([`app/(tools)/sitemap/page.tsx`](../app/(tools)/sitemap/page.tsx), metadata): light entrance on icon+title only; do not animate every list item on every keystroke.

## Out of scope

- Full design-system rewrite / new fonts (keep Geist).
- Dark-mode-only redesign.
- Dashboard-style home layout.

## Done when

- First viewport clearly branded as SeoCheckup without relying on nav alone.
- `framer-motion` is imported and used (or removed entirely if wiring fails — prefer use).
- `prefers-reduced-motion` honored on new motions.
- `pnpm build` passes.

## Feel-check

Slow-mo hero load; toggle OS reduce-motion and confirm no janky long fades; card hover still snappy (`~150–250ms`, ease-out).
