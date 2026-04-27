"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function UnlockButton({ contactId }: { contactId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ used: number; limit: number; plan: string } | null>(null)
  const router = useRouter()

  async function handleUnlock() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/contacts/${contactId}/unlock`, { method: "POST" })
    const data = await res.json() as {
      success?: boolean
      already_unlocked?: boolean
      error?: string
      requires_subscription?: boolean
      used?: number
      limit?: number
      plan?: string
    }

    setLoading(false)

    if (res.status === 402 || data.requires_subscription) {
      setShowPaywall(true)
      return
    }

    if (res.status === 429 && data.error === "limit_reached") {
      setLimitInfo({ used: data.used!, limit: data.limit!, plan: data.plan! })
      return
    }

    if (data.success) {
      router.refresh()
      return
    }

    setError("Unable to unlock this contact. Please try again.")
  }

  if (limitInfo) {
    return (
      <div className="bg-navy-dark border border-yellow-800/40 rounded-xl p-6 text-center max-w-sm mx-auto">
        <div className="text-3xl mb-3">📊</div>
        <h3 className="text-white font-bold text-lg mb-2">Monthly limit reached</h3>
        <p className="text-gray-400 text-sm mb-2">
          You&apos;ve used all {limitInfo.limit} unlocks on your{" "}
          <span className="text-gold">{limitInfo.plan}</span> plan this month.
        </p>
        <p className="text-gray-500 text-xs mb-4">
          Limits reset at the start of your next billing period, or upgrade for more.
        </p>
        <div className="space-y-2">
          <Link
            href="/app/billing"
            className="block w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors text-sm"
          >
            Upgrade plan
          </Link>
          <button
            onClick={() => setLimitInfo(null)}
            className="block w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  if (showPaywall) {
    return (
      <div className="bg-navy-dark border border-gold/20 rounded-xl p-6 text-center max-w-sm mx-auto">
        <div className="text-3xl mb-3">🔒</div>
        <h3 className="text-white font-bold text-lg mb-2">Upgrade to unlock</h3>
        <p className="text-gray-400 text-sm mb-4">
          You&apos;ve used your free unlock. Subscribe to unlock contacts and access emails,
          phone numbers, and social profiles.
        </p>
        <div className="space-y-2">
          <Link
            href="/app/billing"
            className="block w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors text-sm"
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
    <div className="text-center">
      {error && (
        <p className="text-red-400 text-xs mb-3">{error}</p>
      )}
      <button
        onClick={handleUnlock}
        disabled={loading}
        className="px-6 py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? "Unlocking…" : "🔓 Unlock contact"}
      </button>
      <p className="text-gray-500 text-xs mt-2">
        Uses 1 unlock from your monthly allowance
      </p>
    </div>
  )
}

