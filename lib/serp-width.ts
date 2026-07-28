/**
 * Google truncates search snippets by rendered pixel width, not character count.
 * A short title in wide glyphs ("WOMAN") can clip while a longer one in narrow
 * glyphs ("illiteracy") fits, so character counters are unreliable.
 *
 * Widths below are Arial advance widths in 1/1000 em, which is what Google
 * renders desktop snippets in. Width in px = sum(advance) / 1000 * fontSizePx.
 *
 * Pure arithmetic — safe on both server and client.
 */

const ARIAL_ADVANCE: Record<string, number> = {
  " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667,
  "'": 191, "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333,
  ".": 278, "/": 278,
  "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556,
  "7": 556, "8": 556, "9": 556,
  ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278,
  J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722,
  S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  "[": 278, "\\": 278, "]": 278, "^": 469, _: 556, "`": 333,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222,
  j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333,
  s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  "{": 334, "|": 260, "}": 334, "~": 584,
  "–": 556, "—": 1000, "‘": 222, "’": 222, "“": 333, "”": 333, "…": 1000,
  "·": 333, "•": 350, "×": 584, "°": 400, "€": 556, "£": 556,
}

/** Fallback for anything outside the table (CJK, emoji, accented glyphs). */
const DEFAULT_ADVANCE = 556
const WIDE_FALLBACK = 1000

function advanceFor(char: string): number {
  const known = ARIAL_ADVANCE[char]
  if (known !== undefined) return known
  const code = char.codePointAt(0) ?? 0
  // CJK, Hangul and full-width forms are roughly one em.
  if (
    (code >= 0x1100 && code <= 0x11ff) ||
    (code >= 0x2e80 && code <= 0x9fff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff00 && code <= 0xff60) ||
    code > 0xffff
  ) {
    return WIDE_FALLBACK
  }
  return DEFAULT_ADVANCE
}

/** Rendered width of `text` in pixels at `fontSizePx`, in Arial. */
export function pixelWidth(text: string, fontSizePx: number): number {
  let units = 0
  for (const char of text) units += advanceFor(char)
  return Math.round((units / 1000) * fontSizePx)
}

export type SnippetField = "title" | "description"

/**
 * Truncation thresholds. Titles render around 20px and descriptions around
 * 14px in Google's desktop snippet; mobile columns are narrower.
 */
export const SNIPPET_LIMITS = {
  title: { fontSize: 20, desktop: 580, mobile: 485 },
  description: { fontSize: 14, desktop: 920, mobile: 680 },
} as const

export type SnippetMeasurement = {
  field: SnippetField
  text: string
  chars: number
  px: number
  desktopLimit: number
  mobileLimit: number
  /** Fraction of the desktop limit used, clamped to 0–1 for meters */
  desktopRatio: number
  mobileRatio: number
  truncatedDesktop: boolean
  truncatedMobile: boolean
  status: "pass" | "warn" | "fail"
  summary: string
}

/** Below this fraction of the limit the snippet is wasting available space. */
const SHORT_RATIO = 0.4

export function measureSnippet(
  field: SnippetField,
  text: string | undefined | null
): SnippetMeasurement {
  const value = (text ?? "").trim()
  const limits = SNIPPET_LIMITS[field]
  const px = value ? pixelWidth(value, limits.fontSize) : 0

  const desktopRatio = px / limits.desktop
  const mobileRatio = px / limits.mobile
  const truncatedDesktop = px > limits.desktop
  const truncatedMobile = px > limits.mobile

  let status: SnippetMeasurement["status"] = "pass"
  let summary: string

  if (!value) {
    status = "fail"
    summary = `No ${field === "title" ? "title" : "meta description"} found`
  } else if (truncatedDesktop) {
    status = "warn"
    summary = `${px}px — over the ${limits.desktop}px desktop limit, Google will cut it off`
  } else if (truncatedMobile) {
    status = "warn"
    summary = `${px}px — fits desktop but clips on mobile (${limits.mobile}px)`
  } else if (desktopRatio < SHORT_RATIO) {
    status = "warn"
    summary = `${px}px — well under the ${limits.desktop}px limit, room to say more`
  } else {
    summary = `${px}px — fits both desktop and mobile`
  }

  return {
    field,
    text: value,
    chars: value.length,
    px,
    desktopLimit: limits.desktop,
    mobileLimit: limits.mobile,
    desktopRatio: Math.min(1, desktopRatio),
    mobileRatio: Math.min(1, mobileRatio),
    truncatedDesktop,
    truncatedMobile,
    status,
    summary,
  }
}

/** Clip `text` to whatever fits in `maxPx`, appending an ellipsis like Google does. */
export function truncateToWidth(
  text: string,
  fontSizePx: number,
  maxPx: number
): string {
  if (pixelWidth(text, fontSizePx) <= maxPx) return text

  const ellipsisPx = pixelWidth("…", fontSizePx)
  const budget = maxPx - ellipsisPx
  let units = 0
  let out = ""

  for (const char of text) {
    const next = units + advanceFor(char)
    if ((next / 1000) * fontSizePx > budget) break
    units = next
    out += char
  }

  return `${out.trimEnd()}…`
}
