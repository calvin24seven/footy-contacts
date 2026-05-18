import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Allowlist of valid event names — prevents arbitrary writes
const ALLOWED_EVENTS = new Set([
  "search",
  "filter_applied",
  "contact_viewed",
  "upgrade_page_viewed",
  "onboarding_step_completed",
  "list_created",
  "saved_search_created",
  "export_initiated",
  "cancellation_started",
  "cancellation_reason_submitted",
  "feature_discovery",
])

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Authenticate — user_id always comes from server session, never from client body
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: { event?: unknown; properties?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const event = body.event
  if (typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 })
  }

  // Sanitise properties — only keep primitive values, ignore nested objects depth > 1
  const rawProps =
    body.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
      ? (body.properties as Record<string, unknown>)
      : {}
  const properties: Record<string, string | number | boolean | null> = {}
  for (const [k, v] of Object.entries(rawProps)) {
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      properties[k] = v
    }
  }

  const admin = createAdminClient()
  await admin.from("user_events").insert({
    user_id: user.id,
    event_name: event,
    properties,
    ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
  })

  return NextResponse.json({ ok: true })
}
