"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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

interface Props {
  listId: string
  listName: string
  listDescription: string | null
  listTags: string[]
}

export default function EditListButton({ listId, listName, listDescription, listTags }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(listName)
  const [desc, setDesc] = useState(listDescription ?? "")
  const [tags, setTags] = useState<string[]>(listTags)
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  function openModal() {
    setName(listName)
    setDesc(listDescription ?? "")
    setTags(listTags)
    setTagInput("")
    setError(null)
    setOpen(true)
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || tags.length >= 3 || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setTagInput("")
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from("lists")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ name: name.trim(), description: desc.trim() || null, tags } as any)
      .eq("id", listId)
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={openModal}
        className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/[0.06] hover:text-white transition-colors"
      >
        Edit list
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-navy-light border border-white/[0.07] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Edit list</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">List name *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What's this list for?"
                  className="w-full px-3 py-2.5 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Tags <span className="text-gray-600">(up to 3)</span>
                </label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag) => (
                      <TagPill key={tag} tag={tag} onRemove={() => removeTag(tag)} />
                    ))}
                  </div>
                )}
                {tags.length < 3 && (
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addTag() }
                      }}
                      placeholder="Add a tag…"
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
                  disabled={saving || !name.trim()}
                  className="flex-1 py-2.5 bg-gold text-navy rounded-lg font-semibold text-sm hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 bg-navy text-gray-300 rounded-lg text-sm hover:bg-navy-dark transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
