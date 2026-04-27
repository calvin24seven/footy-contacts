"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Tables } from "@/database.types"

type PlanRow = Tables<"plans">

interface Props {
  plan: PlanRow
  hasActiveSubscription: boolean
  isCurrentPlan: boolean
}

export function UpgradeButton({ plan, hasActiveSubscription, isCurrentPlan }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (isCurrentPlan) return null
  if (plan.monthly_price_gbp === 0) return null

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
        className="w-full py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
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
        className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:border-gray-400 hover:text-white transition-colors disabled:opacity-50"
      >
        {loading ? "Loading…" : "Manage subscription"}
      </button>
    </div>
  )
}
