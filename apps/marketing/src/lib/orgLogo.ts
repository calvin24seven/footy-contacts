/**
 * Organisation logo resolution utilities.
 *
 * Strategy (in priority order):
 *  1. logo_url — admin-uploaded override
 *  2. domain   — Google favicon CDN (sz=128), stable since ~2008
 *  3. null     — caller renders an initials fallback
 */
export function getOrgLogoUrl(
  org: { logo_url?: string | null; domain?: string | null } | null | undefined,
): string | null {
  if (!org) return null
  if (org.logo_url) return org.logo_url
  if (org.domain)
    return `https://www.google.com/s2/favicons?domain=${org.domain}&sz=128`
  return null
}

/**
 * DuckDuckGo favicon URL — use as onError fallback src in <img> tags.
 */
export function getOrgFaviconFallbackUrl(
  org: { domain?: string | null } | null | undefined,
): string | null {
  if (!org?.domain) return null
  return `https://icons.duckduckgo.com/ip3/${org.domain}.ico`
}
