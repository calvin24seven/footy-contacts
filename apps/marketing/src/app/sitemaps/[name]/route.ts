import { NextResponse } from "next/server"
import { createMarketingClient } from "@/lib/supabase"
import { MIN_CONTACTS_TO_INDEX, toSlug } from "@footy/seo"
import { client } from "@/sanity/lib/client"
import { allSlugsQuery } from "@/sanity/lib/queries"

export const revalidate = 86400

const base = "https://footycontacts.com"
const CURRENT_SEASON = "2025-26"

// Max URLs per sub-sitemap file
const ORG_PAGE_SIZE = 2000

type Params = { name: string }

function urlEntry(
  loc: string,
  opts?: {
    lastmod?: string
    changefreq?: string
    priority?: number
  }
): string {
  const lastmod = opts?.lastmod ? `\n    <lastmod>${opts.lastmod}</lastmod>` : ""
  const changefreq = opts?.changefreq
    ? `\n    <changefreq>${opts.changefreq}</changefreq>`
    : ""
  const priority =
    opts?.priority !== undefined
      ? `\n    <priority>${opts.priority.toFixed(1)}</priority>`
      : ""
  return `  <url>\n    <loc>${loc}</loc>${lastmod}${changefreq}${priority}\n  </url>`
}

function buildXml(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`
}

// ── Core pages ───────────────────────────────────────────────────────────────

async function coreEntries(): Promise<string[]> {
  const entries: string[] = [
    urlEntry(base, { changefreq: "weekly", priority: 1.0 }),
    urlEntry(`${base}/countries`, { changefreq: "weekly", priority: 0.9 }),
    urlEntry(`${base}/football-contacts/league`, { changefreq: "weekly", priority: 0.9 }),
    urlEntry(`${base}/blog`, { changefreq: "weekly", priority: 0.8 }),
  ]

  // Blog posts from Sanity
  try {
    if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      const slugs = (await (client.fetch(allSlugsQuery) as Promise<{ slug: string }[]>).catch(
        () => []
      )) as { slug: string }[]
      for (const s of slugs) {
        entries.push(
          urlEntry(`${base}/blog/${s.slug}`, { changefreq: "monthly", priority: 0.7 })
        )
      }
    }
  } catch {
    // non-fatal
  }

  return entries
}

// ── Country pages ────────────────────────────────────────────────────────────

async function countryEntries(): Promise<string[]> {
  const supabase = createMarketingClient()
  const { data } = await supabase.rpc("get_countries_with_contacts", {
    p_min_count: MIN_CONTACTS_TO_INDEX,
  })
  if (!data) return []

  return (data as Array<{ country: string; contact_count: number }>).map((row) =>
    urlEntry(`${base}/countries/${toSlug(row.country)}`, {
      changefreq: "weekly",
      priority: 0.8,
    })
  )
}

// ── League pages ─────────────────────────────────────────────────────────────

async function leagueEntries(): Promise<string[]> {
  const supabase = createMarketingClient()
  const { data } = await supabase.rpc("get_leagues_with_stats", { p_season: CURRENT_SEASON })
  if (!data) return []

  return (data as Array<{ slug: string; total_contacts: number }>)
    .filter((r) => r.total_contacts >= MIN_CONTACTS_TO_INDEX)
    .map((r) =>
      urlEntry(`${base}/football-contacts/league/${r.slug}`, {
        changefreq: "weekly",
        priority: 0.8,
      })
    )
}

// ── Org pages (paginated) ────────────────────────────────────────────────────

async function orgEntries(page: number): Promise<string[]> {
  const supabase = createMarketingClient()
  const from = page * ORG_PAGE_SIZE
  const to = from + ORG_PAGE_SIZE - 1

  const { data } = await supabase
    .from("organisations")
    .select("slug, updated_at")
    .not("slug", "is", null)
    .order("name")
    .range(from, to)

  if (!data) return []

  return (data as Array<{ slug: string; updated_at: string | null }>)
    .filter((r) => typeof r.slug === "string")
    .map((r) => {
      const lastmod = r.updated_at
        ? new Date(r.updated_at).toISOString().split("T")[0]
        : undefined
      return urlEntry(`${base}/org/${r.slug}`, {
        lastmod,
        changefreq: "weekly",
        priority: 0.7,
      })
    })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  const { name } = await context.params

  let entries: string[]

  if (name === "core") {
    entries = await coreEntries()
  } else if (name === "countries") {
    entries = await countryEntries()
  } else if (name === "leagues") {
    entries = await leagueEntries()
  } else if (name.startsWith("orgs-")) {
    const page = parseInt(name.replace("orgs-", ""), 10)
    if (isNaN(page) || page < 0 || page > 9) {
      return new NextResponse("Not found", { status: 404 })
    }
    entries = await orgEntries(page)
  } else {
    return new NextResponse("Not found", { status: 404 })
  }

  const xml = buildXml(entries)

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  })
}
