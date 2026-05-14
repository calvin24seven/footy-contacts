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

/**
 * GET /api/admin/contacts/pending-changes
 * Query params: page (1-based), limit (default 50), change_type (optional filter)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { supabase, forbidden } = await requireAdmin()
  if (forbidden || !supabase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
  const changeType = searchParams.get("change_type")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("contact_role_history") as any)
    .select(
      `id, contact_id, role, organisation, new_email, new_phone,
       change_type, recorded_at, import_id,
       contacts!contact_role_history_contact_id_fkey (
         name, role, organisation, email
       )`,
      { count: "exact" }
    )
    .eq("source", "csv_import_signal")
    .eq("review_status", "pending")
    .order("recorded_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (changeType && changeType !== "all") {
    query = query.eq("change_type", changeType)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}

/**
 * POST /api/admin/contacts/pending-changes
 * Body: { action: "approve" | "reject", ids: string[] }
 *
 * approve — writes new role/organisation/(optionally email/phone) to the contact,
 *           records a confirmed csv_import entry in contact_role_history,
 *           marks the signal record as "approved".
 * reject  — marks the signal record as "rejected" with no contact mutation.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user, forbidden } = await requireAdmin()
  if (forbidden || !supabase || !user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { action?: string; ids?: unknown }
  const action = body.action
  const ids = Array.isArray(body.ids) ? (body.ids as string[]) : []

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids array is empty" }, { status: 400 })
  }
  if (ids.length > 500) {
    return NextResponse.json({ error: "Maximum 500 ids per request" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: signals, error: fetchErr } = await (supabase.from("contact_role_history") as any)
    .select("id, contact_id, role, organisation, new_email, new_phone, change_type")
    .in("id", ids)
    .eq("source", "csv_import_signal")
    .eq("review_status", "pending")

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!signals || signals.length === 0) {
    return NextResponse.json({ processed: 0, message: "No pending signals found for given ids" })
  }

  if (action === "reject") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("contact_role_history") as any)
      .update({ review_status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .in("id", ids)
      .eq("source", "csv_import_signal")
      .eq("review_status", "pending")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ processed: signals.length, action: "rejected" })
  }

  // approve — apply each change to the contact, then mark approved
  let applied = 0
  let failed = 0
  const errors: string[] = []

  for (const signal of signals as Array<{
    id: string; contact_id: string; role: string | null; organisation: string | null
    new_email: string | null; new_phone: string | null; change_type: string | null
  }>) {
    // Read current contact values (role, org text, org FK, location) before overwriting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current } = await (supabase.from("contacts") as any)
      .select("role, organisation, organisation_id, email, phone, city, country")
      .eq("id", signal.contact_id)
      .single()

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (signal.role)         update.role         = signal.role
    if (signal.new_email)    update.email        = signal.new_email
    if (signal.new_phone)    update.phone        = signal.new_phone

    // Resolve the new organisation from the organisations table
    let newOrgId: string | null = null
    if (signal.organisation) {
      update.organisation = signal.organisation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orgRow } = await (supabase.from("organisations") as any)
        .select("id, city, country")
        .ilike("name", signal.organisation)
        .maybeSingle()

      if (orgRow) {
        newOrgId = orgRow.id as string
        update.organisation_id = orgRow.id
        // Update city/country from the organisation record if the org changed
        // Only overwrite if the new org has location data
        if (orgRow.city)    update.city    = orgRow.city
        if (orgRow.country) update.country = orgRow.country
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase.from("contacts") as any)
      .update(update)
      .eq("id", signal.contact_id)

    if (updateErr) {
      failed++
      errors.push(`${signal.id}: ${updateErr.message}`)
      continue
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("contact_role_history") as any)
      .update({
        review_status:        "approved",
        reviewed_at:          new Date().toISOString(),
        reviewed_by:          user.id,
        prev_role:            current?.role             ?? null,
        prev_organisation:    current?.organisation     ?? null,
        prev_organisation_id: current?.organisation_id  ?? null,
        prev_email:           current?.email            ?? null,
        prev_phone:           current?.phone            ?? null,
        new_organisation_id:  newOrgId,
      })
      .eq("id", signal.id)

    applied++
  }

  return NextResponse.json({ processed: signals.length, applied, failed, errors })
}
