import Stripe from "stripe"
import { getSecret } from "./secrets"

let _stripe: Stripe | null = null

/**
 * Returns a Stripe client initialised with the secret key from Supabase Vault.
 * Cached after the first call within a serverless instance lifetime.
 */
export async function getStripe(): Promise<Stripe> {
  if (_stripe) return _stripe
  const key = await getSecret("stripe_secret_key")
  _stripe = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  })
  return _stripe
}

