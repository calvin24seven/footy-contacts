import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * POST /api/admin/imports/[id]/undo
 *
 * Soft-deletes (visibility_status = 'deleted') all contacts created by this import
 * that are NOT linked to any opportunity or list.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  // Verify import exists
  const { data: importRecord } = await supabase
    .from("csv_imports")
    .select("id")
    .eq("id", id)
    .single()
  if (!importRecord) return NextResponse.json({ error: "Import not found" }, { status: 404 })

  // Get all contact_ids created by this import (status = 'success', contact_id not null)
  const PAGE_SIZE = 1000
  const allContactIds: string[] = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from("csv_import_rows")
      .select("contact_id")
      .eq("csv_import_id", id)
      .eq("status", "success")
      .not("contact_id", "is", null)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    for (const r of data) { if (r.contact_id) allContactIds.push(r.contact_id) }
    if (data.length < PAGE_SIZE) break
    page++
  }

  if (allContactIds.length === 0) {
    return NextResponse.json({ deleted: 0, skipped: 0, message: "No contacts to undo" })
  }

  // Find contacts linked to lists
  const linkedInLists = new Set<string>()
  for (let i = 0; i < allContactIds.length; i += 1000) {
    const batch = allContactIds.slice(i, i + 1000)
    const { data } = await supabase
      .from("list_contacts")
      .select("contact_id")
      .in("contact_id", batch)
    for (const r of data ?? []) linkedInLists.add(r.contact_id)
  }

  // Find contacts linked to opportunities (via contact_unlocks or direct references)
  // We use contact_unlocks as a proxy — if someone has unlocked the contact it's in use
  const linkedInUnlocks = new Set<string>()
  for (let i = 0; i < allContactIds.length; i += 1000) {
    const batch = allContactIds.slice(i, i + 1000)
    const { data } = await supabase
      .from("contact_unlocks")
      .select("contact_id")
      .in("contact_id", batch)
    for (const r of data ?? []) linkedInUnlocks.add(r.contact_id)
  }

  const toDelete = allContactIds.filter(
    (id) => !linkedInLists.has(id) && !linkedInUnlocks.has(id)
  )
  const skipped = allContactIds.length - toDelete.length

  // Soft-delete in batches
  let deleted = 0
  const BATCH = 500
  for (let i = 0; i < toDelete.length; i += BATCH) {
    const batch = toDelete.slice(i, i + BATCH)
    const { data } = await supabase
      .from("contacts")
      .update({ visibility_status: "archived" })
      .in("id", batch)
      .select("id")
    deleted += data?.length ?? 0
  }

  return NextResponse.json({ deleted, skipped })
}
