export type ClientLogType =
  | "SITEMAP"
  | "METADATA"
  | "ROBOTS"
  | "AUDIT"
  | "DOMAIN_RATING"

/** Client-safe helper: posts via server route so webhook secrets stay server-side. */
export async function logToolUsage(value: string, type: ClientLogType) {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, type }),
    })
  } catch (error) {
    console.error("Error logging tool usage:", error)
  }
}
