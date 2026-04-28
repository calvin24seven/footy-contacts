import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * POST /api/admin/suppressions/domain
 * Body: { domain: "sport.es", reason: "hard_bounce" }
 *
 * 1. Finds all contacts with email ending in @domain
 * 2. Upserts them into email_suppressions
 * 3. Clears their email field (sets to null)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { domain, reason = "manual" } = (await req.json()) as { domain?: string; reason?: string }
  if (!domain?.trim() || !domain.includes(".")) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 })
  }
  const cleanDomain = domain.trim().replace(/^@/, "").toLowerCase()

  // Fetch all matching emails in pages (PostgREST 1000-row cap)
  const PAGE_SIZE = 1000
  const allEmails: string[] = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from("contacts")
      .select("email")
      .ilike("email", `%@${cleanDomain}`)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    for (const c of data) { if (c.email) allEmails.push(c.email.toLowerCase()) }
    if (data.length < PAGE_SIZE) break
    page++
  }

  if (allEmails.length === 0) {
    return NextResponse.json({ suppressed: 0, message: "No contacts found for that domain" })
  }

  // Upsert suppressions in batches of 500
  const BATCH = 500
  for (let i = 0; i < allEmails.length; i += BATCH) {
    const batch = allEmails.slice(i, i + BATCH)
    await supabase.from("email_suppressions").upsert(
      batch.map((email) => ({ email, reason, added_by: user.id })),
      { onConflict: "email", ignoreDuplicates: true }
    )
    // Clear the email from contacts
    await supabase
      .from("contacts")
      .update({ email: null, verified_status: "unverified" })
      .in("email", batch)
  }

  return NextResponse.json({ suppressed: allEmails.length })
}
