"use client"

import { useState, useRef, useEffect } from "react"
import UpgradeModal from "./UpgradeModal"
import { useUnlocks } from "./UnlocksProvider"

// Contacts available on the next plan tier (for upgrade CTA)
const NEXT_PLAN_CONTACTS: Record<string, number> = {
  free: 150,   // → Pro (150/month)
  pro: 0,      // → Agency (unlimited — show "unlimited" CTA)
  agency: 0,   // Max plan
}

export default function UnlocksWidget() {
  const { data } = useUnlocks()
  const [open, setOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  if (!data) {
    return <div className="h-7 w-20 bg-navy-light rounded-lg animate-pulse" />
  }

  // Unlimited plan
  const isUnlimited = data.limit === -1 || data.totalRemaining === -1

  // Badge shows totalRemaining (includes bonus credits)
  const remaining = isUnlimited ? Infinity : data.totalRemaining
  const displayRemaining = isUnlimited ? "∞" : String(remaining)

  // Progress bar is based on base plan quota only (not bonus)
  const pct = isUnlimited ? 0 : data.limit > 0 ? Math.min(100, (data.used / data.limit) * 100) : 100
  const barColor = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-400" : "bg-green-500"
  const badgeColor = !isUnlimited && remaining === 0
    ? "text-red-400"
    : !isUnlimited && remaining <= Math.ceil(data.limit * 0.2)
    ? "text-amber-400"
    : "text-gold"

  let daysUntilReset: number | null = null
  if (data.periodEnd) {
    daysUntilReset = Math.max(0, Math.ceil(
      (new Date(data.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))
  }

  const nextPlanContacts = NEXT_PLAN_CONTACTS[data.planCode] ?? 0
  const showUpgradeCTA = data.planCode !== "agency" && !isUnlimited

  return (
    <div className="relative shrink-0" ref={ref}>
      {showUpgrade && <UpgradeModal context="upgrade" onClose={() => setShowUpgrade(false)} />}

      {/* Badge button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-light hover:bg-[#354460] transition-colors cursor-pointer"
        aria-label="View unlock usage"
      >
        <svg className="w-3.5 h-3.5 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span className={`font-semibold text-xs tabular-nums ${badgeColor}`}>{displayRemaining}</span>
        <span className="text-gray-400 text-xs">unlocks</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-68 bg-navy border border-navy-light rounded-xl shadow-2xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">Unlocks</p>
            <span className="text-xs text-gray-400 bg-navy-light px-2 py-0.5 rounded-full">{data.planName}</span>
          </div>

          {isUnlimited ? (
            <p className="text-xs text-green-400 mb-3">Unlimited unlocks on your plan</p>
          ) : (
            <>
              {/* Progress bar — base plan quota */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>
                    {data.planCode === "free"
                      ? `${data.used} of 3 free unlocks used`
                      : `${data.used} used this period`}
                  </span>
                  <span>{Math.max(0, data.limit - data.used)} base left</span>
                </div>
                <div className="h-2 bg-navy-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Bonus credits row */}
              {data.bonus > 0 && (
                <div className="flex justify-between text-xs text-amber-400 mb-2">
                  <span>Bonus credits</span>
                  <span>+{data.bonus}</span>
                </div>
              )}

              {/* Total remaining */}
              <div className="flex justify-between text-xs font-semibold text-white mb-3">
                <span>Total remaining</span>
                <span>{data.totalRemaining}</span>
              </div>
            </>
          )}

          {/* Reset / lifetime info */}
          {daysUntilReset !== null ? (
            <p className="text-xs text-gray-500">
              Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}
            </p>
          ) : data.planCode === "free" ? (
            <p className="text-xs text-gray-500">3 lifetime free unlocks — upgrade for monthly quota</p>
          ) : null}

          {/* Upgrade CTA */}
          {showUpgradeCTA && (
            <button
              onClick={() => { setOpen(false); setShowUpgrade(true) }}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {data.planCode === "free"
                ? `Upgrade — get ${nextPlanContacts} unlocks/mo`
                : "Upgrade to Agency — unlimited"}
            </button>
          )}

          {data.planCode === "agency" && (
            <p className="mt-3 text-xs text-center text-gray-500">You&apos;re on the highest plan</p>
          )}
        </div>
      )}
    </div>
  )
}

