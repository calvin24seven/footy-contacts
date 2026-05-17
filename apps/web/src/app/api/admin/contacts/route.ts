import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { supabase: null, forbidden: true }
  const { data: profile } = await authClient
    .from("profiles").select("role").eq("id", user.id).single()
  const supabase = createAdminClient()
  return { supabase, forbidden: profile?.role !== "admin" }
}

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&")
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, p: URLSearchParams): any {
  const q = p.get("q")?.trim()
  if (q) {
    const esc = escapeLike(q)
    query = query.or(`name.ilike.%${esc}%,role.ilike.%${esc}%,organisation.ilike.%${esc}%,email.ilike.%${esc}%`)
  }

  const roles = (p.get("role") ?? "").split(",").map(s => s.trim()).filter(Boolean)
  if (roles.length === 1) query = query.ilike("role", `%${escapeLike(roles[0])}%`)
  else if (roles.length > 1) query = query.or(roles.map(r => `role.ilike.%${escapeLike(r)}%`).join(","))

  const roleExclude = (p.get("role_exclude") ?? "").split(",").map(s => s.trim()).filter(Boolean)
  for (const r of roleExclude) query = query.not("role", "ilike", `%${escapeLike(r)}%`)

  const orgs = (p.get("org") ?? "").split(",").map(s => s.trim()).filter(Boolean)
  if (orgs.length === 1) query = query.ilike("organisation", `%${escapeLike(orgs[0])}%`)
  else if (orgs.length > 1) query = query.or(orgs.map(o => `organisation.ilike.%${escapeLike(o)}%`).join(","))

  const orgExclude = (p.get("org_exclude") ?? "").split(",").map(s => s.trim()).filter(Boolean)
  for (const o of orgExclude) query = query.not("organisation", "ilike", `%${escapeLike(o)}%`)

  const city = p.get("city")?.trim()
  if (city) query = query.ilike("city", `%${escapeLike(city)}%`)

  const country = p.get("country")?.trim()
  if (country) query = query.eq("country", country)

  const emailStatus = p.get("email_status")?.trim()
  if (emailStatus === "has_email")  query = query.eq("has_email", true)
  else if (emailStatus === "no_email") query = query.eq("has_email", false)
  else if (emailStatus)             query = query.eq("verified_status", emailStatus)

  const category = p.get("category")?.trim()
  if (category) query = query.eq("category", category)

  const visibilityStatus = p.get("visibility_status")?.trim()
  if (visibilityStatus) query = query.eq("visibility_status", visibilityStatus)

  const suppressionStatus = p.get("suppression_status")?.trim()
  if (suppressionStatus) query = query.eq("suppression_status", suppressionStatus)

  const isHoneypot = p.get("is_honeypot")?.trim()
  if (isHoneypot === "true")  query = query.eq("is_honeypot", true)
  else if (isHoneypot === "false") query = query.eq("is_honeypot", false)

  if (p.get("has_phone") === "1") query = query.eq("has_phone", true)

  return query
}

/**
 * GET /api/admin/contacts
 * Full-featured admin contact search with all filters + pagination.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { supabase, forbidden } = await requireAdmin()
  if (forbidden || !supabase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
  const sort  = searchParams.get("sort") ?? "created_at_desc"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("contacts") as any)
    .select(
      "id, name, role, organisation, email, phone, country, city, category, level, " +
      "verified_status, visibility_status, suppression_status, import_status, " +
      "has_email, has_phone, has_linkedin, is_honeypot, created_at, updated_at",
      { count: "exact" }
    )

  query = applyFilters(query, searchParams)

  if (sort === "name_asc")           query = query.order("name", { ascending: true })
  else if (sort === "name_desc")     query = query.order("name", { ascending: false })
  else if (sort === "created_at_asc")query = query.order("created_at", { ascending: true })
  else                               query = query.order("created_at", { ascending: false })

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}
