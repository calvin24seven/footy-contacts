"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type PlanCode = "pro" | "agency"
type BillingInterval = "monthly" | "yearly"

const PLANS: Record<PlanCode, {
  name: string
  popular: boolean
  monthly: { price: string; sub: string }
  yearly: { price: string; sub: string; saving: string }
  features: string[]
}> = {
  pro: {
    name: "Pro",
    popular: true,
    monthly: { price: "£39", sub: "per month" },
    yearly:  { price: "£390", sub: "per year", saving: "£78 saving" },
    features: [
      "150 unlocks per month",
      "75 exports per month",
      "Saved searches",
      "Email + phone + LinkedIn",
      "Cancel anytime",
    ],
  },
  agency: {
    name: "Agency",
    popular: false,
    monthly: { price: "£149", sub: "per month" },
    yearly:  { price: "£1,490", sub: "per year", saving: "£298 saving" },
    features: [
      "Unlimited unlocks",
      "500 exports per month",
      "3 team seats",
      "Priority support",
      "Cancel anytime",
    ],
  },
}

export interface UpgradeModalProps {
  context?: "paywall" | "limit" | "upgrade"
  onClose: () => void
}

export default function UpgradeModal({ context = "upgrade", onClose }: UpgradeModalProps) {
  const [interval, setIntervalState] = useState<BillingInterval>("monthly")
  const [loading, setLoading] = useState<PlanCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  async function handleCheckout(planCode: PlanCode) {
    setLoading(planCode)
    setError(null)
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode, billingPeriod: interval }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong. Please try again.")
      setLoading(null)
      return
    }
    router.push(data.url)
  }

  const heading =
    context === "paywall" ? "Unlock this contact" :
    context === "limit"   ? "Monthly limit reached" :
    "Upgrade your plan"

  const subheading =
    context === "paywall" ? "Reveal email, phone & LinkedIn for any contact." :
    context === "limit"   ? "You've used all your unlocks this month. Upgrade to continue." :
    "More unlocks, exports, and team features."

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-[#0d1424] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors cursor-pointer z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="mb-6 pr-8">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-lg">{heading}</h2>
            </div>
            <p className="text-gray-400 text-sm">{subheading}</p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-white/[0.05] border border-white/[0.06] rounded-xl p-1 gap-1">
              <button
                onClick={() => setIntervalState("monthly")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  interval === "monthly"
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIntervalState("yearly")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  interval === "yearly"
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Yearly
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md leading-none">
                  2 MONTHS FREE
                </span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {(["pro", "agency"] as PlanCode[]).map((code) => {
              const plan = PLANS[code]
              const isPro = code === "pro"
              const pricing = interval === "yearly" ? plan.yearly : plan.monthly
              const isLoading = loading === code

              return (
                <div
                  key={code}
                  className={`relative flex flex-col rounded-xl p-4 border ${
                    isPro
                      ? "border-gold/40 bg-gold/[0.04]"
                      : "border-white/[0.08] bg-white/[0.03]"
                  }`}
                >
                  {/* Popular badge */}
                  {isPro && (
                    <div className="absolute -top-px left-5">
                      <span className="inline-block bg-gold text-[#080c17] text-[10px] font-bold px-2.5 py-[3px] rounded-b-lg tracking-wide">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className={isPro ? "mt-4 mb-3" : "mb-3"}>
                    <p className={`font-bold text-sm mb-1 ${isPro ? "text-gold" : "text-gray-300"}`}>
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold tracking-tight ${isPro ? "text-gold" : "text-white"}`}>
                        {pricing.price}
                      </span>
                      <span className="text-gray-500 text-xs">{pricing.sub}</span>
                    </div>
                    {interval === "yearly" && (
                      <p className="text-emerald-400 text-xs mt-0.5 font-medium">{plan.yearly.saving}</p>
                    )}
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <svg
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isPro ? "text-gold" : "text-gray-400"}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs text-gray-300">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleCheckout(code)}
                    disabled={loading !== null}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isPro
                        ? "bg-gold text-[#080c17] hover:bg-yellow-400"
                        : "bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/[0.1]"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Redirecting…
                      </>
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center mb-3">{error}</p>
          )}

          {/* Footer note */}
          <p className="text-center text-[11px] text-gray-600 leading-relaxed">
            Free plan: 3 lifetime unlocks · No credit card required ·{" "}
            <button
              onClick={onClose}
              className="underline hover:text-gray-400 transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
