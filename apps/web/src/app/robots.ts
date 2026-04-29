import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footycontacts.com"
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: [
          "/app/",
          "/admin/",
          "/api/",
          "/onboarding/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
