"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/database.types"

type ListRow = Tables<"lists">

interface Props {
  contactId: string
  compact?: boolean
}

export default function SaveToListButton({ contactId, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const [lists, setLists] = useState<ListRow[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [listsRes, savedRes] = await Promise.all([
        supabase
          .from("lists")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("list_contacts")
          .select("list_id")
          .eq("contact_id", contactId),
      ])
      setLists(listsRes.data ?? [])
      setSavedIds(new Set((savedRes.data ?? []).map((r) => r.list_id)))
    }
    load()
  }, [open, contactId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function toggleList(list: ListRow) {
    setLoadingId(list.id)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingId(null); return }

    if (savedIds.has(list.id)) {
      await supabase
        .from("list_contacts")
        .delete()
        .eq("list_id", list.id)
        .eq("contact_id", contactId)
      setSavedIds((prev) => { const s = new Set(prev); s.delete(list.id); return s })
    } else {
      const { error: err } = await supabase
        .from("list_contacts")
        .insert({ list_id: list.id, contact_id: contactId })
      if (!err) {
        setSavedIds((prev) => new Set([...prev, list.id]))
      } else {
        setError("Failed to save contact to list")
      }
    }
    setLoadingId(null)
  }

  async function createAndSave(e: React.FormEvent) {
    e.preventDefault()
    if (!newListName.trim()) return
    setCreating(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }

    const { data: newList, error: listErr } = await supabase
      .from("lists")
      .insert({ name: newListName.trim(), user_id: user.id })
      .select("*")
      .single()

    if (listErr || !newList) {
      setError(listErr?.message ?? "Failed to create list")
      setCreating(false)
      return
    }

    const { error: addErr } = await supabase
      .from("list_contacts")
      .insert({ list_id: newList.id, contact_id: contactId })

    if (!addErr) {
      setLists((prev) => [newList, ...prev])
      setSavedIds((prev) => new Set([...prev, newList.id]))
    }
    setNewListName("")
    setShowCreate(false)
    setCreating(false)
  }

  const isSaved = savedIds.size > 0

  return (
    <div className="relative" ref={dropdownRef}>
      {compact ? (
        // Icon-only version for contact rows
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}
          title={isSaved ? "Saved to list" : "Save to list"}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isSaved
              ? "text-gold bg-gold/10 hover:bg-gold/20"
              : "text-gray-500 hover:text-gray-300 hover:bg-navy"
          }`}
          aria-label={isSaved ? "Saved to list" : "Save to list"}
        >
          {isSaved ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSaved
              ? "bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30"
              : "bg-navy text-gray-300 border border-gray-600 hover:border-gray-400"
          }`}
        >
          <span>{isSaved ? "✓" : "+"}</span>
          {isSaved ? "Saved" : "Save to list"}
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-1 w-60 bg-navy-light border border-gray-700 rounded-xl shadow-xl z-10">
          <div className="p-2">
            {lists.length === 0 && !showCreate && (
              <p className="text-gray-400 text-xs px-2 py-2">No lists yet</p>
            )}
            {lists.map((list) => {
              const saved = savedIds.has(list.id)
              return (
                <button
                  key={list.id}
                  onClick={() => toggleList(list)}
                  disabled={loadingId === list.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-navy transition-colors disabled:opacity-50"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      saved ? "bg-gold border-gold text-navy" : "border-gray-600"
                    }`}
                  >
                    {saved && "✓"}
                  </span>
                  <span className="text-white truncate">{list.name}</span>
                </button>
              )
            })}

            {showCreate ? (
              <form onSubmit={createAndSave} className="px-2 py-1 mt-1">
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name"
                  className="w-full px-3 py-1.5 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-1.5 bg-gold text-navy rounded-lg text-xs font-semibold hover:bg-gold-dark disabled:opacity-50"
                  >
                    {creating ? "Creating…" : "Create & save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-3 py-1.5 text-gray-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gold hover:bg-navy transition-colors mt-1 border-t border-gray-700 pt-2"
              >
                + New list
              </button>
            )}

            {error && (
              <p className="text-red-400 text-xs px-2 pb-1">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
