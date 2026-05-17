import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { supabase: null, user: null, forbidden: true }
  const { data: profile } = await authClient
    .from("profiles").select("role").eq("id", user.id).single()
  const supabase = createAdminClient()
  return { supabase, user, forbidden: profile?.role !== "admin" }
}

const ALLOWED_ACTIONS = new Set([
  "blacklist",   // add email to email_suppressions + set suppression_status = suppressed
  "suppress",    // set suppression_status = suppressed (no email blacklist)
  "unsuppress",  // set suppression_status = active
  "archive",     // set visibility_status = archived
  "publish",     // set visibility_status = published
  "draft",       // set visibility_status = draft
  "delete",      // hard delete contact rows
])

/**
 * POST /api/admin/contacts/bulk
 * Body: { action: string, ids: string[] }
 *
 * Max 500 ids per request to prevent runaway mutations.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, forbidden } = await requireAdmin()
  if (forbidden || !supabase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { action?: string; ids?: unknown }
  const action = body.action
  const ids = Array.isArray(body.ids) ? (body.ids as string[]).filter(id => typeof id === "string") : []

  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: `action must be one of: ${[...ALLOWED_ACTIONS].join(", ")}` }, { status: 400 })
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids array is empty" }, { status: 400 })
  }
  if (ids.length > 500) {
    return NextResponse.json({ error: "Maximum 500 ids per request" }, { status: 400 })
  }

  // ── delete ────────────────────────────────────────────────────────────────
  if (action === "delete") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("contacts") as any).delete().in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ processed: ids.length, action })
  }

  // ── visibility / suppression status changes ───────────────────────────────
  if (action === "archive" || action === "publish" || action === "draft") {
    const visibilityMap: Record<string, string> = { archive: "archived", publish: "published", draft: "draft" }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("contacts") as any)
      .update({ visibility_status: visibilityMap[action], updated_at: new Date().toISOString() })
      .in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ processed: ids.length, action })
  }

  if (action === "suppress") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("contacts") as any)
      .update({ suppression_status: "suppressed", updated_at: new Date().toISOString() })
      .in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ processed: ids.length, action })
  }

  if (action === "unsuppress") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("contacts") as any)
      .update({ suppression_status: "active", updated_at: new Date().toISOString() })
      .in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ processed: ids.length, action })
  }

  // ── blacklist ─────────────────────────────────────────────────────────────
  if (action === "blacklist") {
    // Fetch contacts to get their emails
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contacts, error: fetchErr } = await (supabase.from("contacts") as any)
      .select("id, email")
      .in("id", ids)

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ processed: 0, action, note: "No contacts found" })
    }

    const withEmail = (contacts as Array<{ id: string; email: string | null }>).filter(c => c.email)
    const allIds    = (contacts as Array<{ id: string }>).map(c => c.id)

    // 1. Mark all selected contacts as suppressed (even those without email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: suppressErr } = await (supabase.from("contacts") as any)
      .update({ suppression_status: "suppressed", updated_at: new Date().toISOString() })
      .in("id", allIds)
    if (suppressErr) return NextResponse.json({ error: suppressErr.message }, { status: 500 })

    // 2. Add emails to suppression list (upsert — ignore duplicates)
    if (withEmail.length > 0) {
      const suppressionRows = withEmail.map(c => ({
        email:    (c.email as string).toLowerCase().trim(),
        reason:   "manual",
        source:   "admin_bulk_action",
        category: "manual",
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (supabase.from("email_suppressions") as any)
        .upsert(suppressionRows, { onConflict: "email", ignoreDuplicates: true })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({
      processed:        allIds.length,
      emails_suppressed: withEmail.length,
      action,
    })
  }

  return NextResponse.json({ error: "Unhandled action" }, { status: 400 })
}
