"use client"

import { useState } from "react"
import type { SaveOfferType } from "@/app/api/billing/save-offer/route"

interface CancelRetentionModalProps {
  planName: string
  periodEnd: string | null
  onSaveAccepted: () => void
  onContinueToCancel: () => void
  onClose: () => void
}

export default function CancelRetentionModal({
  planName,
  periodEnd,
  onSaveAccepted,
  onContinueToCancel,
  onClose,
}: CancelRetentionModalProps) {
  const [loading, setLoading] = useState<SaveOfferType | "cancel" | null>(null)
  const [accepted, setAccepted] = useState<SaveOfferType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const renewDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null

  async function applyOffer(offerType: SaveOfferType) {
    setLoading(offerType)
    setError(null)
    try {
      const res = await fetch("/api/billing/save-offer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ offerType }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Something went wrong")
      }
      setAccepted(offerType)
      onSaveAccepted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  async function handleContinueCancel() {
    setLoading("cancel")
    onContinueToCancel()
  }

  if (accepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-[#0f1623] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">
            {accepted === "half_off" ? "Discount applied" : "Month paused"}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {accepted === "half_off"
              ? "Your next invoice will be 50% off. No action needed — it applies automatically."
              : "Your next month is free. Your subscription continues as normal from the following month."}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            Back to billing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f1623] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="mb-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Before you go</p>
          <h2 className="text-white text-xl font-bold">
            Keep your {planName} access?
          </h2>
          {renewDate && (
            <p className="text-gray-500 text-sm mt-1">
              Your plan renews on {renewDate}
            </p>
          )}
        </div>

        {/* Offer cards */}
        <div className="space-y-3 mb-5">
          {/* Half off offer */}
          <button
            onClick={() => applyOffer("half_off")}
            disabled={loading !== null}
            className="w-full text-left p-4 rounded-xl border border-gold/30 bg-gold/[0.04] hover:bg-gold/[0.08] hover:border-gold/50 transition-all cursor-pointer disabled:opacity-60 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-gold font-semibold text-sm">50% off your next month</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Pay half price this month, then your normal rate.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-white font-bold text-lg leading-none">£19.50</p>
                <p className="text-gray-500 text-xs">next invoice</p>
              </div>
            </div>
            {loading === "half_off" && (
              <div className="flex items-center gap-2 mt-2 text-gold text-xs">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Applying…
              </div>
            )}
          </button>

          {/* Pause offer */}
          <button
            onClick={() => applyOffer("pause")}
            disabled={loading !== null}
            className="w-full text-left p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-sm">Pause for 1 month — free</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Skip next month at no cost. Resumes automatically after.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-white font-bold text-lg leading-none">£0</p>
                <p className="text-gray-500 text-xs">next invoice</p>
              </div>
            </div>
            {loading === "pause" && (
              <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Applying…
              </div>
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mb-4">{error}</p>
        )}

        {/* Cancel through */}
        <button
          onClick={handleContinueCancel}
          disabled={loading !== null}
          className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading === "cancel" ? "Opening portal…" : "No thanks, cancel anyway"}
        </button>
      </div>
    </div>
  )
}
