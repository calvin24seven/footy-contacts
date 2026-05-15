"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUnlocks } from "@/app/app/UnlocksProvider"

interface UnlockButtonProps {
  contactId: string
  contactName: string
  emailConfirmed: boolean
}

export default function UnlockButton({ contactId, contactName, emailConfirmed }: UnlockButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ used: number; limit: number; plan: string } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const { data: unlockData } = useUnlocks()
  const supabase = createClient()

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
      window.dispatchEvent(new Event("unlocks-updated"))
      router.refresh()
      return
    }

    setError("Unable to unlock this contact. Please try again.")
  }

  // ── Email not confirmed gate ─────────────────────────────────────────────
  if (!emailConfirmed) {
    return (
      <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-5 text-center max-w-sm mx-auto">
        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-amber-200 text-sm font-medium mb-1">Verify your email to unlock</p>
        <p className="text-amber-300/70 text-xs mb-3">Check your inbox for a confirmation link.</p>
        <div className="flex flex-col items-center gap-2">
          {resendSent ? (
            <p className="text-amber-400 text-xs">Verification email sent!</p>
          ) : (
            <button
              onClick={async () => {
                setResending(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.email) await supabase.auth.resend({ type: "signup", email: user.email })
                setResending(false)
                setResendSent(true)
              }}
              disabled={resending}
              className="text-amber-300 text-xs underline hover:no-underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          )}
          <button
            onClick={async () => {
              setRefreshing(true)
              await supabase.auth.refreshSession()
              router.refresh()
            }}
            disabled={refreshing}
            className="text-gray-400 text-xs hover:text-gray-300 disabled:opacity-50"
          >
            {refreshing ? "Checking…" : "I&apos;ve verified — refresh"}
          </button>
        </div>
      </div>
    )
  }

  // ── Limit reached ────────────────────────────────────────────────────────
  if (limitInfo) {
    return (
      <div className="bg-navy-dark border border-yellow-800/40 rounded-xl p-6 text-center max-w-sm mx-auto">
        <div className="text-3xl mb-3">📊</div>
        <h3 className="text-white font-bold text-lg mb-2">Unlock limit reached</h3>
        <p className="text-gray-400 text-sm mb-2">
          You&apos;ve used all {limitInfo.limit} lifetime unlocks on your{" "}
          <span className="text-gold">{limitInfo.plan}</span> plan.
        </p>
        <p className="text-gray-500 text-xs mb-4">Upgrade your plan to unlock more contacts.</p>
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

  // ── Paywall ───────────────────────────────────────────────────────────────
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

  // ── Confirmation step ────────────────────────────────────────────────────
  if (confirming) {
    const remaining = unlockData?.totalRemaining ?? null
    const isUnlimited = unlockData?.limit === -1 || unlockData?.totalRemaining === -1

    return (
      <div className="bg-navy-dark border border-white/10 rounded-xl p-5 text-center max-w-sm mx-auto">
        <p className="text-white text-sm font-semibold mb-1">Unlock {contactName}?</p>
        <p className="text-gray-400 text-xs mb-4">
          {isUnlimited
            ? "This will use 1 unlock from your plan."
            : remaining !== null
            ? `This will use 1 of your ${remaining} remaining unlock${remaining === 1 ? "" : "s"}.`
            : "This will use 1 unlock from your plan."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { setConfirming(false); handleUnlock() }}
            disabled={loading}
            className="flex-1 py-2.5 bg-gold text-navy rounded-lg font-semibold text-sm hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Unlocking…" : "Confirm unlock"}
          </button>
        </div>
      </div>
    )
  }

  // ── Default unlock button ─────────────────────────────────────────────────
  return (
    <div className="text-center">
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <button
        onClick={() => setConfirming(true)}
        disabled={loading}
        className="px-6 py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50 text-sm"
      >
        🔓 Unlock contact
      </button>
      <p className="text-gray-500 text-xs mt-2">Uses 1 unlock from your plan allowance</p>
    </div>
  )
}


