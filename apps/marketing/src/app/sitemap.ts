import type { MetadataRoute } from "next"
import { client } from "@/sanity/lib/client"
import { allSlugsQuery } from "@/sanity/lib/queries"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
  const base = "https://footycontacts.com"

  const posts = slugs.map((s) => ({
    url: `${base}/blog/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [
    { url: base, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...posts,
  ]
}
