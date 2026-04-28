"use client"

import { useEffect } from "react"
import Link from "next/link"

interface Props {
  type: "paywall" | "limit"
  onClose: () => void
}

export default function UnlockWallModal({ type, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const isPaywall = type === "paywall"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm bg-[#111827] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Icon + heading */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">
                {isPaywall ? "Upgrade to unlock contacts" : "Monthly limit reached"}
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">
                {isPaywall
                  ? "Get full access to emails, phones & LinkedIn"
                  : "You've used all your unlocks this month"}
              </p>
            </div>
          </div>

          {/* Plan comparison */}
          <div className="space-y-2 mb-5">
            {/* Free plan */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <div>
                <p className="text-gray-300 text-sm font-medium">Free</p>
                <p className="text-gray-500 text-xs mt-0.5">1 unlock / month</p>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-white/[0.06] px-2 py-0.5 rounded-md">
                Current
              </span>
            </div>

            {/* Pro plan */}
            <div className="flex items-center justify-between px-4 py-3 bg-gold/[0.06] border border-gold/25 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gold text-[#080c17] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                POPULAR
              </div>
              <div>
                <p className="text-gold text-sm font-bold">Pro</p>
                <p className="text-gray-400 text-xs mt-0.5">150 unlocks / month</p>
              </div>
              <div className="text-right">
                <p className="text-gold font-bold text-sm">£39</p>
                <p className="text-gray-500 text-[10px]">per month</p>
              </div>
            </div>

            {/* Agency plan */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <div>
                <p className="text-gray-300 text-sm font-medium">Agency</p>
                <p className="text-gray-500 text-xs mt-0.5">Unlimited unlocks</p>
              </div>
              <div className="text-right">
                <p className="text-gray-300 font-bold text-sm">£149</p>
                <p className="text-gray-500 text-[10px]">per month</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/app/billing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gold text-[#080c17] rounded-xl font-bold text-sm hover:bg-yellow-400 active:scale-[0.98] transition-all"
          >
            Upgrade now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-600 hover:text-gray-400 transition-colors mt-3 py-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
