"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/database.types"

type ListRow = Tables<"lists">

interface Props {
  initialLists: ListRow[]
}

export default function ListsClient({ initialLists }: Props) {
  const [lists, setLists] = useState<ListRow[]>(initialLists)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function createList(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: err } = await supabase
      .from("lists")
      .insert({ name: newName.trim(), description: newDesc.trim() || null, user_id: user.id })
      .select("*")
      .single()

    if (err) {
      setError(err.message)
    } else if (data) {
      setLists((prev) => [data, ...prev])
      setNewName("")
      setNewDesc("")
      setShowCreate(false)
    }
    setCreating(false)
  }

  async function renameList(id: string) {
    if (!renameValue.trim()) return
    setError(null)

    const { error: err } = await supabase
      .from("lists")
      .update({ name: renameValue.trim() })
      .eq("id", id)

    if (err) {
      setError(err.message)
    } else {
      setLists((prev) =>
        prev.map((l) => (l.id === id ? { ...l, name: renameValue.trim() } : l))
      )
      setRenamingId(null)
    }
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

  function startRename(list: ListRow) {
    setRenamingId(list.id)
    setRenameValue(list.name)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Lists</h1>
          <p className="text-gray-400 text-sm">Organise contacts into lists</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
        >
          + New list
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-navy-light rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-4">Create new list</h2>
            <form onSubmit={createList} className="space-y-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="List name"
                required
                className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create list"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName(""); setNewDesc("") }}
                  className="px-5 py-2 bg-navy text-gray-300 rounded-lg hover:bg-navy-dark transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && !showCreate && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {lists.length > 0 ? (
        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list.id} className="bg-navy-light rounded-xl px-5 py-4">
              {renamingId === list.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameList(list.id)
                      if (e.key === "Escape") setRenamingId(null)
                    }}
                    className="flex-1 px-3 py-1.5 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold text-sm"
                  />
                  <button
                    onClick={() => renameList(list.id)}
                    className="px-3 py-1.5 bg-gold text-navy rounded-lg text-sm font-medium hover:bg-gold-dark"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setRenamingId(null)}
                    className="px-3 py-1.5 text-gray-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Link href={`/app/lists/${list.id}`} className="flex-1 min-w-0">
                    <p className="text-white font-medium hover:text-gold transition-colors">
                      {list.name}
                    </p>
                    {list.description && (
                      <p className="text-gray-400 text-sm mt-0.5 truncate">{list.description}</p>
                    )}
                  </Link>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <button
                      onClick={() => startRename(list)}
                      className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors text-xs"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${list.name}"? This cannot be undone.`)) {
                          deleteList(list.id)
                        }
                      }}
                      disabled={deletingId === list.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors text-xs disabled:opacity-40"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
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
