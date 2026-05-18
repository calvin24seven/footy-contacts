// This file is intentionally left as a redirect to the sitemap index.
// The sitemap index is served by app/sitemap.xml/route.ts which returns
// a proper <sitemapindex> with sub-sitemaps at /sitemaps/[name].
//
// Next.js generates /sitemap.xml from this file; the route handler at
// app/sitemap.xml/ takes precedence at runtime and returns the index.
import type { MetadataRoute } from "next"

// Fallback: single entry pointing to the actual index route.
// In practice this file is shadowed by the route handler.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://footycontacts.com" }]
}
