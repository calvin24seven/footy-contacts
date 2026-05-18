const BASE_URL = "https://footycontacts.com"

export function buildOgImageUrl(params: {
  title: string
  subtitle?: string
  count?: number
}): string {
  const sp = new URLSearchParams({ title: params.title })
  if (params.subtitle) sp.set("subtitle", params.subtitle)
  if (params.count !== undefined) sp.set("count", String(params.count))
  return `${BASE_URL}/og?${sp.toString()}`
}
