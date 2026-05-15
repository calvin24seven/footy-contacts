"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * /upgrade — Entry point from Email 5 reactivation CTA.
 * Pre-applies COMEBACK50 coupon and redirects to Stripe checkout.
 * Falls back to /app/billing if the user is not authenticated or checkout fails.
 */
export default function UpgradePage() {
  const router = useRouter()

  useEffect(() => {
    async function start() {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planCode: "pro", billingPeriod: "monthly", coupon: "COMEBACK50" }),
        })

        if (!res.ok) {
          router.replace("/app/billing")
          return
        }

        const { url } = await res.json() as { url?: string }
        if (url) {
          window.location.href = url
        } else {
          router.replace("/app/billing")
        }
      } catch {
        router.replace("/app/billing")
      }
    }

    start()
  }, [router])

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Preparing your upgrade…</p>
    </div>
  )
}
