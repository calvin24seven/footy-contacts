"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import OrgAvatar from "@/app/app/OrgAvatar"
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
  is_unlocked: boolean
  added_at: string
}

type SortKey = "added" | "name" | "org" | "verified"

interface Props {
  contacts: ContactWithMeta[]
  listId: string
  isSystem: boolean
  allLists: { id: string; name: string }[]
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

export default function ListDetailContactsClient({
  contacts: initialContacts,
  listId,
  isSystem,
  allLists,
}: Props) {
  const [contacts, setContacts] = useState(initialContacts)
  const [sortBy, setSortBy] = useState<SortKey>("added")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [bulkRemoving, setBulkRemoving] = useState(false)
  const [addToListOpen, setAddToListOpen] = useState(false)
  const [savingListId, setSavingListId] = useState<string | null>(null)
  const addDropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!addToListOpen) return
    function handle(e: MouseEvent) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setAddToListOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [addToListOpen])

  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length
  const someSelected = selectedIds.size > 0

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(contacts.map((c) => c.id)))
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

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

  async function bulkRemove() {
    setBulkRemoving(true)
    const ids = [...selectedIds]
    await supabase
      .from("list_contacts")
      .delete()
      .eq("list_id", listId)
      .in("contact_id", ids)
    setContacts((prev) => prev.filter((c) => !ids.includes(c.id)))
    setSelectedIds(new Set())
    setBulkRemoving(false)
  }

  async function addToList(targetListId: string) {
    setSavingListId(targetListId)
    const ids = [...selectedIds]
    await supabase.from("list_contacts").upsert(
      ids.map((contactId) => ({ list_id: targetListId, contact_id: contactId })),
      { onConflict: "list_id,contact_id", ignoreDuplicates: true } as unknown as object
    )
    setSavingListId(null)
    setAddToListOpen(false)
    setSelectedIds(new Set())
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
      {/* Top bar: select-all + sort */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected
            }}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-600 bg-navy accent-gold cursor-pointer"
          />
          <span className="text-xs text-gray-500">
            {someSelected ? `${selectedIds.size} selected` : "Select all"}
          </span>
        </label>
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <span className="text-xs text-gray-600">Sort:</span>
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
      </div>

      {/* Bulk action bar */}
      {someSelected && !isSystem && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2.5 bg-navy-light border border-white/[0.08] rounded-xl flex-wrap">
          <span className="text-xs text-gray-400 shrink-0">
            {selectedIds.size} contact{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          {allLists.length > 0 && (
            <div className="relative" ref={addDropdownRef}>
              <button
                onClick={() => setAddToListOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-gray-300 text-xs hover:bg-white/10 transition-colors"
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Add to list
                <svg className="w-3 h-3 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {addToListOpen && (
                <div className="absolute left-0 top-full mt-1 z-30 bg-navy border border-navy-light rounded-xl shadow-xl min-w-[180px] py-1 overflow-hidden">
                  {allLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => addToList(list.id)}
                      disabled={savingListId !== null}
                      className="w-full text-left px-3 py-2.5 text-xs text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors disabled:opacity-50 truncate"
                    >
                      {savingListId === list.id ? "Adding…" : list.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={bulkRemove}
            disabled={bulkRemoving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-50 ml-auto"
          >
            {bulkRemoving ? "Removing…" : `Remove ${selectedIds.size} from list`}
          </button>
        </div>
      )}

      {/* Contact rows */}
      <div className="space-y-1.5">
        {displayed.map((contact) => {
          const selected = selectedIds.has(contact.id)
          const location = [contact.city, contact.country].filter(Boolean).join(", ")
          return (
            <div
              key={contact.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 border transition-colors ${
                selected
                  ? "bg-gold/[0.06] border-gold/20"
                  : "bg-navy-light border-white/[0.05] hover:border-white/10"
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleOne(contact.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-gray-600 bg-navy accent-gold cursor-pointer shrink-0"
              />

              {/* Org avatar */}
              <div className="shrink-0">
                <OrgAvatar
                  name={contact.organisation}
                  category={contact.category}
                  logoUrl={null}
                />
              </div>

              {/* Identity */}
              <Link
                href={`/app/contacts/${contact.id}`}
                className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-white font-medium text-[13px] leading-tight truncate">
                    {contact.name}
                  </span>
                  {contact.verified_status === "verified" && (
                    <svg
                      className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Email verified"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                {contact.role && (
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{contact.role}</p>
                )}
                <p className="text-[11px] text-gray-600 truncate">
                  {[contact.organisation, location].filter(Boolean).join(" · ")}
                </p>
              </Link>

              {/* Signal icons */}
              <div className="shrink-0 hidden sm:block">
                <SignalIcons
                  hasEmail={contact.has_email}
                  hasPhone={contact.has_phone}
                  hasLinkedin={contact.has_linkedin}
                />
              </div>

              {/* Added date */}
              <span className="text-[10px] text-gray-700 shrink-0 hidden md:block whitespace-nowrap">
                {relativeDate(contact.added_at)}
              </span>

              {/* Unlock / View CTA */}
              <div className="shrink-0 w-20" onClick={(e) => e.stopPropagation()}>
                <ContactCTA
                  contactId={contact.id}
                  verifiedStatus={contact.verified_status}
                  hasEmail={contact.has_email}
                  hasPhone={contact.has_phone}
                  hasLinkedin={contact.has_linkedin}
                  isUnlocked={contact.is_unlocked}
                />
              </div>

              {/* Remove */}
              {!isSystem && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeContact(contact.id) }}
                  disabled={removingId === contact.id}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/[0.08] transition-colors disabled:opacity-40"
                  title="Remove from list"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
