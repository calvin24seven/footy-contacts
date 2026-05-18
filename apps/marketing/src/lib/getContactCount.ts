/**
 * Fetches the live published contact count from Supabase.
 * Cached via Next.js ISR — revalidates every hour.
 * Falls back to "50,000+" on any error.
 */
export async function getContactCount(): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return "50,000+"

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/contacts?is_honeypot=eq.false&select=id`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Prefer: "count=exact",
          Range: "0-0",
        },
        next: { revalidate: 3600 },
      },
    )

    const contentRange = res.headers.get("content-range")
    if (!contentRange) return "50,000+"

    const total = parseInt(contentRange.split("/")[1], 10)
    if (isNaN(total) || total <= 0) return "50,000+"

    // Round down to nearest 1,000 so it's always accurate, e.g. 52,847 → "52,000+"
    const rounded = Math.floor(total / 1000) * 1000
    return rounded.toLocaleString("en-GB") + "+"
  } catch {
    return "50,000+"
  }
}
