import type { ReactNode } from "react"
import Link from "next/link"

interface AuthSplitLayoutProps {
  children: ReactNode
  variant: "signup" | "signin" | "reset" | "update-password"
}

const COPY = {
  signup: {
    headline: "Create your access",
    sub: "Join football professionals using Footy Contacts to find the contacts that move careers forward.",
    bullets: [
      "3 free unlocks included",
      "No credit card required",
      "Cancel anytime",
      "Email + password — no app install needed",
    ],
  },
  signin: {
    headline: "Welcome back",
    sub: "The football network is waiting.",
    bullets: [
      "Search 12,400+ published contacts",
      "Scouts, agents, coaches, club staff",
      "114 countries covered",
      "Direct email, phone, and LinkedIn",
    ],
  },
  reset: {
    headline: "Reset your password",
    sub: "Enter your email and we'll send a reset link.",
    bullets: [
      "Link valid for 24 hours",
      "No account changes until you confirm",
      "Back to sign in after reset",
      "Email + password login only",
    ],
  },
  "update-password": {
    headline: "Set a new password",
    sub: "Choose something strong. You'll use this every time you sign in.",
    bullets: [
      "At least 8 characters",
      "Include a number or symbol",
      "We'll sign you in automatically",
      "Contact details stay safe",
    ],
  },
}

export default function AuthSplitLayout({ children, variant }: AuthSplitLayoutProps) {
  const copy = COPY[variant]

  return (
    <div className="min-h-screen bg-navy-dark flex">
      {/* ── Left panel (desktop only) ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col bg-navy border-r border-navy-light/50 p-10 xl:p-12">
        {/* Logo */}
        <Link href="/" className="mb-12 inline-flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="Footy Contacts" className="h-8 w-auto" />
        </Link>

        {/* Headline */}
        <div className="flex-1">
          <h1 className="text-white text-3xl font-bold leading-tight mb-4">
            {copy.headline}
          </h1>
          <p className="text-gray-300 text-base leading-relaxed mb-10">
            {copy.sub}
          </p>

          {/* Bullets */}
          <ul className="space-y-3.5">
            {copy.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="text-gold text-base leading-none shrink-0">✦</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="border-l-2 border-gold/40 pl-4 mt-10">
          <p className="text-gray-400 text-sm italic leading-relaxed">
            &ldquo;Football runs on contacts. Now you can find them.&rdquo;
          </p>
          <p className="text-gray-600 text-xs mt-1.5">Footy Contacts</p>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 lg:py-0">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <img src="/logo.png" alt="Footy Contacts" className="h-9 w-auto mx-auto" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
