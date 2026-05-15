import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/database.types"
import { rateLimit } from "@/lib/rate-limit"

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
// Body: { list_id?: string } | { contact_ids?: string[] } | { search_filters?: Record<string,string> }
// Returns: CSV file or JSON error
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  // 1 export per user per hour
  const perHour = await rateLimit(`export:${user.id}`, 1, 3600)
  if (!perHour.allowed) {
    return NextResponse.json({ error: "export_limit_reached", message: "You can export once per hour." }, { status: 429 })
  }

  const body = (await req.json()) as {
    list_id?: string
    contact_ids?: string[]
    search_filters?: Record<string, string>
  }
  const { list_id, contact_ids, search_filters } = body

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
  } else if (search_filters) {
    // Re-run the search query to find matching contact IDs (capped at 1000)
    function escapeLike(s: string) {
      return s.replace(/[%_\\]/g, "\\$&")
    }
    type IdRow = { id: string }
    let q = supabase
      .from("contacts")
      .select("id")
      .eq("visibility_status", "published")
      .eq("suppression_status", "active")
      .limit(1000)
    if (search_filters.q?.trim()) {
      const escaped = escapeLike(search_filters.q.trim())
      q = q.or(`name.ilike.%${escaped}%,role.ilike.%${escaped}%,organisation.ilike.%${escaped}%`)
    }
    if (search_filters.role?.trim()) {
      const roles = search_filters.role.split(",").map((s) => s.trim()).filter(Boolean)
      if (roles.length === 1) {
        q = q.ilike("role", `%${escapeLike(roles[0])}%`)
      } else {
        q = q.or(roles.map((r) => `role.ilike.%${escapeLike(r)}%`).join(","))
      }
    }
    if (search_filters.role_exclude?.trim()) {
      for (const r of search_filters.role_exclude.split(",").map((s) => s.trim()).filter(Boolean)) {
        q = q.not("role", "ilike", `%${escapeLike(r)}%`)
      }
    }
    if (search_filters.org?.trim()) {
      const orgs = search_filters.org.split(",").map((s) => s.trim()).filter(Boolean)
      if (orgs.length === 1) {
        q = q.ilike("organisation", `%${escapeLike(orgs[0])}%`)
      } else {
        q = q.or(orgs.map((o) => `organisation.ilike.%${escapeLike(o)}%`).join(","))
      }
    }
    if (search_filters.org_exclude?.trim()) {
      for (const o of search_filters.org_exclude.split(",").map((s) => s.trim()).filter(Boolean)) {
        q = q.not("organisation", "ilike", `%${escapeLike(o)}%`)
      }
    }
    if (search_filters.city?.trim()) {
      q = q.ilike("city", `%${escapeLike(search_filters.city.trim())}%`)
    }
    if (search_filters.country?.trim()) {
      q = q.eq("country", search_filters.country.trim())
    }
    if (search_filters.email_status) {
      if (search_filters.email_status === "has_email") {
        q = q.eq("has_email", true) as typeof q
      } else if (search_filters.email_status === "no_email") {
        q = q.eq("has_email", false) as typeof q
      } else {
        q = q.eq("verified_status", search_filters.email_status)
      }
    }
    if (search_filters.category?.trim()) {
      q = q.eq("category", search_filters.category.trim())
    }
    if (search_filters.has_phone === "1") {
      q = q.eq("has_phone", true) as typeof q
    }
    const { data: matching } = await q
    requestedIds = ((matching ?? []) as IdRow[]).map((c) => c.id)
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

  const unlockedIds = (unlocks?.map((u) => u.contact_id) ?? []).slice(0, 500)

  if (unlockedIds.length === 0) {
    return NextResponse.json(
      { error: "none of the requested contacts have been unlocked" },
      { status: 400 }
    )
  }

  // Atomically check limit + log export
  const { data: logResult, error: logError } = await supabase.rpc("log_export", {
    p_contact_count: unlockedIds.length,
    p_list_id: list_id ?? undefined,
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
    .eq("is_honeypot", false)

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
