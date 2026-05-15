"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Tables } from "@/database.types"

type PlanRow = Tables<"plans">
type BillingInterval = "monthly" | "yearly"
type PlanCode = "pro" | "agency"

// Hardcoded plan display data — matches UpgradeModal
const PLAN_DISPLAY: Record<PlanCode, {
  monthly: { price: string; sub: string }
  yearly: { price: string; sub: string; saving: string }
  features: string[]
}> = {
  pro: {
    monthly: { price: "£39", sub: "per month" },
    yearly:  { price: "£390", sub: "per year", saving: "Save £78 (2 months free)" },
    features: [
      "150 unlocks per month",
      "75 exports per month",
      "Saved searches",
      "Email + phone + LinkedIn",
      "Cancel anytime",
    ],
  },
  agency: {
    monthly: { price: "£149", sub: "per month" },
    yearly:  { price: "£1,490", sub: "per year", saving: "Save £298 (2 months free)" },
    features: [
      "Unlimited unlocks",
      "500 exports per month",
      "3 team seats",
      "Priority support",
      "Cancel anytime",
    ],
  },
}

interface BillingContentProps {
  plans: PlanRow[]
  currentPlanCode: string | null
  hasActiveSub: boolean
  periodEnd: string | null
  subStatus: string | null
}

export function BillingContent({
  plans,
  currentPlanCode,
  hasActiveSub,
  periodEnd,
  subStatus,
}: BillingContentProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [managingPortal, setManagingPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCheckout(plan: PlanRow) {
    setLoadingPlan(plan.code)
    setError(null)
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode: plan.code, billingPeriod: interval }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong.")
      setLoadingPlan(null)
      return
    }
    router.push(data.url)
  }

  async function handlePortal() {
    setManagingPortal(true)
    setError(null)
    const res = await fetch("/api/billing/portal", { method: "POST" })
    const data = await res.json() as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong.")
      setManagingPortal(false)
      return
    }
    router.push(data.url)
  }

  const upgradablePlans = plans.filter(
    (p) => p.monthly_price_gbp > 0 && p.code !== currentPlanCode
  )

  return (
    <div className="space-y-8">
      {/* Current plan */}
      <div className="bg-navy-light border border-white/[0.05] rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current plan</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white text-xl font-bold capitalize">
              {currentPlanCode ?? "Free"}
            </p>
            {subStatus && (
              <p className="text-gray-400 text-sm mt-0.5">
                Status:{" "}
                <span className={subStatus === "active" || subStatus === "trialing" ? "text-emerald-400" : "text-amber-400"}>
                  {subStatus}
                </span>
                {periodEnd && (
                  <span className="text-gray-500">
                    {" · Renews "}
                    {new Date(periodEnd).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                )}
              </p>
            )}
            {!hasActiveSub && (
              <p className="text-gray-500 text-sm mt-0.5">3 lifetime unlocks · No exports</p>
            )}
          </div>
          {hasActiveSub && (
            <button
              onClick={handlePortal}
              disabled={managingPortal}
              className="shrink-0 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:border-gray-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {managingPortal ? "Loading…" : "Manage subscription"}
            </button>
          )}
        </div>
      </div>

      {/* Billing interval toggle */}
      {upgradablePlans.length > 0 && (
        <>
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">
              {hasActiveSub ? "Change plan" : "Upgrade"}
            </h2>

            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center bg-white/[0.05] border border-white/[0.06] rounded-xl p-1 gap-1">
                <button
                  onClick={() => setInterval("monthly")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    interval === "monthly"
                      ? "bg-white/[0.12] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setInterval("yearly")}
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
            <div className="grid sm:grid-cols-2 gap-4">
              {upgradablePlans.map((plan) => {
                const code = plan.code as PlanCode
                const display = PLAN_DISPLAY[code]
                const isPro = code === "pro"
                const pricing = display
                  ? interval === "yearly" ? display.yearly : display.monthly
                  : null
                const isLoading = loadingPlan === plan.code

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-xl p-5 border ${
                      isPro
                        ? "border-gold/40 bg-gold/[0.04]"
                        : "border-white/[0.08] bg-white/[0.03]"
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-px left-5">
                        <span className="inline-block bg-gold text-[#080c17] text-[10px] font-bold px-2.5 py-[3px] rounded-b-lg tracking-wide">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className={isPro ? "mt-4 mb-3" : "mb-3"}>
                      <p className={`font-bold text-sm mb-1 ${isPro ? "text-gold" : "text-gray-300"}`}>
                        {plan.name}
                      </p>
                      {pricing ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-bold tracking-tight ${isPro ? "text-gold" : "text-white"}`}>
                              {pricing.price}
                            </span>
                            <span className="text-gray-500 text-xs">{pricing.sub}</span>
                          </div>
                          {interval === "yearly" && display && (
                            <p className="text-emerald-400 text-xs mt-0.5 font-medium">{display.yearly.saving}</p>
                          )}
                        </>
                      ) : (
                        <p className={`text-2xl font-bold ${isPro ? "text-gold" : "text-white"}`}>
                          £{interval === "yearly"
                            ? (plan.monthly_price_gbp * 10).toLocaleString()
                            : plan.monthly_price_gbp}
                          <span className="text-gray-500 text-xs font-normal ml-1">
                            {interval === "yearly" ? "per year" : "per month"}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    {display ? (
                      <ul className="space-y-1.5 mb-5 flex-1">
                        {display.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <svg
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isPro ? "text-gold" : "text-gray-400"}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-300">{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-1.5 mb-5 flex-1 text-sm text-gray-300">
                        <li>{plan.monthly_unlock_limit === -1 ? "Unlimited" : plan.monthly_unlock_limit} unlocks/month</li>
                        <li>{plan.monthly_export_limit} exports/month</li>
                      </ul>
                    )}

                    <button
                      onClick={() => handleCheckout(plan)}
                      disabled={loadingPlan !== null || managingPortal}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        isPro
                          ? "bg-gold text-[#080c17] hover:bg-yellow-400 active:scale-[0.98]"
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
          </div>

          <p className="text-center text-xs text-gray-600">
            Secure checkout · Cancel anytime · VAT may apply
          </p>
        </>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  )
}


  async function handleClick() {
    setLoading(true)
    setError(null)

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, billingPeriod: "monthly" }),
    })

    const data = await res.json() as { url?: string; error?: string }

    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong. Please try again.")
      setLoading(false)
      return
    }

    // Redirect to Stripe Checkout
    router.push(data.url)
  }

  return (
    <div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading
          ? "Redirecting…"
          : hasActiveSubscription
          ? `Switch to ${plan.name}`
          : `Upgrade to ${plan.name}`}
      </button>
    </div>
  )
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    setError(null)

    const res = await fetch("/api/billing/portal", { method: "POST" })
    const data = await res.json() as { url?: string; error?: string }

    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong. Please try again.")
      setLoading(false)
      return
    }

    router.push(data.url)
  }

  return (
    <div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:border-gray-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Loading…" : "Manage subscription"}
      </button>
    </div>
  )
}
