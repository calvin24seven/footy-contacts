import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/database.types"

/**
 * Service-role Supabase client for server-side API routes that don't have
 * a cookie context (e.g. Stripe webhook handler, billing routes).
 * Bypasses RLS — use only in trusted server-side code.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
