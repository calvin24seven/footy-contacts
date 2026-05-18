import { NextResponse } from "next/server"

export const revalidate = 86400

const base = "https://footycontacts.com"

// Sub-sitemap names — keep in sync with /sitemaps/[name]/route.ts
const SUB_SITEMAPS = [
  "core",
  "countries",
  "leagues",
  "orgs-0",
  "orgs-1",
  "orgs-2",
]

export function GET() {
  const now = new Date().toISOString().split("T")[0] // YYYY-MM-DD

  const entries = SUB_SITEMAPS.map(
    (name) =>
      `  <sitemap>\n    <loc>${base}/sitemaps/${name}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`
  ).join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  })
}
