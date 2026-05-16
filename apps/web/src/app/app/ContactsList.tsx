"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import ContactRow, { type ContactListRow } from "./ContactRow"
import ContactTableHeader from "./ContactTableHeader"
import ContactPreview from "./ContactPreview"
import { useSearchTransition } from "./SearchTransitionContext"

type SearchFilters = Record<string, string>

interface Props {
  contacts: ContactListRow[]
  totalCount: number
  isFree: boolean
  searchFilters: SearchFilters
}

export default function ContactsList({ contacts, totalCount, isFree, searchFilters }: Props) {
  const { isPending } = useSearchTransition()
  const [previewContact, setPreviewContact] = useState<ContactListRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState(false)

  const handlePreview = useCallback((contact: ContactListRow) => {
    setPreviewContact((prev) => (prev?.id === contact.id ? null : contact))
  }, [])

  const handleClose = useCallback(() => setPreviewContact(null), [])

  const toggleSelected = useCallback((id: string) => {
    setSelectAllMode(false)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectAllMode(false)
    setSelectedIds((prev) =>
      prev.size === contacts.length ? new Set() : new Set(contacts.map((c) => c.id))
    )
  }, [contacts])

  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length
  const canSelectAllResults = !isFree && allSelected && totalCount > contacts.length

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const supabase = createClient()
  const [bulkSaveOpen, setBulkSaveOpen] = useState(false)
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const [savingListId, setSavingListId] = useState<string | null>(null)
  const [bulkUnlocking, setBulkUnlocking] = useState(false)
  const [bulkExporting, setBulkExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const saveDropdownRef = useRef<HTMLDivElement>(null)

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectAllMode(false)
  }, [])

  // Contacts that need unlocking (not yet unlocked)
  const toUnlockIds = [...selectedIds].filter(
    (id) => !contacts.find((c) => c.id === id)?.is_unlocked
  )
  const alreadyUnlockedCount = selectedIds.size - toUnlockIds.length

  const loadLists = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("lists")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setLists(data ?? [])
  }, [supabase])

  useEffect(() => {
    if (!bulkSaveOpen) return
    function onClickOutside(e: MouseEvent) {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(e.target as Node)) {
        setBulkSaveOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [bulkSaveOpen])

  async function handleBulkSaveToList(listId: string) {
    setSavingListId(listId)
    const ids = [...selectedIds]
    await supabase.from("list_contacts").upsert(
      ids.map((contactId) => ({ list_id: listId, contact_id: contactId })),
      { onConflict: "list_id,contact_id", ignoreDuplicates: true } as Parameters<typeof supabase.from>[0] extends never ? never : object
    )
    setSavingListId(null)
    setBulkSaveOpen(false)
    clearSelection()
  }

  async function handleBulkUnlock() {
    if (toUnlockIds.length === 0) return
    setBulkUnlocking(true)
    for (const id of toUnlockIds) {
      await fetch(`/api/contacts/${id}/unlock`, { method: "POST" })
    }
    window.dispatchEvent(new Event("unlocks-updated"))
    setBulkUnlocking(false)
    clearSelection()
  }

  async function handleBulkExport() {
    setBulkExporting(true)
    setExportError(null)
    // selectAllMode: server re-runs the search query restricted to unlocked contacts
    // page selection: send explicit IDs
    const body = selectAllMode
      ? { search_filters: searchFilters }
      : { contact_ids: [...selectedIds] }
    const res = await fetch("/api/contacts/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `footy-contacts-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      clearSelection()
    } else {
      const data = await res.json() as { message?: string; error?: string; used?: number; limit?: number }
      if (res.status === 402) {
        setExportError("Upgrade your plan to export contacts.")
      } else if (res.status === 429) {
        if (data.error === "export_limit_reached") {
          setExportError(data.message ?? "Export limit reached. Try again later.")
        } else {
          setExportError(`Export quota reached (${data.used ?? 0}/${data.limit ?? 0} this period).`)
        }
      } else {
        setExportError(data.message ?? data.error ?? "Export failed")
      }
    }
    setBulkExporting(false)
  }

  return (
    <>
      {/* Loading bar — slides in at the top while any search transition is pending */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-navy-dark overflow-hidden">
          <div className="h-full bg-gold animate-[loading-bar_1.4s_ease-in-out_infinite]" />
        </div>
      )}
      <div className="flex gap-4 items-start">
        {/* Results list wrapped in a bordered table container */}
        <div className={`min-w-0 ${previewContact ? "flex-1" : "w-full"}`}>
          <div className={`border border-white/[0.06] rounded-xl overflow-hidden transition-opacity duration-150 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
            <div className="overflow-x-auto">
              <div className="min-w-[780px]">
                {/* Bulk action bar — appears when rows are selected */}
                {(selectedIds.size > 0 || selectAllMode) && (
                  <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-gold/[0.05] border-b border-gold/20">
                    {/* Selection count */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-gold">
                        {selectAllMode
                          ? `${totalCount.toLocaleString()} results (all matching)`
                          : `${selectedIds.size} selected`}
                      </span>
                      {!selectAllMode && alreadyUnlockedCount > 0 && (
                        <span className="text-[11px] text-gray-500">
                          ({alreadyUnlockedCount} already unlocked)
                        </span>
                      )}
                    </div>

                    {/* Save to list — hidden in selectAllMode */}
                    {!selectAllMode && (
                    <div className="relative" ref={saveDropdownRef}>
                      <button
                        onClick={() => { if (!bulkSaveOpen) loadLists(); setBulkSaveOpen((v) => !v) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs hover:bg-white/10 transition-colors"
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Save to list
                        <svg className="w-3 h-3 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {bulkSaveOpen && (
                        <div className="absolute left-0 top-full mt-1 z-30 bg-navy border border-navy-light rounded-xl shadow-xl min-w-[160px] py-1 overflow-hidden">
                          {lists.length === 0 ? (
                            <p className="px-3 py-2.5 text-xs text-gray-500">No lists yet</p>
                          ) : (
                            lists.map((list) => (
                              <button
                                key={list.id}
                                onClick={() => handleBulkSaveToList(list.id)}
                                disabled={savingListId !== null}
                                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/[0.05] transition-colors disabled:opacity-50 truncate"
                              >
                                {savingListId === list.id ? "Saving…" : list.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    )}

                    {/* Unlock — only for page selection, only if some need unlocking */}
                    {!selectAllMode && toUnlockIds.length > 0 && (
                      <button
                        onClick={handleBulkUnlock}
                        disabled={bulkUnlocking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors disabled:opacity-50"
                      >
                        {bulkUnlocking && (
                          <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        )}
                        {bulkUnlocking ? "Unlocking…" : `Unlock ${toUnlockIds.length}`}
                      </button>
                    )}

                    {/* Export CSV */}
                    <button
                      onClick={handleBulkExport}
                      disabled={bulkExporting}
                      title={selectAllMode
                        ? `Export all ${totalCount.toLocaleString()} matching contacts (unlocked only)`
                        : "Export selected contacts to CSV (unlocked only)"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      {bulkExporting ? (
                        <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      {bulkExporting ? "Exporting…" : "Export CSV"}
                    </button>

                    {exportError && (
                      <span className="text-xs text-red-400">{exportError}</span>
                    )}

                    {/* Clear selection */}
                    <button
                      onClick={clearSelection}
                      className="ml-auto flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                      aria-label="Clear selection"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* "Select all results" banner — shown to paid users after selecting full page */}
                {canSelectAllResults && !selectAllMode && (
                  <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-navy-dark/60 border-b border-white/[0.06]">
                    <span className="text-xs text-gray-400">
                      All {contacts.length} contacts on this page are selected.
                    </span>
                    <button
                      onClick={() => setSelectAllMode(true)}
                      className="text-xs font-semibold text-gold hover:text-yellow-300 transition-colors"
                    >
                      Select all {totalCount.toLocaleString()} matching results →
                    </button>
                  </div>
                )}

                <ContactTableHeader
                  allSelected={allSelected || selectAllMode}
                  someSelected={someSelected && !selectAllMode}
                  onToggleAll={toggleAll}
                />
                <div>
                  {contacts.map((contact) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      onPreview={handlePreview}
                      isSelected={previewContact?.id === contact.id}
                      selected={selectedIds.has(contact.id) || selectAllMode}
                      onToggle={toggleSelected}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop side panel — hidden on mobile (mobile uses fixed overlay below) */}
        {previewContact && (
          <aside className="hidden lg:block w-[340px] xl:w-[360px] shrink-0 sticky top-36 self-start">
            <ContactPreview
              key={previewContact.id}
              contact={previewContact}
              onClose={handleClose}
              desktopMode
            />
          </aside>
        )}
      </div>

      {/* Mobile / tablet fixed overlay */}
      {previewContact && (
        <div className="lg:hidden">
          <ContactPreview
            key={`mobile-${previewContact.id}`}
            contact={previewContact}
            onClose={handleClose}
          />
        </div>
      )}
    </>
  )
}
