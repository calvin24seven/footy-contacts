/**
 * Vault secret accessor — the standard way to get secrets in this workspace.
 *
 * All application secrets (Stripe keys, API keys, etc.) live in Supabase Vault.
 * The only env vars required are:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY  (bootstrap key to access Vault)
 *
 * Usage:
 *   const key = await getSecret("stripe_secret_key")
 *
 * Store secrets in Vault via SQL:
 *   SELECT vault.create_secret('value', 'secret_name', 'description');
 */

import { createAdminClient } from "./supabase/admin"

// Module-level cache — persists within a warm serverless instance
const _cache = new Map<string, string>()

export async function getSecret(name: string): Promise<string> {
  if (_cache.has(name)) return _cache.get(name)!

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("get_admin_secret", { name })

  if (error) {
    throw new Error(`Vault error fetching '${name}': ${error.message}`)
  }
  if (!data) {
    throw new Error(
      `Secret '${name}' not found in Vault. Add it with: SELECT vault.create_secret('value', '${name}', 'description');`
    )
  }

  const value = data as string
  _cache.set(name, value)
  return value
}
