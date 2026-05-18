import type { MetadataRoute } from "next"
import { client } from "@/sanity/lib/client"
import { allSlugsQuery } from "@/sanity/lib/queries"
import { createMarketingClient } from "@/lib/supabase"
import { MIN_CONTACTS_TO_INDEX } from "@footy/seo"

export const revalidate = 86400

const base = "https://footycontacts.com"

async function orgSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createMarketingClient()
    // Fetch all org slugs in batches; Supabase default page size is 1000.
    // For very large datasets this would need pagination — acceptable for Phase 0.
    const { data } = await supabase
      .from("organisations")
      .select("slug, updated_at")
      .not("slug", "is", null)
      .order("name")

    if (!data) return []

    // Filter orgs with enough contacts — requires a subquery or denormalized column.
    // For now we include all orgs with a slug; thin pages are suppressed via noindex
    // in the page itself until the contact_count column is added (Phase 6).
    return data
      .filter((r): r is { slug: string; updated_at: string | null } => typeof r.slug === "string")
      .map((r) => ({
        url: `${base}/org/${r.slug}`,
        lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Suppress unused import warning until org filtering uses this
  void MIN_CONTACTS_TO_INDEX

  const [blogSlugs, orgEntries] = await Promise.all([
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
      ? (client.fetch(allSlugsQuery) as Promise<{ slug: string }[]>).catch(() => [])
      : Promise.resolve([] as { slug: string }[]),
    orgSitemapEntries(),
  ])

  const posts: MetadataRoute.Sitemap = blogSlugs.map((s) => ({
    url: `${base}/blog/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [
    { url: base, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...posts,
    ...orgEntries,
  ]
}
