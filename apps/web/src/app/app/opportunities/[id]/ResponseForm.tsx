"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  opportunityId: string
  defaultValues: {
    full_name?: string | null
    football_level?: string | null
    position?: string | null
    city?: string | null
    country?: string | null
    current_club?: string | null
  } | null
}

export default function ResponseForm({ opportunityId, defaultValues }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: defaultValues?.full_name ?? "",
    level: defaultValues?.football_level ?? "",
    location: [defaultValues?.city, defaultValues?.country].filter(Boolean).join(", "),
    position: defaultValues?.position ?? "",
    current_club: defaultValues?.current_club ?? "",
    age: "",
    message: "",
    highlight_video_url: "",
  })

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: form.age ? parseInt(form.age, 10) : null,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Submission failed. Please try again.")
        return
      }

      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-navy-light rounded-xl p-6">
      <h2 className="text-white font-semibold text-lg mb-5">Apply for this Opportunity</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name *">
          <input
            required
            className="input-field"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Football Level *">
            <input
              required
              className="input-field"
              value={form.level}
              onChange={(e) => set("level", e.target.value)}
              placeholder="e.g. Semi-pro, Amateur"
            />
          </Field>
          <Field label="Position">
            <input
              className="input-field"
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="e.g. Midfielder"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location *">
            <input
              required
              className="input-field"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City, Country"
            />
          </Field>
          <Field label="Age">
            <input
              type="number"
              min={10}
              max={100}
              className="input-field"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              placeholder="e.g. 24"
            />
          </Field>
        </div>

        <Field label="Current Club">
          <input
            className="input-field"
            value={form.current_club}
            onChange={(e) => set("current_club", e.target.value)}
            placeholder="Your current team"
          />
        </Field>

        <Field label="Highlight Video URL">
          <input
            type="url"
            className="input-field"
            value={form.highlight_video_url}
            onChange={(e) => set("highlight_video_url", e.target.value)}
            placeholder="YouTube, Hudl, Wyscout link…"
          />
        </Field>

        <Field label="Message *">
          <textarea
            required
            rows={4}
            className="input-field resize-none"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Tell them why you're a great fit…"
          />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gold text-navy font-semibold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
