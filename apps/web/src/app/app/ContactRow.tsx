"use client"

import Link from "next/link"
import OrgAvatar from "./OrgAvatar"
import SignalIcons from "./SignalIcons"
import { ContactCTA } from "./ContactCTA"
import SaveToListButton from "@/components/SaveToListButton"
import { cn } from "@/lib/utils"

// Re-export so existing imports from "./ContactRow" continue to resolve
export { ContactCTA } from "./ContactCTA"

export type ContactListRow = {
  id: string
  name: string
  role: string | null
  organisation: string | null
  org_logo_url?: string | null
  category: string | null
  country: string | null
  city: string | null
  verified_status: string | null
  has_email: boolean
  has_phone: boolean
  has_linkedin: boolean
  role_category: string | null
}

// Short country codes for common long names
const COUNTRY_SHORT: Record<string, string> = {
  "United Kingdom":           "UK",
  "United States":            "USA",
  "United States of America": "USA",
  "United Arab Emirates":     "UAE",
  "Republic of Ireland":      "Ireland",
  "South Africa":             "S. Africa",
  "Saudi Arabia":             "KSA",
  "New Zealand":              "NZ",
  "Czech Republic":           "Czechia",
  "Bosnia and Herzegovina":   "Bosnia",
  "Trinidad and Tobago":      "T&T",
  "Papua New Guinea":         "PNG",
}

function VerifiedBadge() {
  return (
    <span
      title="Email verified"
      className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400/80 bg-emerald-900/20 border border-emerald-900/40 px-1.5 py-0.5 rounded-full leading-none"
    >
      <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
  )
}

// ── Mobile identity block ─────────────────────────────────────────────────────
function MobileIdentity({
  contact,
  location,
}: {
  contact: ContactListRow
  location: string
}) {
  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-white font-semibold text-[14px] leading-tight">{contact.name}</span>
        {contact.verified_status === "verified" && (
          <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      {contact.role && (
        <div className="text-[12px] text-gray-400 mt-0.5 truncate">{contact.role}</div>
      )}
      {(contact.organisation || location) && (
        <div className="text-[12px] text-gray-500 mt-0.5 truncate">
          {[contact.organisation, location].filter(Boolean).join(" · ")}
        </div>
      )}
      {(contact.has_email || contact.has_phone || contact.has_linkedin) && (
        <div className="flex items-center gap-1 mt-1.5">
          {contact.has_email    && <span className="w-4 h-4 flex items-center justify-center text-emerald-400/70"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>}
          {contact.has_phone    && <span className="w-4 h-4 flex items-center justify-center text-sky-400/70"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></span>}
          {contact.has_linkedin && <span className="w-4 h-4 flex items-center justify-center text-blue-400/70"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></span>}
        </div>
      )}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContactRow({
  contact,
  onPreview,
  isSelected,
}: {
  contact: ContactListRow
  onPreview?: (contact: ContactListRow) => void
  isSelected?: boolean
}) {
  const countryShort = contact.country ? (COUNTRY_SHORT[contact.country] ?? contact.country) : null
  const location = [contact.city, countryShort].filter(Boolean).join(", ")
  const category = contact.role_category ?? contact.category

  const rowBase     = "border-b border-white/[0.05] transition-colors cursor-pointer"
  const rowSelected = "bg-gold/[0.06] border-l-2 border-l-gold/40"
  const rowIdle     = "hover:bg-white/[0.025]"

  return (
    <>
      {/* ── Desktop table row (must match ContactTableHeader grid) ── */}
      <div
        className={cn(
          "hidden md:grid grid-cols-[2fr_1.4fr_1.4fr_80px_auto] gap-x-4 items-center px-4 py-3.5",
          rowBase,
          isSelected ? rowSelected : rowIdle,
        )}
        onClick={() => onPreview?.(contact)}
        role="row"
      >
        {/* Col 1 — Avatar + Name + Category */}
        <div className="flex items-center gap-3 min-w-0">
          <OrgAvatar name={contact.organisation} category={contact.category} logoUrl={contact.org_logo_url} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-semibold text-[13px] leading-tight truncate max-w-[180px]">
                {contact.name}
              </span>
              {contact.verified_status === "verified" && <VerifiedBadge />}
            </div>
            {category && (
              <span className="text-[11px] text-gray-500 mt-0.5 block truncate">{category}</span>
            )}
          </div>
        </div>

        {/* Col 2 — Job title */}
        <div className="min-w-0">
          {contact.role
            ? <span className="text-[13px] text-gray-300 leading-snug truncate block">{contact.role}</span>
            : <span className="text-[13px] text-gray-600">—</span>
          }
        </div>

        {/* Col 3 — Organisation + Location */}
        <div className="min-w-0">
          {contact.organisation && (
            <span className="text-[13px] text-gray-200 font-medium truncate block">{contact.organisation}</span>
          )}
          {location && (
            <span className="text-[11px] text-gray-500 truncate block mt-0.5">{location}</span>
          )}
          {!contact.organisation && !location && (
            <span className="text-[13px] text-gray-600">—</span>
          )}
        </div>

        {/* Col 4 — Signal icons */}
        <div>
          <SignalIcons
            hasEmail={contact.has_email}
            hasPhone={contact.has_phone}
            hasLinkedin={contact.has_linkedin}
          />
        </div>

        {/* Col 5 — Actions (stop row-click propagation) */}
        <div
          className="flex items-center gap-1 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <SaveToListButton contactId={contact.id} compact />
          <ContactCTA
            contactId={contact.id}
            verifiedStatus={contact.verified_status}
            hasEmail={contact.has_email}
            hasPhone={contact.has_phone}
          />
        </div>
      </div>

      {/* ── Mobile card ────────────────────────────────────────────── */}
      <div
        className={cn(
          "md:hidden flex items-center gap-3 px-4 py-3.5",
          rowBase,
          isSelected ? rowSelected : rowIdle,
        )}
      >
        <OrgAvatar name={contact.organisation} category={contact.category} logoUrl={contact.org_logo_url} />

        {onPreview ? (
          <button className="flex-1 min-w-0 text-left" onClick={() => onPreview(contact)}>
            <MobileIdentity contact={contact} location={location} />
          </button>
        ) : (
          <Link href={`/app/contacts/${contact.id}`} className="flex-1 min-w-0">
            <MobileIdentity contact={contact} location={location} />
          </Link>
        )}

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <ContactCTA
            contactId={contact.id}
            verifiedStatus={contact.verified_status}
            hasEmail={contact.has_email}
            hasPhone={contact.has_phone}
          />
        </div>
      </div>
    </>
  )
}
