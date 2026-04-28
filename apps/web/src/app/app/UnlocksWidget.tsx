"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

interface UnlocksData {
  used: number
  limit: number
  periodEnd: string | null
  planName: string
  planCode: string
}

// Multiplier to next plan tier — for "Reach Nx more contacts" CTA
const NEXT_PLAN_LIMIT: Record<string, number> = {
  free: 50,     // Free → Starter
  starter: 250, // Starter → Pro
  pro: 750,     // Pro → Agency
  agency: 0,    // Max plan
}

export default function UnlocksWidget() {
  const [data, setData] = useState<UnlocksData | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/account/unlocks")
      .then((r) => r.json())
      .then((d) => setData(d as UnlocksData))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  // Loading skeleton
  if (!data) {
    return <div className="h-7 w-20 bg-navy-light rounded-lg animate-pulse" />
  }

  const remaining = Math.max(0, data.limit - data.used)
  const pct = data.limit > 0 ? Math.min(100, (data.used / data.limit) * 100) : 100
  const barColor = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-400" : "bg-green-500"
  const badgeColor = remaining === 0 ? "text-red-400" : remaining <= Math.ceil(data.limit * 0.2) ? "text-amber-400" : "text-gold"

  let daysUntilReset: number | null = null
  if (data.periodEnd) {
    daysUntilReset = Math.max(0, Math.ceil(
      (new Date(data.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))
  }

  const nextLimit = NEXT_PLAN_LIMIT[data.planCode] ?? 0
  const upgradeMultiplier = nextLimit > 0 ? Math.round(nextLimit / Math.max(1, data.limit)) : 0

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Badge button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-light hover:bg-[#354460] transition-colors"
        aria-label="View unlock usage"
      >
        {/* Key icon */}
        <svg className="w-3.5 h-3.5 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span className={`font-semibold text-xs tabular-nums ${badgeColor}`}>{remaining}</span>
        <span className="text-gray-400 text-xs hidden sm:inline">left</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-navy border border-navy-light rounded-xl shadow-2xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">Unlocks</p>
            <span className="text-xs text-gray-400 bg-navy-light px-2 py-0.5 rounded-full">{data.planName}</span>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{data.used} used</span>
              <span>{remaining} remaining</span>
            </div>
            <div className="h-2 bg-navy-dark rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Reset info */}
          {daysUntilReset !== null ? (
            <p className="text-xs text-gray-500">
              Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}
            </p>
          ) : data.planCode === "free" ? (
            <p className="text-xs text-gray-500">Lifetime allowance — upgrade for monthly unlocks</p>
          ) : null}

          {/* Upgrade CTA */}
          {upgradeMultiplier > 1 && (
            <Link
              href="/app/billing"
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Reach {upgradeMultiplier}x more contacts
            </Link>
          )}

          {upgradeMultiplier === 0 && (
            <p className="mt-3 text-xs text-center text-gray-500">You&apos;re on the highest plan</p>
          )}
        </div>
      )}
    </div>
  )
}
