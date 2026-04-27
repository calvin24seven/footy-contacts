"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function UnlockButton({ contactId }: { contactId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleUnlock() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    // Fetch profile and active subscription in parallel
    const [profileRes, subRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .limit(1)
        .maybeSingle(),
    ])

    const profile = profileRes.data
    if (!profile) { setError("Profile not found"); setLoading(false); return }

    const hasSubscription = !!subRes.data

    // If free unlock already used and no subscription → show paywall
    if (profile.free_unlock_used && !hasSubscription) {
      setShowPaywall(true)
      setLoading(false)
      return
    }

    const unlockType = !profile.free_unlock_used ? "free" : "subscription"

    const { error: unlockError } = await supabase.from("contact_unlocks").insert({
      user_id: user.id,
      contact_id: contactId,
      unlock_type: unlockType,
    })

    if (unlockError) {
      if (unlockError.code === "23505") {
        router.refresh()
        return
      }
      setError("Unable to unlock this contact. Check your plan limits.")
      setLoading(false)
      return
    }

    if (unlockType === "free") {
      await supabase
        .from("profiles")
        .update({ free_unlock_used: true })
        .eq("id", user.id)
    }

    router.refresh()
  }

  if (showPaywall) {
    return (
      <div className="bg-navy-dark border border-gold/20 rounded-xl p-6 text-center max-w-sm mx-auto">
        <div className="text-3xl mb-3">🔒</div>
        <h3 className="text-white font-bold text-lg mb-2">Upgrade to unlock</h3>
        <p className="text-gray-400 text-sm mb-4">
          You&apos;ve used your free unlock. Subscribe to unlock unlimited contacts and access
          emails, phone numbers, and social profiles.
        </p>
        <div className="space-y-2">
          <Link
            href="/app/billing"
            className="block w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors"
          >
            View plans
          </Link>
          <button
            onClick={() => setShowPaywall(false)}
            className="block w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        onClick={handleUnlock}
        disabled={loading}
        className="px-6 py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Unlocking…" : "Unlock Contact"}
      </button>
    </div>
  )
}

