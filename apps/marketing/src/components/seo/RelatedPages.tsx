import Link from "next/link"
import { createMarketingClient } from "@/lib/supabase"
import { countryFlag, toSlug } from "@footy/seo"

interface RelatedPagesContext {
  category?: string
  country?: string
  league?: string // league slug
  orgSlug?: string
}

interface RelatedLink {
  href: string
  label: string
}

/**
 * Server component — fetches contextually-relevant internal links and renders
 * a "Related pages" section.  Max 8 links per context.  Anchor text always
 * includes contact counts so links are descriptive and keyword-rich.
 */
export async function RelatedPages({ context }: { context: RelatedPagesContext }) {
  const links = await buildLinks(context)
  if (links.length === 0) return null

  return (
    <section aria-label="Related pages" className="mt-10 pt-8 border-t border-[#2E3A52]">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Related pages
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[#F9D783] hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Link builders ──────────────────────────────────────────────────────────────

async function buildLinks(ctx: RelatedPagesContext): Promise<RelatedLink[]> {
  const supabase = createMarketingClient()
  const links: RelatedLink[] = []

  // ── Category × Country page ──────────────────────────────────────────────
  if (ctx.category && ctx.country) {
    // Sibling countries for this category
    const { data: siblings } = await supabase
      .from("seo_category_country_stats")
      .select("country, contact_count")
      .eq("category", ctx.category)
      .neq("country", ctx.country)
      .order("contact_count", { ascending: false })
      .limit(4)

    for (const row of siblings ?? []) {
      const flag = countryFlag(row.country)
      links.push({
        href: `/football-contacts/${toSlug(ctx.category)}/${toSlug(row.country)}`,
        label: `${flag} ${row.country} (${row.contact_count.toLocaleString()} contacts)`,
      })
    }

    // Sibling categories in this country
    const { data: catSiblings } = await supabase
      .from("seo_category_country_stats")
      .select("category, contact_count")
      .eq("country", ctx.country)
      .neq("category", ctx.category)
      .order("contact_count", { ascending: false })
      .limit(4)

    for (const row of catSiblings ?? []) {
      const label = row.category.charAt(0).toUpperCase() + row.category.slice(1)
      links.push({
        href: `/football-contacts/${toSlug(row.category)}/${toSlug(ctx.country)}`,
        label: `${label} in ${ctx.country} (${row.contact_count.toLocaleString()} contacts)`,
      })
    }
  }

  // ── Category hub page ────────────────────────────────────────────────────
  else if (ctx.category && !ctx.country) {
    const { data: rows } = await supabase
      .from("seo_category_country_stats")
      .select("country, contact_count")
      .eq("category", ctx.category)
      .order("contact_count", { ascending: false })
      .limit(8)

    for (const row of rows ?? []) {
      const flag = countryFlag(row.country)
      const catLabel = ctx.category!.charAt(0).toUpperCase() + ctx.category!.slice(1)
      links.push({
        href: `/football-contacts/${toSlug(ctx.category!)}/${toSlug(row.country)}`,
        label: `${flag} ${catLabel} in ${row.country} (${row.contact_count.toLocaleString()} contacts)`,
      })
    }
  }

  // ── Country page ─────────────────────────────────────────────────────────
  else if (ctx.country && !ctx.category) {
    const { data: rows } = await supabase
      .from("seo_category_country_stats")
      .select("category, contact_count")
      .eq("country", ctx.country)
      .order("contact_count", { ascending: false })
      .limit(8)

    const flag = countryFlag(ctx.country)
    for (const row of rows ?? []) {
      const label = row.category.charAt(0).toUpperCase() + row.category.slice(1)
      links.push({
        href: `/football-contacts/${toSlug(row.category)}/${toSlug(ctx.country)}`,
        label: `${flag} ${label} in ${ctx.country} (${row.contact_count.toLocaleString()} contacts)`,
      })
    }
  }

  // ── League page ──────────────────────────────────────────────────────────
  else if (ctx.league) {
    // Top orgs in this league
    const { data: orgs } = await supabase
      .from("organisations")
      .select("name, slug, country, contact_count")
      .eq("league", ctx.league)
      .gt("contact_count", 0)
      .order("contact_count", { ascending: false })
      .limit(8)

    for (const org of orgs ?? []) {
      if (!org.slug) continue
      links.push({
        href: `/org/${org.slug}`,
        label: `${org.name} (${org.contact_count} contacts)`,
      })
    }
  }

  // ── Org page ─────────────────────────────────────────────────────────────
  else if (ctx.orgSlug) {
    // Get org details to find related orgs
    const { data: org } = await supabase
      .from("organisations")
      .select("name, league, country, contact_count")
      .eq("slug", ctx.orgSlug)
      .maybeSingle()

    if (org?.league) {
      const { data: related } = await supabase
        .from("organisations")
        .select("name, slug, contact_count")
        .eq("league", org.league)
        .neq("slug", ctx.orgSlug)
        .gt("contact_count", 0)
        .order("contact_count", { ascending: false })
        .limit(5)

      for (const r of related ?? []) {
        if (!r.slug) continue
        links.push({
          href: `/org/${r.slug}`,
          label: `${r.name} (${r.contact_count} contacts)`,
        })
      }
    }

    if (org?.country) {
      const flag = countryFlag(org.country)
      links.push({
        href: `/countries/${toSlug(org.country)}`,
        label: `${flag} All football contacts in ${org.country}`,
      })
    }

    if (org?.league) {
      links.push({
        href: `/football-contacts/league/${toSlug(org.league)}`,
        label: `${org.league} — all club contacts`,
      })
    }
  }

  return links.slice(0, 8)
}
