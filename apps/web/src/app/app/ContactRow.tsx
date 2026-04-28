"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import SaveToListButton from "@/components/SaveToListButton"

export type ContactListRow = {
  id: string
  name: string
  role: string | null
  organisation: string | null
  category: string | null
  country: string | null
  city: string | null
  verified_status: string | null
  has_email: boolean
  has_phone: boolean
  has_linkedin: boolean
  role_category: string | null
}

// ── Org / category avatar ─────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Agent:  "bg-purple-900/60 text-purple-300",
  Scout:  "bg-blue-900/60 text-blue-300",
  Coach:  "bg-teal-900/60 text-teal-300",
  Club:   "bg-gold/15 text-gold",
  Media:  "bg-pink-900/60 text-pink-300",
  Other:  "bg-gray-700 text-gray-300",
}

function OrgAvatar({ name, category }: { name: string | null; category: string | null }) {
  const initials = name
    ? name
        .split(/[\s\-&]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?"

  const colorClass = CATEGORY_COLORS[category ?? ""] ?? "bg-navy text-gray-400 border border-gray-700"

  return (
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none ${colorClass}`}>
      {initials.slice(0, 2)}
    </div>
  )
}

// ── Signal pills ──────────────────────────────────────────────────────────────
function SignalPill({ type }: { type: "email" | "phone" | "linkedin" }) {
  if (type === "email") return (
    <span title="Email available" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none text-emerald-400 bg-emerald-500/10">
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span className="hidden sm:inline">Email</span>
    </span>
  )
  if (type === "phone") return (
    <span title="Phone available" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none text-sky-400 bg-sky-500/10">
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span className="hidden sm:inline">Phone</span>
    </span>
  )
  return (
    <span title="LinkedIn available" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none text-blue-400 bg-blue-500/10">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
      <span className="hidden sm:inline">LinkedIn</span>
    </span>
  )
}

// ── Verified badge ────────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <span title="Email verified" className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded leading-none">
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
  )
}

// ── Terms modal ───────────────────────────────────────────────────────────────
function TermsModal({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-navy border border-navy-light rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-1">Before you access this contact</h3>
        <p className="text-gray-400 text-sm mb-4">By accessing contact details you agree to our fair-use policy:</p>
        <ul className="space-y-2 mb-5">
          {[
            "Do not send unsolicited bulk email (spam).",
            "Do not sell or share contact details with third parties.",
            "Use contact details only for legitimate professional outreach.",
            "Respect opt-out requests immediately.",
          ].map((term) => (
            <li key={term} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-gold mt-0.5 shrink-0">✓</span>
              {term}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 bg-gold text-navy rounded-lg font-semibold text-sm hover:bg-gold-dark transition-colors"
          >
            I agree — unlock
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CTA (unlock / view / upgrade) ────────────────────────────────────────────
function ContactCTA({
  contactId, verifiedStatus, hasEmail, hasPhone,
}: {
  contactId: string; verifiedStatus: string | null; hasEmail: boolean; hasPhone: boolean
}) {
  const [state, setState] = useState<"idle" | "terms" | "loading" | "paywall" | "limit" | "error">("idle")
  const router = useRouter()

  async function doUnlock() {
    setState("loading")
    const res = await fetch(`/api/contacts/${contactId}/unlock`, { method: "POST" })
    const data = await res.json() as {
      success?: boolean; already_unlocked?: boolean; error?: string; requires_subscription?: boolean
    }
    if (res.status === 402 || data.requires_subscription) { setState("paywall"); return }
    if (res.status === 429) { setState("limit"); return }
    if (data.success || data.already_unlocked) { router.push(`/app/contacts/${contactId}`); return }
    setState("error")
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (sessionStorage.getItem("fc_terms_accepted") === "1") doUnlock()
    else setState("terms")
  }

  function handleAcceptTerms() {
    sessionStorage.setItem("fc_terms_accepted", "1"); setState("idle"); doUnlock()
  }

  if (state === "terms") return <TermsModal onAccept={handleAcceptTerms} onClose={() => setState("idle")} />

  if (state === "paywall") return (
    <Link href="/app/billing" onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold text-xs font-medium hover:bg-gold/15 transition-colors whitespace-nowrap">
      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Upgrade
    </Link>
  )

  if (state === "limit") return (
    <Link href="/app/billing" onClick={(e) => e.stopPropagation()}
      className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-medium hover:bg-amber-500/10 transition-colors whitespace-nowrap">
      Limit reached
    </Link>
  )

  if (state === "error") return <span className="text-xs text-red-400 px-1">Error — retry</span>

  // No contact info at all → soft link
  if (!hasEmail && !hasPhone) return (
    <Link href={`/app/contacts/${contactId}`} onClick={(e) => e.stopPropagation()}
      className="px-2.5 py-1.5 rounded-lg text-gray-500 text-xs hover:text-gray-300 transition-colors whitespace-nowrap">
      View profile
    </Link>
  )

  // Phone only
  if (!hasEmail && hasPhone) return (
    <button onClick={handleClick} disabled={state === "loading"}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-500/40 text-sky-400 text-xs font-medium hover:bg-sky-500/10 transition-colors disabled:opacity-50 whitespace-nowrap">
      {state === "loading"
        ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        : <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
      {state === "loading" ? "Unlocking…" : "Access phone"}
    </button>
  )

  // Email CTA (main path)
  const isVerified = verifiedStatus === "verified"
  const isCatchAll = verifiedStatus === "catch_all" || verifiedStatus === "unknown"

  return (
    <button onClick={handleClick} disabled={state === "loading"}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gold/40 text-gold text-xs font-medium hover:bg-gold/10 active:bg-gold/20 transition-colors disabled:opacity-50 whitespace-nowrap">
      {state === "loading"
        ? <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        : <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
      {state !== "loading" && isVerified && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Verified" />}
      {state !== "loading" && isCatchAll && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Catch-all" />}
      <span>{state === "loading" ? "Unlocking…" : "Access email"}</span>
    </button>
  )
}

// ── Main contact row ───────────────────────────────────────────────────────────
export default function ContactRow({ contact }: { contact: ContactListRow }) {
  const location = [contact.city, contact.country].filter(Boolean).join(", ")

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 bg-navy-light rounded-xl hover:bg-[#354460] active:bg-[#354460] transition-colors group">
      {/* Org / category avatar */}
      <OrgAvatar name={contact.organisation} category={contact.category} />

      {/* Identity block */}
      <Link href={`/app/contacts/${contact.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-white font-semibold text-sm leading-tight">{contact.name}</span>
          {contact.verified_status === "verified" && <VerifiedBadge />}
        </div>

        <div className="flex items-center gap-1 mt-0.5 text-xs flex-wrap leading-snug">
          {contact.role && (
            <span className="text-gold/80 truncate max-w-[160px] sm:max-w-[260px]">{contact.role}</span>
          )}
          {contact.role && (contact.organisation || location) && <span className="text-gray-600">·</span>}
          {contact.organisation && (
            <span className="text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">{contact.organisation}</span>
          )}
          {contact.organisation && location && <span className="text-gray-600">·</span>}
          {location && <span className="text-gray-500">{location}</span>}
        </div>

        {/* Signal pills + category */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {contact.has_email && <SignalPill type="email" />}
          {contact.has_phone && <SignalPill type="phone" />}
          {contact.has_linkedin && <SignalPill type="linkedin" />}
          {(contact.role_category ?? contact.category) && (
            <span className="text-[10px] text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded leading-none hidden sm:inline">
              {contact.role_category ?? contact.category}
            </span>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <SaveToListButton contactId={contact.id} compact />
        <ContactCTA
          contactId={contact.id}
          verifiedStatus={contact.verified_status}
          hasEmail={contact.has_email}
          hasPhone={contact.has_phone}
        />
      </div>
    </div>
  )
}
