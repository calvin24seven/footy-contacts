"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type ListRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  tags: string[]
  contact_count: number
  created_at: string
  updated_at: string
  is_system: boolean
}

interface Props {
  initialLists: ListRow[]
}

type SortKey = "updated" | "name" | "count"

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

// ── Tag pill ──────────────────────────────────────────────────────────────────
function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gold/10 border border-gold/25 text-gold/80">
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-gold/20 transition-colors text-gold/60 hover:text-gold leading-none"
          aria-label={`Remove tag ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  )
}

// ── Edit / Create modal ───────────────────────────────────────────────────────
function ListModal({
  title,
  initialName,
  initialDesc,
  initialTags,
  submitLabel,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  title: string
  initialName: string
  initialDesc: string
  initialTags: string[]
  submitLabel: string
  loading: boolean
  error: string | null
  onSubmit: (name: string, desc: string, tags: string[]) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [desc, setDesc] = useState(initialDesc)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState("")

  function addTag() {
    const t = tagInput.trim()
    if (!t || tags.length >= 3 || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setTagInput("")
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-navy-light border border-white/[0.07] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            onSubmit(name.trim(), desc.trim(), tags)
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">List name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premier League Directors"
              required
              className="w-full px-3 py-2.5 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description <span className="text-gray-600">(optional)</span></label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What's this list for?"
              className="w-full px-3 py-2.5 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Tags <span className="text-gray-600">(up to 3)</span>
            </label>

            {/* Existing tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <TagPill key={tag} tag={tag} onRemove={() => removeTag(tag)} />
                ))}
              </div>
            )}

            {/* Add tag input */}
            {tags.length < 3 && (
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag() }
                  }}
                  placeholder="e.g. Warm lead, Q3 target…"
                  maxLength={30}
                  className="flex-1 px-3 py-2 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 text-sm"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-2 bg-white/[0.07] border border-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
            {tags.length >= 3 && (
              <p className="text-xs text-gray-600 mt-1">Maximum 3 tags reached</p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-gold text-navy rounded-lg font-semibold text-sm hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-navy text-gray-300 rounded-lg text-sm hover:bg-navy-dark transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ListsClient({ initialLists }: Props) {
  const [lists, setLists] = useState<ListRow[]>(initialLists)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingList, setEditingList] = useState<ListRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exportingListId, setExportingListId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>("updated")
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const supabase = createClient()

  async function createList(name: string, desc: string, tags: string[]) {
    setCreating(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }

    const { data, error: err } = await supabase
      .from("lists")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ name, description: desc || null, tags, user_id: user.id } as any)
      .select("*")
      .single()

    if (err) {
      setError(err.message)
    } else if (data) {
      setLists((prev) => [{ ...data, tags: (data as unknown as { tags?: string[] }).tags ?? [], is_system: false, contact_count: 0 }, ...prev])
      setShowCreate(false)
    }
    setCreating(false)
  }

  async function saveEdit(name: string, desc: string, tags: string[]) {
    if (!editingList) return
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from("lists")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ name, description: desc || null, tags } as any)
      .eq("id", editingList.id)

    if (err) {
      setError(err.message)
    } else {
      setLists((prev) =>
        prev.map((l) =>
          l.id === editingList.id ? { ...l, name, description: desc || null, tags } : l
        )
      )
      setEditingList(null)
    }
    setSaving(false)
  }

  async function deleteList(id: string) {
    setDeletingId(id)
    setError(null)
    const { error: err } = await supabase.from("lists").delete().eq("id", id)
    if (err) {
      setError(err.message)
      setDeletingId(null)
    } else {
      setLists((prev) => prev.filter((l) => l.id !== id))
      setDeletingId(null)
    }
  }

  async function handleExportList(listId: string, listName: string) {
    setExportingListId(listId)
    setError(null)
    const res = await fetch("/api/contacts/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: listId }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${listName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } else {
      const data = (await res.json()) as { error?: string; message?: string }
      setError(data.message ?? data.error ?? "Export failed")
    }
    setExportingListId(null)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Lists</h1>
          <p className="text-gray-400 text-sm">Organise contacts into lists</p>
        </div>
        <button
          onClick={() => { setError(null); setShowCreate(true) }}
          className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
        >
          + New list
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <ListModal
          title="Create new list"
          initialName=""
          initialDesc=""
          initialTags={[]}
          submitLabel="Create list"
          loading={creating}
          error={error}
          onSubmit={createList}
          onClose={() => { setShowCreate(false); setError(null) }}
        />
      )}

      {/* Edit modal */}
      {editingList && (
        <ListModal
          title="Edit list"
          initialName={editingList.name}
          initialDesc={editingList.description ?? ""}
          initialTags={editingList.tags}
          submitLabel="Save changes"
          loading={saving}
          error={error}
          onSubmit={saveEdit}
          onClose={() => { setEditingList(null); setError(null) }}
        />
      )}

      {error && !showCreate && !editingList && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {lists.length > 0 ? (() => {
        // Collect all unique tags across user lists (non-system)
        const allTags = Array.from(
          new Set(lists.filter((l) => !l.is_system).flatMap((l) => l.tags))
        ).sort()

        // Sort + filter
        const sorted = [...lists].sort((a, b) => {
          if (a.is_system !== b.is_system) return a.is_system ? -1 : 1
          switch (sortBy) {
            case "name":    return a.name.localeCompare(b.name)
            case "count":   return b.contact_count - a.contact_count
            case "updated": return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          }
        })
        const displayed = filterTag ? sorted.filter((l) => l.tags.includes(filterTag)) : sorted

        return (
          <div>
            {/* Sort + filter bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Sort:</span>
                {([["updated", "Recent"], ["name", "Name"], ["count", "Contacts"]] as [SortKey, string][]).map(([key, label]) => (
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

              {/* Tag filter */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-500">Filter:</span>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        filterTag === tag
                          ? "bg-gold/20 text-gold border border-gold/30"
                          : "text-gray-500 hover:text-gold/70 border border-transparent hover:border-gold/20"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Empty filter result */}
            {displayed.length === 0 && (
              <p className="text-gray-500 text-sm py-6 text-center">
                No lists tagged &ldquo;{filterTag}&rdquo;.{" "}
                <button onClick={() => setFilterTag(null)} className="text-gold hover:underline">Clear filter</button>
              </p>
            )}

            <div className="space-y-2">
              {displayed.map((list) => (
                <div
                  key={list.id}
                  className="bg-navy-light border border-white/[0.05] rounded-xl px-5 py-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: list info */}
                    <Link href={`/app/lists/${list.id}`} className="flex-1 min-w-0 group">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold group-hover:text-gold transition-colors leading-tight">
                          {list.name}
                        </p>
                        {/* System list badge */}
                        {list.is_system && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gold/70 bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full leading-none shrink-0">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Auto
                          </span>
                        )}
                        {/* Contact count badge */}
                        <span className="text-[11px] text-gray-500 font-medium bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-full leading-none shrink-0">
                          {list.contact_count === 0
                            ? "empty"
                            : `${list.contact_count} contact${list.contact_count !== 1 ? "s" : ""}`}
                        </span>
                        {/* Updated date */}
                        <span className="text-[11px] text-gray-600 leading-none shrink-0">
                          {relativeDate(list.updated_at)}
                        </span>
                      </div>

                      {/* Tags */}
                      {list.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {list.tags.map((tag) => (
                            <TagPill key={tag} tag={tag} />
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {list.description && (
                        <p className="text-gray-500 text-xs mt-1.5 truncate">{list.description}</p>
                      )}
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {!list.is_system && (
                      <button
                        onClick={() => { setError(null); setEditingList(list) }}
                        className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-colors font-medium"
                        title="Edit list"
                      >
                        Edit
                      </button>
                      )}
                      {list.contact_count > 0 && (
                        <button
                          onClick={() => handleExportList(list.id, list.name)}
                          disabled={exportingListId === list.id}
                          className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-colors font-medium disabled:opacity-40"
                          title="Export list to CSV"
                        >
                          {exportingListId === list.id ? "…" : "Export"}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${list.name}"? This cannot be undone.`)) {
                            deleteList(list.id)
                          }
                        }}
                        disabled={deletingId === list.id || list.is_system}
                        className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${list.is_system ? "hidden" : "text-gray-500 hover:text-red-400 hover:bg-red-400/[0.06] disabled:opacity-40"}`}
                        title="Delete list"
                      >
                        {deletingId === list.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })() : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No lists yet</p>
          <p className="text-sm mb-4">Create a list to save and organise contacts</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
          >
            Create your first list
          </button>
        </div>
      )}
    </div>
  )
}
