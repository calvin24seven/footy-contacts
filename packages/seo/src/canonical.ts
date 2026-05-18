const BASE_URL = "https://footycontacts.com"

export function buildCanonicalUrl(path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`
  return `${BASE_URL}${normalised}`
}
