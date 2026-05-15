"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import UnlockWallModal from "./UnlockWallModal"

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

export function ContactCTA({
  contactId,
  verifiedStatus,
  hasEmail,
  hasPhone,
}: {
  contactId: string
  verifiedStatus: string | null
  hasEmail: boolean
  hasPhone: boolean
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
    if (data.success || data.already_unlocked) {
      window.dispatchEvent(new Event("unlocks-updated"))
      router.push(`/app/contacts/${contactId}`)
      return
    }
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

  if (state === "terms")   return <TermsModal onAccept={handleAcceptTerms} onClose={() => setState("idle")} />
  if (state === "paywall") return <UnlockWallModal type="paywall" onClose={() => setState("idle")} />
  if (state === "limit")   return <UnlockWallModal type="limit"   onClose={() => setState("idle")} />
  if (state === "error")   return <span className="text-xs text-red-400 px-1">Error — retry</span>

  // No contact info at all
  if (!hasEmail && !hasPhone) return (
    <Link
      href={`/app/contacts/${contactId}`}
      onClick={(e) => e.stopPropagation()}
      className="px-3 py-2 rounded-lg text-gray-500 text-xs hover:text-gray-300 transition-colors whitespace-nowrap"
    >
      View
    </Link>
  )

  // Phone only
  if (!hasEmail && hasPhone) return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium hover:bg-sky-500/15 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
    >
      {state === "loading"
        ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        : <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
      {state === "loading" ? "…" : "Unlock"}
    </button>
  )

  // Email (main path)
  const isVerified = verifiedStatus === "verified"
  const isCatchAll = verifiedStatus === "catch_all" || verifiedStatus === "unknown"

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/20 active:bg-gold/25 transition-colors disabled:opacity-50 whitespace-nowrap min-w-[96px] justify-center"
    >
      {state === "loading"
        ? <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        : <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
      {state !== "loading" && isVerified  && <span className="w-1.5 h-1.5 rounded-full bg-green-500  shrink-0" title="Verified" />}
      {state !== "loading" && isCatchAll  && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Catch-all" />}
      <span>{state === "loading" ? "Unlocking…" : "Unlock"}</span>
    </button>
  )
}
