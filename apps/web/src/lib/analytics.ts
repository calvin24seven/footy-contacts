/**
 * Client-side analytics tracker.
 * Fire-and-forget — never blocks the user action.
 * Server-side inserts happen via /api/events (user_id injected from session).
 */

export type AnalyticsEvent =
  | "search"
  | "filter_applied"
  | "contact_viewed"
  | "upgrade_page_viewed"
  | "onboarding_step_completed"
  | "list_created"
  | "saved_search_created"
  | "export_initiated"
  | "cancellation_started"
  | "cancellation_reason_submitted"
  | "feature_discovery"

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  // Only run in browser
  if (typeof window === "undefined") return

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties: properties ?? {} }),
    // keepalive so the request outlives navigation
    keepalive: true,
  }).catch(() => {
    // Silently swallow — analytics must never break product flows
  })
}
