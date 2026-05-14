import type { MetadataRoute } from "next"
import { client } from "@/sanity/lib/client"
import { allSlugsQuery } from "@/sanity/lib/queries"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://footycontacts.com"
  let posts: MetadataRoute.Sitemap = []

  if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
    posts = slugs.map((s) => ({
      url: `${base}/blog/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  }

  return [
    { url: base, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...posts,
  ]
}
