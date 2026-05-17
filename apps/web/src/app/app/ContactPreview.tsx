"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { type ContactListRow } from "./ContactRow"
import { ContactCTA } from "./ContactCTA"
import SaveToListButton from "@/components/SaveToListButton"

type UnlockedDetails = {
  email: string | null
  phone: string | null
  linkedin_url: string | null
}

interface Props {
  contact: ContactListRow
  onClose: () => void
  /** When true: renders as a static side panel (desktop). Otherwise: fixed overlay (mobile). */
  desktopMode?: boolean
}

export default function ContactPreview({ contact, onClose, desktopMode = false }: Props) {
  const [unlockedDetails, setUnlockedDetails] = useState<UnlockedDetails | null>(null)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fetchDetails = useCallback(async (contactId: string) => {
    setFetchingDetails(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/details`)
      if (res.ok) {
        const data = await res.json() as UnlockedDetails
        setUnlockedDetails(data)
      }
    } finally {
      setFetchingDetails(false)
    }
  }, [])

  // Reset state and auto-fetch when contact changes
  useEffect(() => {
    setUnlockedDetails(null)
    setCopiedField(null)
    if (contact.is_unlocked) {
      void fetchDetails(contact.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id])

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [onClose])

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1800)
    }).catch(() => {})
  }

  const location = [contact.city, contact.country].filter(Boolean).join(", ")
  const isUnlocked = contact.is_unlocked || !!unlockedDetails
  const hasAnyMethod = contact.has_email || contact.has_phone || contact.has_linkedin

  const initials = (contact.organisation ?? contact.name)
    .split(/[\s\-&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  const content = (
    <div className="flex flex-col h-full">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Contact</span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
          aria-label="Close preview"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* â”€â”€ Scrollable body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 overflow-y-auto">

        {/* Identity */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3.5">
            {/* Org logo / initials */}
            {contact.org_logo_url ? (
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.08] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={contact.org_logo_url}
                  alt={contact.organisation ?? ""}
                  className="w-full h-full object-contain p-1.5"
                  onError={(e) => {
                    const el = e.currentTarget
                    el.style.display = "none"
                    const parent = el.parentElement!
                    parent.textContent = initials.slice(0, 2)
                    parent.className =
                      "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 bg-white/[0.04] border border-white/[0.08] text-gray-500 select-none"
                  }}
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 bg-white/[0.04] border border-white/[0.08] text-gray-500 select-none">
                {initials.slice(0, 2)}
              </div>
            )}

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-white font-semibold text-[15px] leading-tight tracking-tight">
                  {contact.name}
                </h2>
                {contact.verified_status === "verified" && (
                  <svg
                    className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Email verified"
                  >
                    <title>Email verified</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              {contact.role && (
                <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">{contact.role}</p>
              )}
              {(contact.organisation || location) && (
                <p className="text-[12px] text-gray-600 mt-1 leading-snug">
                  {[contact.organisation, location].filter(Boolean).join(" Â· ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* â”€â”€ Contact methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="px-5 pb-5">
          {isUnlocked ? (
            /* Unlocked: show actual data */
            fetchingDetails ? (
              <div className="space-y-2 pt-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-11 rounded-lg bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : unlockedDetails && (unlockedDetails.email || unlockedDetails.phone || unlockedDetails.linkedin_url) ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2.5">
                  Contact details
                </p>

                {unlockedDetails.email && (
                  <button
                    onClick={() => copyToClipboard(unlockedDetails.email!, "email")}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] transition-colors group text-left"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="flex-1 text-[13px] text-gray-200 truncate font-mono tracking-tight">
                      {unlockedDetails.email}
                    </span>
                    <span className={`text-[11px] shrink-0 transition-colors ${copiedField === "email" ? "text-emerald-400" : "text-gray-700 group-hover:text-gray-400"}`}>
                      {copiedField === "email" ? "Copied!" : "Copy"}
                    </span>
                  </button>
                )}

                {unlockedDetails.phone && (
                  <button
                    onClick={() => copyToClipboard(unlockedDetails.phone!, "phone")}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] transition-colors group text-left"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="flex-1 text-[13px] text-gray-200 truncate font-mono tracking-tight">
                      {unlockedDetails.phone}
                    </span>
                    <span className={`text-[11px] shrink-0 transition-colors ${copiedField === "phone" ? "text-emerald-400" : "text-gray-700 group-hover:text-gray-400"}`}>
                      {copiedField === "phone" ? "Copied!" : "Copy"}
                    </span>
                  </button>
                )}

                {unlockedDetails.linkedin_url && (
                  <a
                    href={unlockedDetails.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] transition-colors group"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span className="flex-1 text-[13px] text-gray-200 truncate">LinkedIn Profile</span>
                    <svg className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            ) : !fetchingDetails ? (
              <p className="text-[13px] text-gray-600 py-2">No contact details on record.</p>
            ) : null
          ) : (
            /* Locked: show availability indicators + unlock CTA */
            <div className="space-y-3">
              {hasAnyMethod && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-gray-600">Available:</span>
                  <div className="flex items-center gap-1.5">
                    {contact.has_email && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </span>
                    )}
                    {contact.has_phone && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone
                      </span>
                    )}
                    {contact.has_linkedin && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </span>
                    )}
                  </div>
                </div>
              )}
              <ContactCTA
                contactId={contact.id}
                verifiedStatus={contact.verified_status}
                hasEmail={contact.has_email}
                hasPhone={contact.has_phone}
                isUnlocked={false}
                onUnlocked={() => void fetchDetails(contact.id)}
              />
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 py-3.5 border-t border-white/[0.06] shrink-0 flex items-center gap-2">
        <div className="flex-1">
          <SaveToListButton contactId={contact.id} />
        </div>
        <Link
          href={`/app/contacts/${contact.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 px-3 py-2 text-[12px] text-gray-500 hover:text-gray-200 border border-white/[0.06] hover:border-white/[0.14] rounded-lg transition-colors whitespace-nowrap"
        >
          Full profile
          <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )

  if (desktopMode) {
    return (
      <div className="w-full h-full rounded-xl border border-white/[0.06] bg-[#0d1117] shadow-xl overflow-hidden flex flex-col">
        {content}
      </div>
    )
  }

  // Mobile: full-height overlay
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} aria-hidden />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[min(420px,calc(100vw-2rem))] flex flex-col bg-[#0d1117] border-l border-white/[0.06] shadow-2xl">
        {content}
      </div>
    </>
  )
}
