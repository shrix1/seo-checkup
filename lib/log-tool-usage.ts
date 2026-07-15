/**
 * @deprecated Client Discord logging is disabled.
 * Tool APIs log server-side after successful requests.
 */
export type ClientLogType =
  | "SITEMAP"
  | "METADATA"
  | "ROBOTS"
  | "AUDIT"
  | "DOMAIN_RATING"

export async function logToolUsage(_value: string, _type: ClientLogType) {
  // no-op — kept for import safety during migration
}
