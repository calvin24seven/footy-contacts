"use client"

import { useEffect, useState } from "react"
import UpgradeModal from "./UpgradeModal"

const STORAGE_KEY = "fc_welcome_v1_dismissed"

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false)
  const [unlockStats, setUnlockStats] = useState<{ used: number; limit: number; totalRemaining: number } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    setVisible(true)

    // Load unlock stats (server-authoritative)
    fetch("/api/account/unlocks")
      .then((r) => r.json())
      .then((d: { used?: number; limit?: number; totalRemaining?: number }) => {
        setUnlockStats({
          used: d.used ?? 0,
          limit: d.limit ?? 3,
          totalRemaining: d.totalRemaining ?? 0,
        })
      })
      .catch(() => undefined)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  if (!visible) return null

  const allFreeUsed = unlockStats !== null && unlockStats.used >= unlockStats.limit && unlockStats.totalRemaining <= 0
  const someUsed = unlockStats !== null && unlockStats.used > 0

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
          <p className="text-sm text-gray-300 truncate">
            {allFreeUsed ? (
              <><span className="font-semibold text-white">3 free unlocks used.</span>{" "}Upgrade to Pro for 150 unlocks / month.</>
            ) : (
              <><span className="font-semibold text-white">{unlockStats?.used ?? 0} of 3 free unlocks used.</span>{" "}{unlockStats?.totalRemaining ?? 0} remaining — upgrade to Pro for 150/month.</>
            )}
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
        <p className="text-sm text-gray-300 truncate">
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
