"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import SignalIcons from "@/app/app/SignalIcons"
import { ContactCTA } from "@/app/app/ContactCTA"

export type ContactWithMeta = {
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
  added_at: string
}

type SortKey = "added" | "name" | "org" | "verified"

interface Props {
  contacts: ContactWithMeta[]
  listId: string
  isSystem: boolean
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: "added", label: "Recently added" },
  { key: "name", label: "Name" },
  { key: "org", label: "Organisation" },
  { key: "verified", label: "Verified first" },
]

export default function ListDetailContactsClient({ contacts: initialContacts, listId, isSystem }: Props) {
  const [contacts, setContacts] = useState(initialContacts)
  const [sortBy, setSortBy] = useState<SortKey>("added")
  const [removingId, setRemovingId] = useState<string | null>(null)
  const supabase = createClient()

  function getSorted(): ContactWithMeta[] {
    return [...contacts].sort((a, b) => {
      switch (sortBy) {
        case "added":
          return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "org":
          return (a.organisation ?? "").localeCompare(b.organisation ?? "")
        case "verified": {
          const av = a.verified_status === "verified" ? 1 : 0
          const bv = b.verified_status === "verified" ? 1 : 0
          return bv - av
        }
      }
    })
  }

  async function removeContact(contactId: string) {
    setRemovingId(contactId)
    await supabase
      .from("list_contacts")
      .delete()
      .eq("list_id", listId)
      .eq("contact_id", contactId)
    setContacts((prev) => prev.filter((c) => c.id !== contactId))
    setRemovingId(null)
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">No contacts in this list yet</p>
        <p className="text-sm mb-4">
          Use the &ldquo;Save to list&rdquo; button on any contact to add them here
        </p>
        <Link
          href="/app"
          className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
        >
          Search contacts
        </Link>
      </div>
    )
  }

  const displayed = getSorted()

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-gray-500 shrink-0">Sort:</span>
        {SORTS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              sortBy === key
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contact rows */}
      <div className="space-y-2">
        {displayed.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 bg-navy-light rounded-xl px-4 py-3.5 border border-white/[0.05] hover:border-white/10 transition-colors"
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">
              {contact.name[0]?.toUpperCase()}
            </div>

            {/* Identity */}
            <Link
              href={`/app/contacts/${contact.id}`}
              className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white font-medium text-sm leading-tight">
                  {contact.name}
                </span>
                {contact.verified_status === "verified" && (
                  <span
                    title="Email verified"
                    className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400/80 bg-emerald-900/20 border border-emerald-900/40 px-1.5 py-0.5 rounded-full leading-none shrink-0"
                  >
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {[contact.role, contact.organisation].filter(Boolean).join(" · ")}
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Added {relativeDate(contact.added_at)}
              </p>
            </Link>

            {/* Signal icons — hidden on small screens */}
            <div className="shrink-0 hidden sm:block">
              <SignalIcons
                hasEmail={contact.has_email}
                hasPhone={contact.has_phone}
                hasLinkedin={contact.has_linkedin}
              />
            </div>

            {/* Unlock / View CTA */}
            <div className="shrink-0 w-20" onClick={(e) => e.stopPropagation()}>
              <ContactCTA
                contactId={contact.id}
                verifiedStatus={contact.verified_status}
                hasEmail={contact.has_email}
                hasPhone={contact.has_phone}
                hasLinkedin={contact.has_linkedin}
                isUnlocked={false}
              />
            </div>

            {/* Remove */}
            {!isSystem && (
              <button
                onClick={() => removeContact(contact.id)}
                disabled={removingId === contact.id}
                className="shrink-0 text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40 ml-1"
                title="Remove from list"
              >
                {removingId === contact.id ? "…" : "✕"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
