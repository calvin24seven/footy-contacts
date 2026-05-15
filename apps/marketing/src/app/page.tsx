import Link from "next/link"
import type { Metadata } from "next"

const APP_URL = "https://app.footycontacts.com"

// â”€â”€ SEO metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const metadata: Metadata = {
  title: "Footy Contacts â€” Search the Football Network",
  description:
    "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Search 12,400+ published football industry contacts. Start with 3 free unlocks.",
  openGraph: {
    title: "Footy Contacts â€” Search the Football Network",
    description:
      "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Search 12,400+ published football industry contacts. Start with 3 free unlocks.",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Footy Contacts â€” Search the Football Network",
    description:
      "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Start with 3 free unlocks.",
  },
}

// â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATS = [
  { value: "55,016", label: "Contacts in database" },
  { value: "12,400+", label: "Published & searchable" },
  { value: "42,614", label: "Email fields" },
  { value: "47,154", label: "Phone fields" },
  { value: "54,996", label: "LinkedIn profiles" },
  { value: "114", label: "Countries covered" },
]

const SEARCH_EXAMPLES = [
  "Scout Â· England Â· Premier League",
  "Agent Â· Spain Â· Professional",
  "Academy Director Â· League One",
  "Head of Recruitment Â· France",
  "Journalist Â· Nigeria",
  "Goalkeeping Coach Â· Championship",
]

const FEATURES = [
  {
    title: "Contacts",
    desc: "Scouts, agents, coaches, academy and club staff, media, recruiters, and football operators. Email, phone, and LinkedIn.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Direct search",
    desc: "Filter by role, club, country, level, and more. Find exactly the right person without guessing.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Instant access",
    desc: "Unlock a contact's direct details in one click. No intermediary. No waiting.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Opportunities",
    desc: "Posted trials, jobs, and openings across the football world. Browse and apply directly.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Saved lists",
    desc: "Build and manage lists of contacts for your outreach campaigns.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    title: "Exports",
    desc: "Download contact lists to CSV for professional outreach and CRM workflows.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
]

const PERSONAS = [
  { role: "Players", desc: "Find scouts, agents, trials, and the clubs looking for your profile." },
  { role: "Agents", desc: "Search club contacts, recruitment leads, and potential clients." },
  { role: "Scouts", desc: "Discover performance staff, coaches, and talent network leads." },
  { role: "Coaches", desc: "Find clubs, decision-makers, and job opportunities at every level." },
  { role: "Academy staff", desc: "Build recruitment networks and access youth development contacts." },
  { role: "Media", desc: "Find contacts across every level of the game." },
  { role: "Recruiters", desc: "Access a searchable directory of football operators for your placements." },
  { role: "Club operators", desc: "Find the professionals you need â€” faster than relying on referrals alone." },
]

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search the network",
    desc: "Filter by role, club, country, or level. See names, roles, and organisations across 12,400+ published contacts.",
  },
  {
    step: "2",
    title: "Unlock contact details",
    desc: "Use a credit to reveal direct email, phone, and LinkedIn. Your credit is only used if you confirm.",
  },
  {
    step: "3",
    title: "Reach out directly",
    desc: "No middleman. You have their details. Make the call, send the email, start the conversation.",
  },
]

const PRICING = [
  {
    name: "Free",
    price: "Â£0",
    period: "",
    desc: "Start here. 3 unlocks to find out if this is useful for you.",
    features: ["3 unlocks", "Browse all contacts", "No credit card"],
    cta: "Get access",
    href: `${APP_URL}/signup`,
    featured: false,
  },
  {
    name: "Pro",
    price: "Â£39",
    period: "/mo",
    desc: "For serious players, agents, coaches, and scouts who need regular access.",
    features: ["150 unlocks/month", "75 exports/month", "Annual: Â£390"],
    cta: "Start Pro",
    href: `${APP_URL}/signup?plan=pro`,
    featured: true,
  },
  {
    name: "Agency",
    price: "Â£149",
    period: "/mo",
    desc: "For professional operators who need the full network.",
    features: ["Unlimited unlocks", "500 exports/month", "Annual: Â£1,490"],
    cta: "Go Agency",
    href: `${APP_URL}/signup?plan=agency`,
    featured: false,
  },
]

// â”€â”€ Helper components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LockIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

// â”€â”€ HeroPreview (Â§14) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Decorative product preview card. Purely visual â€” aria-hidden, not interactive.
// Shows three fake locked contact rows with the gold "Unlock â†’" affordance.

const PREVIEW_CONTACTS = [
  { name: "James Morrison", role: "Head of Recruitment", org: "United FC", country: "England" },
  { name: "Carlos Ruiz", role: "Agent / Representative", org: "Elite Sports Group", country: "Spain" },
  { name: "Amara Diallo", role: "Academy Director", org: "FC LomÃ©", country: "Togo" },
]

function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="bg-navy-light border border-white/[0.06] rounded-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.60)] select-none"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
          Search results
        </span>
        <span className="text-gray-600 text-xs">12,400+ contacts</span>
      </div>

      <div className="space-y-2.5">
        {PREVIEW_CONTACTS.map((c) => (
          <div
            key={c.name}
            className="bg-navy rounded-xl p-3.5 border border-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-semibold truncate">{c.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                </div>
                <p className="text-gray-400 text-xs">{c.role}</p>
                <p className="text-gray-500 text-xs">{c.org} Â· {c.country}</p>
              </div>
              <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-gold/10 border border-gold/20 rounded-lg text-gold text-xs font-medium">
                Unlock â†’
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-navy-dark rounded-md border border-white/[0.04] text-gray-600 text-xs">
                <LockIcon /> â€¢â€¢â€¢â€¢@â€¢â€¢â€¢â€¢.com
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-navy-dark rounded-md border border-white/[0.04] text-gray-600 text-xs">
                <LockIcon /> +â€¢â€¢ â€¢â€¢â€¢ â€¢â€¢â€¢â€¢
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-gray-600 text-xs">
        3 free unlocks Â· No credit card required
      </p>
    </div>
  )
}

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function HomePage() {
  return (
    <div className="bg-navy-dark text-white min-h-screen">

      {/* â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-30 bg-navy-dark/95 backdrop-blur-sm border-b border-navy-light/30">
        <nav
          className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between"
          aria-label="Main navigation"
        >
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-white font-bold text-lg tracking-tight">Footy</span>
            <span className="text-gold font-bold text-lg tracking-tight">Contacts</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</a>
            <Link href="/blog" className="text-sm text-gray-300 hover:text-white transition-colors">Blog</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`${APP_URL}/login`}
              className="hidden sm:block text-sm text-gray-300 hover:text-white transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href={`${APP_URL}/signup`}
              className="px-4 py-2.5 bg-gold text-navy-dark text-sm font-bold rounded-xl hover:bg-gold-dark transition-colors"
            >
              Get access â†’
            </Link>
          </div>
        </nav>
      </header>

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative overflow-hidden">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Gold ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,215,131,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6 tracking-tight">
                Football runs on{" "}
                <span className="text-gold">contacts</span>.{" "}
                <br className="hidden sm:block" />
                Now you can find them.
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-xl">
                Search 12,400+ published football industry contacts â€” scouts, agents,
                coaches, academy staff, club officials, and more â€” across 114 countries.
                Start with 3 free unlocks. No credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link
                  href={`${APP_URL}/signup`}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors text-base"
                >
                  Get access â€” it&apos;s free
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-4 text-gray-400 hover:text-white transition-colors text-base"
                >
                  See how it works â†“
                </a>
              </div>
              <p className="text-gray-500 text-sm">
                No credit card required Â· 3 unlocks included Â· Cancel anytime
              </p>
            </div>

            {/* Right: product preview */}
            <div>
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ Data proof strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="border-t border-b border-navy-light/50 bg-navy-light/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-gold font-bold text-2xl leading-none">{s.value}</p>
                <p className="text-gray-400 text-xs mt-1.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Search examples â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl lg:text-4xl font-bold text-center mb-4">
            See who you can find
          </h2>
          <p className="text-gray-400 text-base text-center mb-10 max-w-xl mx-auto leading-relaxed">
            Search by role, club, country, or level. Click any example to get started.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 mb-12">
            {SEARCH_EXAMPLES.map((q) => (
              <Link
                key={q}
                href={`${APP_URL}/signup?q=${encodeURIComponent(q)}`}
                className="px-4 py-2 bg-navy-light border border-navy-light/80 text-gray-300 hover:border-gold hover:text-gold rounded-full text-sm transition-colors"
              >
                {q}
              </Link>
            ))}
          </div>

          {/* Teaser contact card */}
          <div className="max-w-md mx-auto bg-navy-light/50 border border-navy-light/60 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-light/60 flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">
                Example result â€” details locked
              </span>
              <Link
                href={`${APP_URL}/signup`}
                className="text-gold text-xs hover:text-gold-dark transition-colors font-medium"
              >
                Sign up to unlock â†’
              </Link>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white text-sm font-semibold">David Okafor</p>
                  <p className="text-gray-400 text-xs mt-0.5">Head of Recruitment</p>
                  <p className="text-gray-500 text-xs">Academy FC Â· England</p>
                </div>
                <Link
                  href={`${APP_URL}/signup`}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-lg text-gold text-xs font-medium hover:bg-gold/20 transition-colors"
                >
                  Unlock â†’
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["â€¢â€¢â€¢â€¢@â€¢â€¢â€¢â€¢.co.uk", "+44 â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢", "linkedin.com/in/â€¢â€¢â€¢â€¢"].map(
                  (masked) => (
                    <span
                      key={masked}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-navy rounded-md border border-white/[0.04] text-gray-600 text-xs"
                    >
                      <LockIcon /> {masked}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ Feature grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-24 bg-navy/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl lg:text-4xl font-bold text-center mb-4">
            One platform. Every connection you need.
          </h2>
          <p className="text-gray-400 text-base text-center mb-12 max-w-xl mx-auto leading-relaxed">
            Everything built around one goal â€” helping you find and reach the right people in football.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-navy-light border border-white/[0.06] rounded-2xl p-6"
              >
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-4">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Persona grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl lg:text-4xl font-bold text-center mb-4">
            Built for everyone in football
          </h2>
          <p className="text-gray-400 text-base text-center mb-12 max-w-xl mx-auto leading-relaxed">
            Whether you&apos;re breaking in or operating at the top, the network is here.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PERSONAS.map((p) => (
              <div
                key={p.role}
                className="bg-navy-light/50 border border-navy-light/60 rounded-xl p-5 hover:border-gold/30 transition-colors"
              >
                <h3 className="text-white text-sm font-semibold mb-2">{p.role}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Emotional section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-24 bg-navy/40">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-white text-3xl lg:text-4xl font-bold mb-10">
            Football is a closed network. Until now.
          </h2>
          <blockquote className="border-l-2 border-gold/50 text-left pl-6 space-y-5 mx-auto max-w-2xl">
            <p className="text-gray-300 text-lg leading-relaxed">
              Football runs on relationships. The right call at the right time. Knowing
              someone who knows someone. If you&apos;ve ever felt like opportunities were
              passing you by â€” not because of ability, but because of access â€” you&apos;re
              not wrong.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              Footy Contacts doesn&apos;t guarantee anything. No tool can. But it removes
              the biggest barrier: not knowing who to contact or how to reach them. We give
              you the network. You make the move.
            </p>
          </blockquote>
          <div className="mt-10">
            <Link
              href={`${APP_URL}/signup`}
              className="inline-flex items-center justify-center px-8 py-4 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors"
            >
              Get access â€” it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ How it works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl lg:text-4xl font-bold text-center mb-4">
            Three steps to your next connection
          </h2>
          <p className="text-gray-400 text-base text-center mb-16 max-w-xl mx-auto">
            From search to outreach in minutes.
          </p>
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}>
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-5">
                  <span className="text-gold font-bold text-sm">{step.step}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Pricing teaser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="pricing" className="py-24 bg-navy/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl lg:text-4xl font-bold text-center mb-4">
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="text-gray-400 text-base text-center mb-12 max-w-xl mx-auto">
            Try with 3 free unlocks. No credit card. No commitment.
          </p>
          <div className="grid lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.featured
                    ? "bg-gold/[0.06] border-2 border-gold/40 shadow-[0_0_32px_rgba(249,215,131,0.08)]"
                    : "bg-navy-light border border-white/[0.06]"
                }`}
              >
                {plan.featured && (
                  <span className="inline-flex self-start mb-3 px-2.5 py-1 bg-gold/15 text-gold text-xs font-semibold rounded-full border border-gold/25">
                    Most popular
                  </span>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span className="text-white text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{plan.desc}</p>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckIcon /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full inline-flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-colors ${
                    plan.featured
                      ? "bg-gold text-navy-dark hover:bg-gold-dark"
                      : "bg-navy border border-navy-light text-white hover:bg-navy-light"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Start free â€” no credit card required. Upgrade or cancel anytime.
          </p>
        </div>
      </section>

      {/* â”€â”€ Final CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-24">
        <div
          className="max-w-4xl mx-auto px-6 text-center"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 50%, rgba(249,215,131,0.05) 0%, transparent 70%)",
          }}
        >
          <h2 className="text-white text-4xl lg:text-5xl font-bold mb-5 tracking-tight">
            Give yourself a better shot.
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Start with 3 free unlocks. No credit card. No commitment. Just access.
          </p>
          <Link
            href={`${APP_URL}/signup`}
            className="inline-flex items-center justify-center px-10 py-5 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors text-lg"
          >
            Get access â€” it&apos;s free â†’
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Join the football professionals already using Footy Contacts.
          </p>
        </div>
      </section>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer className="border-t border-navy-light/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
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
                    <a
                      href={l.href}
                      className="text-gray-400 text-sm hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Cookie Policy", href: "/cookies" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-gray-400 text-sm hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Contact</h4>
              <a
                href="mailto:hello@footycontacts.com"
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                hello@footycontacts.com
              </a>
            </div>
          </div>
          <div className="border-t border-navy-light/50 pt-6 flex items-center justify-between">
            <p className="text-gray-600 text-sm">Â© 2026 Footy Contacts. All rights reserved.</p>
            <div className="flex items-center">
              <span className="text-white font-bold text-sm">Footy</span>
              <span className="text-gold font-bold text-sm">Contacts</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// â”€â”€â”€ Replaced old page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// The above replaces the previous scaffolded homepage.
// Old export default function was removed in favour of this full rebuild.

// (EOF)
