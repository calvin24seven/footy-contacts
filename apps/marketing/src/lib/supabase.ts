import { createClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client for the marketing app.
 * Uses service role key — only call from server components, generateMetadata,
 * generateStaticParams, or route handlers. Never export to client components.
 *
 * Only fetches public/published contact data. Never selects sensitive fields
 * (email, phone, linkedin_url).
 */
export function createMarketingClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
