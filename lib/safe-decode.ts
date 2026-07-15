export function safeDecodeURIComponent(value: string | undefined | null): string {
  if (!value) return ""
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
