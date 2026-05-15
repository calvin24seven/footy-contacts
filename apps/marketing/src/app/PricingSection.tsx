"use client"

import { useState } from "react"

const APP_URL = "https://app.footycontacts.com"

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="#F9D783" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

const PLANS = [
  {
    name: "Free",
    monthly: { price: "£0", period: "", note: null, href: `${APP_URL}/signup` },
    annual:  { price: "£0", period: "", note: null, href: `${APP_URL}/signup` },
    badge: null as string | null,
    desc: "Try it. 3 unlocks to see exactly what you get before spending a penny.",
    features: ["3 unlock credits", "Full contact browsing", "Search & filter all published contacts", "No credit card"],
    cta: "Get access free",
    featured: false,
  },
  {
    name: "Pro",
    monthly: { price: "£39",  period: "/mo", note: null,                          href: `${APP_URL}/signup?plan=pro` },
    annual:  { price: "£32",  period: "/mo", note: "£390 billed annually · save £78",  href: `${APP_URL}/signup?plan=pro&billing=annual` },
    badge: "Most popular" as string | null,
    desc: "For players, agents, scouts, and coaches who need the network on their side every month.",
    features: ["150 unlocks/month", "75 CSV exports/month", "Full filter access"],
    cta: "Start Pro",
    featured: true,
  },
  {
    name: "Agency",
    monthly: { price: "£149", period: "/mo", note: null,                          href: `${APP_URL}/signup?plan=agency` },
    annual:  { price: "£124", period: "/mo", note: "£1,490 billed annually · save £298", href: `${APP_URL}/signup?plan=agency&billing=annual` },
    badge: null as string | null,
    desc: "For professional agencies and operators who need the full network, every day.",
    features: ["Unlimited unlocks", "500 exports/month", "Priority support"],
    cta: "Go Agency",
    featured: false,
  },
]

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F9D783" }}>
            Pricing
          </p>
          <h2
            className="font-extrabold tracking-tighter text-white mb-3"
            style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
          >
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.38)" }}>
            3 unlocks included on the free plan. No credit card required.
          </p>

          {/* Monthly / Annual toggle */}
          <div
            className="inline-flex items-center rounded-xl p-1 border"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setIsAnnual(false)}
              className="px-5 py-2 text-sm font-semibold rounded-lg transition-all"
              style={
                !isAnnual
                  ? { background: "rgba(255,255,255,0.10)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.42)" }
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all"
              style={
                isAnnual
                  ? { background: "rgba(255,255,255,0.10)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.42)" }
              }
            >
              Annual
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(249,215,131,0.15)", color: "#F9D783" }}
              >
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const billing = isAnnual ? plan.annual : plan.monthly
            return (
              <div
                key={plan.name}
                className="relative rounded-2xl p-7 flex flex-col border"
                style={
                  plan.featured
                    ? {
                        background: "rgba(249,215,131,0.04)",
                        borderColor: "rgba(249,215,131,0.28)",
                        boxShadow: "0 0 0 1px rgba(249,215,131,0.10), 0 24px 60px rgba(249,215,131,0.07)",
                      }
                    : {
                        background: "rgba(255,255,255,0.025)",
                        borderColor: "rgba(255,255,255,0.07)",
                      }
                }
              >
                {plan.badge && (
                  <span
                    className="inline-flex self-start mb-4 text-xs font-bold px-3 py-1 rounded-full border"
                    style={{
                      background: "rgba(249,215,131,0.12)",
                      borderColor: "rgba(249,215,131,0.22)",
                      color: "#F9D783",
                    }}
                  >
                    {plan.badge}
                  </span>
                )}

                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>

                <div className="flex items-baseline gap-0.5 mb-1">
                  <span
                    className="font-extrabold tracking-tighter"
                    style={{ fontSize: "52px", lineHeight: 1, color: plan.featured ? "#F9D783" : "#fff" }}
                  >
                    {billing.price}
                  </span>
                  <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.32)" }}>
                    {billing.period}
                  </span>
                </div>

                {billing.note ? (
                  <p className="text-xs mb-4" style={{ color: "rgba(249,215,131,0.65)" }}>
                    {billing.note}
                  </p>
                ) : (
                  <div className="mb-4" style={{ minHeight: "1.25rem" }} />
                )}

                <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {plan.desc}
                </p>

                <ul className="space-y-3 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <CheckIcon /> {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={billing.href}
                  className="w-full inline-flex items-center justify-center py-3.5 rounded-xl text-sm font-bold"
                  style={
                    plan.featured
                      ? {
                          background: "linear-gradient(135deg, #F9D783 0%, #E8C355 100%)",
                          color: "#0D111C",
                          boxShadow: "0 6px 20px rgba(249,215,131,0.22)",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.75)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }
                  }
                >
                  {plan.cta}
                </a>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: "rgba(255,255,255,0.22)" }}>
          Start free — no credit card required. Upgrade or cancel anytime.
        </p>
      </div>
    </section>
  )
}
