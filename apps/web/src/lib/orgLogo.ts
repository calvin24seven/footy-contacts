/**
 * Organisation logo resolution utilities.
 *
 * Strategy (in priority order):
 *  1. logo_url — admin-uploaded override (Supabase Storage URL, manually curated)
 *  2. domain   — Google favicon CDN, sz=128 — covers any site Google has indexed,
 *                which is every professional football club. No API key. No rate limit.
 *                For football clubs the favicon IS the badge — this gives crest quality.
 *  3. null     — caller renders an initials fallback
 *
 * Google favicon URL: https://www.google.com/s2/favicons?domain={domain}&sz=128
 * This has been stable since ~2008, served from t[1-3].gstatic.com CDN.
 * Responses are PNGs up to 128×128 px.
 *
 * DuckDuckGo fallback (img onError): https://icons.duckduckgo.com/ip3/{domain}.ico
 * Used as a secondary <img> fallback because .ico files work in all browsers
 * and DDG has independent crawling coverage.
 */

export function getOrgLogoUrl(
  org: { logo_url?: string | null; domain?: string | null } | null | undefined
): string | null {
  if (!org) return null
  if (org.logo_url) return org.logo_url
  if (org.domain) return `https://www.google.com/s2/favicons?domain=${org.domain}&sz=128`
  return null
}

/**
 * DuckDuckGo favicon URL — use as onError fallback src in <img> tags.
 * Covers sites where Google doesn't have a favicon cached.
 */
export function getOrgFaviconFallbackUrl(
  org: { domain?: string | null } | null | undefined
): string | null {
  if (!org?.domain) return null
  return `https://icons.duckduckgo.com/ip3/${org.domain}.ico`
}
