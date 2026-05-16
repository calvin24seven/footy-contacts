import Link from "next/link"
import type { Metadata } from "next"

const APP_URL = "https://app.footycontacts.com"

export const metadata: Metadata = {
  title: "Footy Contacts ΓÇö Search the Football Network",
  description:
    "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Search 12,400+ published football industry contacts. Start with 3 free unlocks.",
  openGraph: {
    title: "Footy Contacts ΓÇö Search the Football Network",
    description:
      "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Search 12,400+ published football industry contacts. Start with 3 free unlocks.",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Footy Contacts ΓÇö Search the Football Network",
    description:
      "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Start with 3 free unlocks.",
  },
}

// ΓöÇΓöÇ Data ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const MARQUEE_ITEMS = [
  "Scout ┬╖ England ┬╖ Premier League",
  "Agent ┬╖ Spain ┬╖ LaLiga",
  "Academy Director ┬╖ Germany",
  "Head of Recruitment ┬╖ France",
  "Goalkeeping Coach ┬╖ Championship",
  "Performance Director ┬╖ Belgium",
  "Press Officer ┬╖ Brazil",
  "Club Secretary ┬╖ Nigeria",
  "Technical Director ┬╖ Portugal",
  "Youth Coach ┬╖ Netherlands",
  "Sporting Director ┬╖ Italy",
  "Analyst ┬╖ Scotland",
]

const PREVIEW_CONTACTS = [
  {
    name: "James Morrison",
    role: "Head of Recruitment",
    org: "United FC",
    country: "England",
    initials: "JM",
    color: "from-blue-500 to-blue-700",
  },
  {
    name: "Carlos Ruiz",
    role: "Agent / Representative",
    org: "Elite Sports Group",
    country: "Spain",
    initials: "CR",
    color: "from-red-500 to-red-700",
  },
  {
    name: "Amara Diallo",
    role: "Academy Director",
    org: "FC Lom├⌐",
    country: "Togo",
    initials: "AD",
    color: "from-emerald-500 to-emerald-700",
  },
]

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Search the network",
    desc: "Filter by role, club, country, or level. Browse 12,400+ published contacts with names, organisations, and roles visible to everyone.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Unlock their details",
    desc: "Use a credit to reveal their direct email, phone number, and LinkedIn. Confirm before spending ΓÇö no wasted credits.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Make your move",
    desc: "No intermediary. No waiting on a reply from someone who may not forward it. You have the contact. You make the call.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

const FEATURES = [
  {
    title: "12,400+ published contacts",
    desc: "Scouts, agents, coaches, academy directors, club secretaries, press officers, and operators. Verified and searchable.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Granular filters",
    desc: "Filter by role, club, country, city, level, category, and whether email or phone is available. Find exactly who you need.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
  },
  {
    title: "Direct contact details",
    desc: "Email address, phone number, and LinkedIn URL. Unlocked in one click ΓÇö held behind a credit to prevent scraping.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "114 countries",
    desc: "Premier League. La Liga. Ligue 1. League One. African Championship. We don't stop at the top five leagues.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Saved lists",
    desc: "Organise your contacts into lists for campaigns, shortlists, and pipelines. Export to CSV for your CRM.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    title: "Opportunities feed",
    desc: "Posted trials, jobs, and openings from clubs and organisations. Browse by level, country, or role.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

const PERSONAS = [
  { role: "Players", desc: "Find the scouts, agents, and club contacts who can open the next door for your career." },
  { role: "Agents", desc: "Search club executives, heads of recruitment, and potential clients faster than any other method." },
  { role: "Scouts", desc: "Build a direct network of coaches, performance directors, and talent contacts at every level." },
  { role: "Coaches", desc: "Find clubs, technical directors, and academy roles ΓÇö without going through a CV black hole." },
  { role: "Academy staff", desc: "Connect with recruitment networks, talent pipelines, and decision-makers in youth football." },
  { role: "Journalists", desc: "Find press officers, media managers, and club contacts across the football world." },
  { role: "Recruiters", desc: "A searchable directory of football operators for your placements and representation pipeline." },
  { role: "Club operators", desc: "Find scouts, analysts, performance staff, and specialists ΓÇö without relying on referrals alone." },
]

const PRICING = [
  {
    name: "Free",
    price: "┬ú0",
    period: "",
    badge: null as string | null,
    desc: "Try it. 3 unlocks to see exactly what you get before spending a penny.",
    features: ["3 unlock credits", "Full contact browsing", "Search & filter all 12,400+", "No credit card"],
    cta: "Get access free",
    href: `${APP_URL}/signup`,
    featured: false,
  },
  {
    name: "Pro",
    price: "┬ú39",
    period: "/mo",
    badge: "Most popular" as string | null,
    desc: "For players, agents, scouts, and coaches who need the network on their side every month.",
    features: ["150 unlocks/month", "75 CSV exports/month", "Full filter access", "Annual: ┬ú390 (save ┬ú78)"],
    cta: "Start Pro",
    href: `${APP_URL}/signup?plan=pro`,
    featured: true,
  },
  {
    name: "Agency",
    price: "┬ú149",
    period: "/mo",
    badge: null as string | null,
    desc: "For professional agencies and operators who need the full network, every day.",
    features: ["Unlimited unlocks", "500 exports/month", "Priority support", "Annual: ┬ú1,490 (save ┬ú298)"],
    cta: "Go Agency",
    href: `${APP_URL}/signup?plan=agency`,
    featured: false,
  },
]

// ΓöÇΓöÇ Small icons ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function LockIcon() {
  return (
    <svg className="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="#F9D783" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ΓöÇΓöÇ Browser-frame product mockup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function ProductMockup() {
  return (
    <div
      aria-hidden="true"
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        background: "#0D111C",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.7), 0 0 120px rgba(249,215,131,0.05)",
      }}
    >
      {/* Browser chrome top bar */}
      <div
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: "#161E2E", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,96,96,0.55)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,189,68,0.55)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(40,200,100,0.55)" }} />
        </div>
        <div
          className="flex-1 rounded-md px-3 py-1.5 text-xs flex items-center gap-1.5"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.28)" }}
        >
          <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          app.footycontacts.com
        </div>
      </div>

      {/* App content */}
      <div className="p-4 space-y-3">
        {/* Search bar */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 border"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Search scouts, agents, coaches...
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Role Γû╛", active: false },
            { label: "Country: England ├ù", active: true },
            { label: "Category Γû╛", active: false },
          ].map(({ label, active }) => (
            <span
              key={label}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{
                background: active ? "rgba(249,215,131,0.12)" : "rgba(255,255,255,0.05)",
                color: active ? "#F9D783" : "rgba(255,255,255,0.45)",
                border: `1px solid ${active ? "rgba(249,215,131,0.22)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Result count */}
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
          847 contacts found in England
        </p>

        {/* Contact rows */}
        {PREVIEW_CONTACTS.map((c, i) => (
          <div
            key={c.name}
            className="rounded-xl p-3.5 border"
            style={{
              background: i === 0 ? "rgba(249,215,131,0.03)" : "rgba(255,255,255,0.025)",
              borderColor: i === 0 ? "rgba(249,215,131,0.12)" : "rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br ${c.color}`}
                >
                  {c.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold text-sm leading-tight">{c.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#4ade80" }} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{c.role}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {c.org} ┬╖ {c.country}
                  </p>
                </div>
              </div>

              {/* Unlock CTA */}
              <button
                className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "rgba(249,215,131,0.10)",
                  color: "#F9D783",
                  border: "1px solid rgba(249,215,131,0.20)",
                }}
              >
                Unlock ΓåÆ
              </button>
            </div>

            {/* Masked contact fields */}
            <div className="mt-2.5 flex gap-2 flex-wrap">
              {["ΓÇóΓÇó@ΓÇóΓÇó.com", "+ΓÇóΓÇó ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"].map((masked) => (
                <span
                  key={masked}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    color: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <LockIcon /> {masked}
                </span>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs pb-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
          3 free unlocks ┬╖ No credit card required
        </p>
      </div>
    </div>
  )
}

// ΓöÇΓöÇ Page component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function HomePage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#0D111C" }}>

      {/* ΓöÇΓöÇ Navbar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: "rgba(13,17,28,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <nav className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between" aria-label="Main navigation">
          {/* Wordmark */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="font-extrabold text-xl tracking-tight text-white">Footy</span>
            <span className="font-extrabold text-xl tracking-tight" style={{ color: "#F9D783" }}>Contacts</span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
              { href: "/blog", label: "Blog" },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`${APP_URL}/login`}
              className="hidden sm:block text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Sign in
            </Link>
            <Link
              href={`${APP_URL}/signup`}
              className="px-4 py-2.5 text-sm font-bold rounded-xl"
              style={{ background: "#F9D783", color: "#0D111C" }}
            >
              Get access ΓåÆ
            </Link>
          </div>
        </nav>
      </header>

      {/* ΓöÇΓöÇ Hero ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className="relative overflow-hidden" style={{ paddingTop: "88px", paddingBottom: "96px" }}>

        {/* Ambient glow ΓÇö top left gold */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-30%", left: "-15%",
            width: "80%", height: "90%",
            background: "radial-gradient(ellipse, rgba(249,215,131,0.10) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        {/* Ambient glow ΓÇö bottom right purple */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-10%", right: "-5%",
            width: "55%", height: "70%",
            background: "radial-gradient(ellipse, rgba(100,120,255,0.05) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 40%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 xl:gap-16 items-center">

            {/* Left: copy ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            <div className="max-w-[540px]">

              {/* Eyebrow */}
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold rounded-full px-4 py-2 mb-8 border"
                style={{
                  background: "rgba(249,215,131,0.07)",
                  borderColor: "rgba(249,215,131,0.18)",
                  color: "#F9D783",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#F9D783" }} />
                12,400+ verified contacts ┬╖ 114 countries
              </div>

              {/* Headline */}
              <h1
                className="font-extrabold leading-none tracking-tighter mb-6"
                style={{ fontSize: "clamp(52px, 7.5vw, 92px)" }}
              >
                Find anyone
                <br />
                in{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #F9D783 0%, #FFF5A0 45%, #E8C355 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  football.
                </span>
              </h1>

              {/* Subheading */}
              <p
                className="text-lg leading-relaxed mb-10"
                style={{ color: "rgba(255,255,255,0.52)", maxWidth: "460px" }}
              >
                Scouts, agents, coaches, academy directors, and club officials ΓÇö all in one
                searchable platform. Direct email, phone, and LinkedIn included.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mb-7">
                <Link
                  href={`${APP_URL}/signup`}
                  className="inline-flex items-center gap-2 px-7 py-4 text-base font-bold rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, #F9D783 0%, #E8C355 100%)",
                    color: "#0D111C",
                    boxShadow: "0 8px 36px rgba(249,215,131,0.28)",
                  }}
                >
                  Start free ΓÇö 3 unlocks included
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-4 text-base font-medium rounded-xl border"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  See how it works
                </a>
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.28)" }}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm">No credit card ┬╖ Cancel anytime ┬╖ GDPR compliant</span>
              </div>
            </div>

            {/* Right: product mockup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            <div className="relative">
              {/* Gold glow halo */}
              <div
                className="absolute pointer-events-none animate-float"
                style={{
                  inset: "-40px",
                  background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(249,215,131,0.14) 0%, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
              <div className="relative">
                <ProductMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇ Scrolling marquee strip ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div
        className="overflow-hidden border-y"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.018)",
          maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div className="animate-marquee flex gap-3 py-4 whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border shrink-0"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.42)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <span style={{ color: "#F9D783", opacity: 0.65, marginRight: "2px" }}>ΓåÆ</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ΓöÇΓöÇ Stats band ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-0 rounded-3xl overflow-hidden border"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {[
              { value: "12,400+", label: "Published contacts", sub: "Searchable right now" },
              { value: "114", label: "Countries covered", sub: "Global football network", divider: true },
              { value: "3 free", label: "Unlocks to start", sub: "No credit card needed", divider: true },
            ].map(({ value, label, sub, divider }) => (
              <div
                key={label}
                className="text-center px-8 py-12 relative"
              >
                {divider && (
                  <div
                    className="absolute left-0 top-1/4 bottom-1/4 w-px hidden sm:block"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
                )}
                <p
                  className="font-extrabold tracking-tighter leading-none mb-3"
                  style={{
                    fontSize: "clamp(44px, 5.5vw, 76px)",
                    background: "linear-gradient(160deg, #ffffff 30%, rgba(249,215,131,0.8) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {value}
                </p>
                <p className="font-semibold text-base text-white mb-1">{label}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.32)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇ How it works ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section id="how-it-works" className="py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F9D783" }}>
              How it works
            </p>
            <h2
              className="font-extrabold tracking-tighter text-white mb-4"
              style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
            >
              From search to outreach in minutes.
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.42)" }}>
              No directories. No agency fees. No referral chains. Direct access to the people that matter.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.n}
                className="relative rounded-2xl p-8 border"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                {/* Step number watermark */}
                <div
                  className="absolute top-5 right-6 font-extrabold tracking-tighter select-none"
                  style={{ fontSize: "64px", color: "rgba(255,255,255,0.04)", lineHeight: 1 }}
                >
                  {step.n}
                </div>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border"
                  style={{
                    background: "rgba(249,215,131,0.08)",
                    borderColor: "rgba(249,215,131,0.15)",
                    color: "#F9D783",
                  }}
                >
                  {step.icon}
                </div>

                <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {step.desc}
                </p>

                {/* Arrow connector */}
                {i < 2 && (
                  <div
                    className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-full z-10"
                    style={{
                      background: "#0D111C",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href={`${APP_URL}/signup`}
              className="inline-flex items-center gap-2 px-7 py-4 text-sm font-bold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #F9D783 0%, #E8C355 100%)",
                color: "#0D111C",
                boxShadow: "0 8px 24px rgba(249,215,131,0.20)",
              }}
            >
              Try it free ΓÇö no card needed
            </Link>
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇ Features ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F9D783" }}>
              What&apos;s included
            </p>
            <h2
              className="font-extrabold tracking-tighter text-white"
              style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
            >
              Everything you need to build your network.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 border"
                style={{
                  background: i === 0 ? "rgba(249,215,131,0.04)" : "rgba(255,255,255,0.025)",
                  borderColor: i === 0 ? "rgba(249,215,131,0.14)" : "rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: "rgba(249,215,131,0.08)",
                    borderColor: "rgba(249,215,131,0.15)",
                    color: "#F9D783",
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇ Who it&apos;s for ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className="py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F9D783" }}>
              Who uses Footy Contacts
            </p>
            <h2
              className="font-extrabold tracking-tighter text-white"
              style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
            >
              Built for everyone in the game.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PERSONAS.map((p) => (
              <div
                key={p.role}
                className="rounded-2xl p-5 border"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <h3 className="text-white font-bold text-sm mb-2">{p.role}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇ Manifesto callout ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className="py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(249,215,131,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(255,255,255,0.28)" }}>
            Why we built this
          </p>
          <blockquote
            className="font-bold tracking-tighter leading-tight text-white mb-6"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            &ldquo;Football is a closed network.
            <br />
            Footy Contacts opens the door.&rdquo;
          </blockquote>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "rgba(255,255,255,0.42)", maxWidth: "540px", margin: "0 auto 2.5rem" }}
          >
            Opportunities pass people by every single day ΓÇö not for lack of talent or hard work, but
            for lack of access. We built a searchable, direct-contact database so that changes.
          </p>
          <Link
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-xl"
            style={{
              background: "linear-gradient(135deg, #F9D783 0%, #E8C355 100%)",
              color: "#0D111C",
              boxShadow: "0 8px 32px rgba(249,215,131,0.24)",
            }}
          >
            Get access ΓÇö it&apos;s free
          </Link>
        </div>
      </section>

      {/* ΓöÇΓöÇ Pricing ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section id="pricing" className="py-24" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F9D783" }}>
              Pricing
            </p>
            <h2
              className="font-extrabold tracking-tighter text-white mb-3"
              style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
            >
              Start free. Scale when you&apos;re ready.
            </h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.38)" }}>
              3 unlocks included on the free plan. No credit card required.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
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
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span
                    className="font-extrabold tracking-tighter"
                    style={{ fontSize: "52px", lineHeight: 1, color: plan.featured ? "#F9D783" : "#fff" }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.32)" }}>
                    {plan.period}
                  </span>
                </div>
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

                <Link
                  href={plan.href}
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
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm mt-8" style={{ color: "rgba(255,255,255,0.22)" }}>
            Start free ΓÇö no credit card required. Upgrade or cancel anytime.
          </p>
        </div>
      </section>

      {/* ΓöÇΓöÇ Final CTA ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className="py-32 relative overflow-hidden">
        {/* Dramatic background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 140% 80% at 50% 0%, rgba(249,215,131,0.09) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 80% 100%, rgba(100,130,255,0.04) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2
            className="font-extrabold tracking-tighter text-white mb-5"
            style={{ fontSize: "clamp(40px, 6.5vw, 80px)" }}
          >
            Give yourself a
            <br />
            better shot.
          </h2>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "rgba(255,255,255,0.45)", maxWidth: "400px", margin: "0 auto 2.5rem" }}
          >
            3 unlocks on us. No card. No commitment. Just direct access to the football network.
          </p>
          <Link
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-3 px-10 py-5 text-lg font-bold rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #F9D783 0%, #E8C355 100%)",
              color: "#0D111C",
              boxShadow: "0 12px 52px rgba(249,215,131,0.30)",
            }}
          >
            Get access ΓÇö it&apos;s free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-sm mt-5" style={{ color: "rgba(255,255,255,0.22)" }}>
            No credit card required ┬╖ Cancel anytime ┬╖ Join the professionals already using Footy Contacts
          </p>
        </div>
      </section>

      {/* ΓöÇΓöÇ Footer ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <footer className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center mb-4">
                <span className="font-extrabold text-lg text-white">Footy</span>
                <span className="font-extrabold text-lg" style={{ color: "#F9D783" }}>Contacts</span>
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>
                The football network, searchable. Find scouts, agents, coaches, and club staff across 114 countries.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Blog", href: "/blog" },
                  { label: "Sign in", href: `${APP_URL}/login` },
                  { label: "Get access", href: `${APP_URL}/signup` },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Get started</h4>
              <Link
                href={`${APP_URL}/signup`}
                className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-bold rounded-xl border"
                style={{
                  background: "rgba(249,215,131,0.08)",
                  borderColor: "rgba(249,215,131,0.18)",
                  color: "#F9D783",
                }}
              >
                Get access free ΓåÆ
              </Link>
              <p className="text-xs mt-3 text-center" style={{ color: "rgba(255,255,255,0.22)" }}>
                3 unlocks ┬╖ No credit card
              </p>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t text-xs"
            style={{ borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.22)" }}
          >
            <p>┬⌐ 2026 Footy Contacts Ltd. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
