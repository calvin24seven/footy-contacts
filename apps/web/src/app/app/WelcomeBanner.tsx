"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import UpgradeModal from "./UpgradeModal"
import { useUnlocks } from "./UnlocksProvider"

export default function WelcomeBanner() {
  const { data: unlockData } = useUnlocks()
  // null = loading, true = dismissed, false = visible
  const [dismissed, setDismissed] = useState<boolean | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setDismissed(true); return }
      supabase
        .from("profiles")
        .select("dashboard_welcome_dismissed")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setDismissed((data as { dashboard_welcome_dismissed: boolean } | null)?.dashboard_welcome_dismissed ?? false)
        })
    })
  }, [])

  const unlockStats = unlockData
    ? { used: unlockData.used, limit: unlockData.limit, totalRemaining: unlockData.totalRemaining, planCode: unlockData.planCode }
    : null

  async function dismiss() {
    setDismissed(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      supabase
        .from("profiles")
        .update({ dashboard_welcome_dismissed: true } as never)
        .eq("id", user.id)
        .then()
    }
  }

  // null = still fetching, true = dismissed — either way, render nothing
  if (dismissed !== false) return null

  const planCode = unlockStats?.planCode ?? "free"
  const allUsed = unlockStats !== null && unlockStats.totalRemaining <= 0
  const someUsed = unlockStats !== null && unlockStats.used > 0

  // Context-aware upgrade copy
  const upgradeLine = planCode === "pro"
    ? "Upgrade to Agency for unlimited unlocks."
    : "Upgrade to Pro — 50× more contacts/month."

  const allUsedLine = planCode === "pro"
    ? <><span className="font-semibold text-white">All unlocks used.</span>{" "}{upgradeLine}</>
    : <><span className="font-semibold text-white">All {unlockStats?.limit ?? 3} free unlocks used.</span>{" "}{upgradeLine}</>

  const someUsedLine = (
    <><span className="font-semibold text-white">{unlockStats?.totalRemaining ?? 0} unlocks left.</span>{" "}{upgradeLine}</>
  )

  if (someUsed) {
    return (
      <>
        {showUpgrade && <UpgradeModal context="upgrade" onClose={() => setShowUpgrade(false)} />}
        <div className="mx-4 mt-3 mb-0 flex items-center justify-between gap-3 px-4 py-3 bg-[#111827] border border-white/[0.08] rounded-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-300">
            {allUsed ? allUsedLine : someUsedLine}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-3 py-1.5 bg-gold text-[#080c17] rounded-lg font-bold text-xs hover:bg-yellow-400 transition-colors cursor-pointer"
          >
            Upgrade
          </button>
          <button
            onClick={dismiss}
            className="p-1 rounded text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        </div>
      </>
    )
  }

  return (
    <div className="mx-4 mt-3 mb-0 flex items-center justify-between gap-3 px-4 py-3 bg-gold/[0.06] border border-gold/20 rounded-xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-gold">Welcome!</span>{" "}
          You have 3 free unlocks — search and reveal any contact&apos;s details.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="p-1 rounded text-gold/50 hover:text-gold transition-colors shrink-0 cursor-pointer"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
