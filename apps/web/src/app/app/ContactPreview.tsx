"use client"

import { useEffect } from "react"
import Link from "next/link"
import { type ContactListRow, ContactCTA } from "./ContactRow"
import SaveToListButton from "@/components/SaveToListButton"

const CATEGORY_COLORS: Record<string, string> = {
  Agent: "bg-purple-900/60 text-purple-300",
  Scout: "bg-blue-900/60 text-blue-300",
  Coach: "bg-teal-900/60 text-teal-300",
  Club:  "bg-gold/15 text-gold",
  Media: "bg-pink-900/60 text-pink-300",
}

interface Props {
  contact: ContactListRow
  onClose: () => void
  /** When true: renders as a static side panel (desktop). Otherwise: fixed overlay (mobile). */
  desktopMode?: boolean
}

export default function ContactPreview({ contact, onClose, desktopMode = false }: Props) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [onClose])

  const location = [contact.city, contact.country].filter(Boolean).join(", ")
  const isVerified = contact.verified_status === "verified"

  const initials = (contact.organisation ?? contact.name)
    .split(/[\s\-&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  const colorClass =
    CATEGORY_COLORS[contact.category ?? ""] ??
    "bg-navy-light text-gray-400 border border-gray-700"

  if (desktopMode) {
    return (
      <div className="w-full rounded-xl border border-navy-light/60 bg-[#0d1a2e] shadow-xl flex flex-col overflow-hidden">
        <PreviewHeader onClose={onClose} />
        <PreviewBody
          contact={contact}
          initials={initials}
          colorClass={colorClass}
          isVerified={isVerified}
          location={location}
        />
        <PreviewFooter contact={contact} />
      </div>
    )
  }

  // Mobile: full-height overlay
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[min(420px,calc(100vw-2rem))] flex flex-col bg-[#0d1a2e] border-l border-navy-light/50 shadow-2xl">
        <PreviewHeader onClose={onClose} />
        <PreviewBody
          contact={contact}
          initials={initials}
          colorClass={colorClass}
          isVerified={isVerified}
          location={location}
        />
        <PreviewFooter contact={contact} />
      </div>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PreviewHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-navy-light/40 shrink-0">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Contact preview
      </span>
      <button
        onClick={onClose}
        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-navy-light transition-colors"
        aria-label="Close preview"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function PreviewBody({
  contact,
  initials,
  colorClass,
  isVerified,
  location,
}: {
  contact: ContactListRow
  initials: string
  colorClass: string
  isVerified: boolean
  location: string
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Identity */}
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-base font-bold shrink-0 select-none ${colorClass}`}
        >
          {initials.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white font-bold text-base leading-snug">{contact.name}</h2>
            {isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400/70 bg-emerald-900/20 border border-emerald-900/40 px-1.5 py-0.5 rounded-full leading-none">
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </span>
            )}
          </div>
          {contact.organisation && (
            <p className="text-gray-200 font-medium text-sm mt-0.5">{contact.organisation}</p>
          )}
          {contact.role && (
            <p className="text-gray-400 text-sm">{contact.role}</p>
          )}
          {location && (
            <p className="text-gray-500 text-xs mt-1">{location}</p>
          )}
        </div>
      </div>

      {/* Contact methods */}
      {(contact.has_email || contact.has_phone || contact.has_linkedin) && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Available methods
          </p>
          <div className="flex flex-wrap gap-2">
            {contact.has_email && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-emerald-400 font-medium">Email</span>
              </div>
            )}
            {contact.has_phone && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                <svg className="w-3.5 h-3.5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-xs text-sky-400 font-medium">Phone</span>
              </div>
            )}
            {contact.has_linkedin && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-xs text-blue-400 font-medium">LinkedIn</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category */}
      {(contact.role_category ?? contact.category) && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
          <span className="text-xs text-gray-300 bg-gray-700/60 px-2.5 py-1.5 rounded-lg">
            {contact.role_category ?? contact.category}
          </span>
        </div>
      )}

      {/* Data quality */}
      {contact.verified_status && (
        <div className="p-3 bg-navy-light/40 rounded-lg">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Data quality</p>
          {isVerified ? (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-emerald-400">Email address verified</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 capitalize">{contact.verified_status.replace(/_/g, " ")}</span>
          )}
        </div>
      )}
    </div>
  )
}

function PreviewFooter({ contact }: { contact: ContactListRow }) {
  return (
    <div className="px-5 py-4 border-t border-navy-light/40 shrink-0 space-y-2">
      <div className="[&>*]:w-full [&>*]:justify-center">
        <ContactCTA
          contactId={contact.id}
          verifiedStatus={contact.verified_status}
          hasEmail={contact.has_email}
          hasPhone={contact.has_phone}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <SaveToListButton contactId={contact.id} />
        </div>
        <Link
          href={`/app/contacts/${contact.id}`}
          className="px-3 py-2 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors whitespace-nowrap"
        >
          Full profile →
        </Link>
      </div>
    </div>
  )
}
