import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/database.types"

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

const CSV_HEADERS = [
  "Name",
  "Role",
  "Organisation",
  "Email",
  "Phone",
  "City",
  "Country",
  "Level",
  "Category",
  "Region",
  "Website",
  "LinkedIn",
  "Instagram",
  "X / Twitter",
  "Verified",
  "Tags",
]

function escapeCell(val: string | null | undefined): string {
  if (val == null) return ""
  const s = String(val)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function contactToRow(c: Tables<"contacts">): string {
  return [
    c.name,
    c.role,
    c.organisation,
    c.email,
    c.phone,
    c.city,
    c.country,
    c.level,
    c.category,
    c.region,
    c.website,
    c.linkedin_url,
    c.instagram_url,
    c.x_url,
    c.verified_status,
    c.tags?.join("; "),
  ]
    .map(escapeCell)
    .join(",")
}

// ---------------------------------------------------------------------------
// POST /api/contacts/export
// Body: { list_id?: string } | { contact_ids?: string[] }
// Returns: CSV file or JSON error
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body = (await req.json()) as {
    list_id?: string
    contact_ids?: string[]
  }
  const { list_id, contact_ids } = body

  // Resolve requested IDs
  let requestedIds: string[] = []

  if (list_id) {
    // Verify list ownership then get contact IDs
    const { data: list } = await supabase
      .from("lists")
      .select("id")
      .eq("id", list_id)
      .eq("user_id", user.id)
      .single()
    if (!list) return NextResponse.json({ error: "list not found" }, { status: 404 })

    const { data: lc } = await supabase
      .from("list_contacts")
      .select("contact_id")
      .eq("list_id", list_id)
    requestedIds = lc?.map((r) => r.contact_id) ?? []
  } else if (contact_ids?.length) {
    requestedIds = contact_ids
  }

  if (requestedIds.length === 0) {
    return NextResponse.json({ error: "no contacts specified" }, { status: 400 })
  }

  // Only export contacts the user has already unlocked
  const { data: unlocks } = await supabase
    .from("contact_unlocks")
    .select("contact_id")
    .eq("user_id", user.id)
    .in("contact_id", requestedIds)

  const unlockedIds = unlocks?.map((u) => u.contact_id) ?? []

  if (unlockedIds.length === 0) {
    return NextResponse.json(
      { error: "none of the requested contacts have been unlocked" },
      { status: 400 }
    )
  }

  // Atomically check limit + log export
  const { data: logResult, error: logError } = await supabase.rpc("log_export", {
    p_contact_count: unlockedIds.length,
    p_list_id: list_id ?? null,
    p_export_type: "csv",
  })

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 })
  }

  const result = logResult as unknown as {
    success?: boolean
    error?: string
    requires_subscription?: boolean
    used?: number
    limit?: number
    plan?: string
  }

  if (result.error === "upgrade_required") {
    return NextResponse.json(result, { status: 402 })
  }
  if (result.error === "limit_reached") {
    return NextResponse.json(result, { status: 429 })
  }
  if (result.error) {
    return NextResponse.json(result, { status: 400 })
  }

  // Fetch full contact rows via admin client (bypass RLS for confirmed unlocks)
  const admin = createAdminClient()
  const { data: contacts } = await admin
    .from("contacts")
    .select("*")
    .in("id", unlockedIds)

  if (!contacts?.length) {
    return NextResponse.json({ error: "contacts not found" }, { status: 404 })
  }

  // Build CSV
  const lines = [CSV_HEADERS.join(","), ...contacts.map(contactToRow)]
  const csv = lines.join("\r\n")
  const filename = `footy-contacts-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
