"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export type ContactListRow = {
  id: string
  name: string
  role: string | null
  organisation: string | null
  category: string | null
  country: string | null
  city: string | null
  verified_status: string | null
}

// ── Email status badge ─────────────────────────────────────────────────────────
function EmailBadge({ status }: { status: string | null }) {
  if (!status || status === "unverified") return null
  const map: Record<string, { label: string; cls: string }> = {
    verified:  { label: "✓ Verified",  cls: "bg-green-500/20 text-green-400" },
    catch_all: { label: "~ Catch-all", cls: "bg-amber-500/20 text-amber-400" },
    unknown:   { label: "? Unknown",   cls: "bg-gray-500/20 text-gray-400" },
    risky:     { label: "⚠ Risky",     cls: "bg-orange-500/20 text-orange-400" },
  }
  const badge = map[status]
  if (!badge) return null
  return (
    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium shrink-0 ${badge.cls}`}>
      {badge.label}
    </span>
  )
}

// ── Terms modal ────────────────────────────────────────────────────────────────
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
        <h3 className="text-white font-bold text-lg mb-1">Before you access this email</h3>
        <p className="text-gray-400 text-sm mb-4">
          By accessing contact details you agree to our fair-use policy:
        </p>
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
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Email cell (inline unlock action) ─────────────────────────────────────────
function EmailCell({ contactId, verifiedStatus }: { contactId: string; verifiedStatus: string | null }) {
  const [state, setState] = useState<"idle" | "terms" | "loading" | "paywall" | "limit" | "error">("idle")
  const router = useRouter()

  // No email on file
  if (!verifiedStatus || verifiedStatus === "unverified") {
    return <span className="text-gray-600 text-xs">No email</span>
  }

  async function doUnlock() {
    setState("loading")
    const res = await fetch(`/api/contacts/${contactId}/unlock`, { method: "POST" })
    const data = await res.json() as {
      success?: boolean
      already_unlocked?: boolean
      email?: string
      error?: string
      requires_subscription?: boolean
    }

    if (res.status === 402 || data.requires_subscription) { setState("paywall"); return }
    if (res.status === 429) { setState("limit"); return }
    if (data.success || data.already_unlocked) {
      // Navigate to the contact detail page where the email is shown
      router.push(`/app/contacts/${contactId}`)
      return
    }
    setState("error")
  }

  function handleAccessClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Check if already accepted terms this session
    if (sessionStorage.getItem("fc_terms_accepted") === "1") {
      doUnlock()
    } else {
      setState("terms")
    }
  }

  function handleAcceptTerms() {
    sessionStorage.setItem("fc_terms_accepted", "1")
    setState("idle")
    doUnlock()
  }

  if (state === "terms") {
    return <TermsModal onAccept={handleAcceptTerms} onClose={() => setState("idle")} />
  }

  if (state === "paywall") {
    return (
      <Link
        href="/app/billing"
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-gold underline"
      >
        Upgrade to unlock
      </Link>
    )
  }

  if (state === "limit") {
    return (
      <Link
        href="/app/billing"
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-yellow-400 underline"
      >
        Limit reached
      </Link>
    )
  }

  if (state === "error") {
    return <span className="text-xs text-red-400">Error — retry</span>
  }

  return (
    <button
      onClick={handleAccessClick}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/40 text-gold text-xs font-medium hover:bg-gold/10 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {state === "loading" ? (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
      {state === "loading" ? "Unlocking…" : "Access email"}
    </button>
  )
}

// ── Main contact row ───────────────────────────────────────────────────────────
export default function ContactRow({ contact }: { contact: ContactListRow }) {
  return (
    <div className="grid grid-cols-[2fr_2fr_2fr_auto] items-center gap-4 px-4 py-3 bg-navy-light rounded-xl hover:bg-[#354460] transition-colors group">
      {/* Name column */}
      <Link href={`/app/contacts/${contact.id}`} className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs shrink-0">
          {contact.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white font-medium text-sm truncate">{contact.name}</span>
            <EmailBadge status={contact.verified_status} />
          </div>
          {contact.country && (
            <p className="text-xs text-gray-500 truncate">{contact.country}</p>
          )}
        </div>
      </Link>

      {/* Job title column */}
      <Link href={`/app/contacts/${contact.id}`} className="min-w-0">
        <p className="text-sm text-gray-300 truncate">{contact.role ?? "—"}</p>
      </Link>

      {/* Company column */}
      <Link href={`/app/contacts/${contact.id}`} className="min-w-0">
        <p className="text-sm text-gray-300 truncate">{contact.organisation ?? "—"}</p>
      </Link>

      {/* Email column */}
      <div className="flex justify-end">
        <EmailCell contactId={contact.id} verifiedStatus={contact.verified_status} />
      </div>
    </div>
  )
}
