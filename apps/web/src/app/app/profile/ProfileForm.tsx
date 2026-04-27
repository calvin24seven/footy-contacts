"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  profile: {
    full_name: string | null
    first_name: string | null
    last_name: string | null
    username: string | null
    avatar_url: string | null
    user_type: string | null
    country: string | null
    city: string | null
    football_level: string | null
    position: string | null
    current_club: string | null
    player_age_group: string | null
    open_to_opportunities: string | null
    highlight_video_url: string | null
    email: string | null
  } | null
  userEmail: string
}

const USER_TYPES = [
  { label: "Player", value: "player" },
  { label: "Agent", value: "agent" },
  { label: "Scout", value: "scout" },
  { label: "Club Official", value: "club official" },
  { label: "Coach", value: "coach" },
  { label: "Other", value: "other" },
]

const FOOTBALL_LEVELS = [
  { label: "Amateur", value: "amateur" },
  { label: "Semi-Professional", value: "semi-professional" },
  { label: "Professional", value: "professional" },
  { label: "International", value: "international" },
]

const AGE_GROUPS = [
  { label: "Under 16", value: "under-16" },
  { label: "Under 18", value: "under-18" },
  { label: "Under 21", value: "under-21" },
  { label: "Senior", value: "senior" },
  { label: "Over 35", value: "over-35" },
]

export default function ProfileForm({ profile, userEmail }: Props) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    username: profile?.username ?? "",
    avatar_url: profile?.avatar_url ?? "",
    user_type: profile?.user_type ?? "",
    country: profile?.country ?? "",
    city: profile?.city ?? "",
    football_level: profile?.football_level ?? "",
    position: profile?.position ?? "",
    current_club: profile?.current_club ?? "",
    player_age_group: profile?.player_age_group ?? "",
    open_to_opportunities: profile?.open_to_opportunities ?? "",
    highlight_video_url: profile?.highlight_video_url ?? "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        username: form.username || null,
        avatar_url: form.avatar_url || null,
        user_type: form.user_type || null,
        country: form.country || null,
        city: form.city || null,
        football_level: form.football_level || null,
        position: form.position || null,
        current_club: form.current_club || null,
        player_age_group: form.player_age_group || null,
        open_to_opportunities: form.open_to_opportunities || null,
        highlight_video_url: form.highlight_video_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (await supabase.auth.getUser()).data.user!.id)

    setSaving(false)
    if (err) {
      setError("Failed to save. Please try again.")
    } else {
      setSuccess(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Account</h2>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Email</label>
          <input
            type="email"
            value={userEmail}
            disabled
            className="input-base opacity-50 cursor-not-allowed"
          />
          <p className="text-gray-500 text-xs mt-1">
            To change your email or password, go to{" "}
            <a href="/app/settings" className="text-gold hover:underline">Settings</a>.
          </p>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="input-base w-full"
            placeholder="e.g. johnsmith"
          />
        </div>
      </div>

      {/* Personal details */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Personal details</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">First name</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="input-base w-full"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Last name</label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className="input-base w-full"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Display name</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="input-base w-full"
            placeholder="How your name appears in the app"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Avatar URL</label>
          <input
            type="url"
            name="avatar_url"
            value={form.avatar_url}
            onChange={handleChange}
            className="input-base w-full"
            placeholder="https://example.com/photo.jpg"
          />
          {form.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.avatar_url}
              alt="avatar preview"
              className="mt-2 w-12 h-12 rounded-full object-cover border border-navy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="input-base w-full"
              placeholder="e.g. London"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="input-base w-full"
              placeholder="e.g. England"
            />
          </div>
        </div>
      </div>

      {/* Football profile */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Football profile</h2>

        <div>
          <label className="block text-gray-400 text-xs mb-1">I am a…</label>
          <select
            name="user_type"
            value={form.user_type}
            onChange={handleChange}
            className="input-base w-full"
          >
            <option value="">Select type</option>
            {USER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Football level</label>
            <select
              name="football_level"
              value={form.football_level}
              onChange={handleChange}
              className="input-base w-full"
            >
              <option value="">Select level</option>
              {FOOTBALL_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Age group</label>
            <select
              name="player_age_group"
              value={form.player_age_group}
              onChange={handleChange}
              className="input-base w-full"
            >
              <option value="">Select age group</option>
              {AGE_GROUPS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Position</label>
            <input
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
              className="input-base w-full"
              placeholder="e.g. Midfielder"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Current club</label>
            <input
              type="text"
              name="current_club"
              value={form.current_club}
              onChange={handleChange}
              className="input-base w-full"
              placeholder="e.g. Arsenal FC"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Open to opportunities</label>
          <select
            name="open_to_opportunities"
            value={form.open_to_opportunities}
            onChange={handleChange}
            className="input-base w-full"
          >
            <option value="">Not specified</option>
            <option value="yes">Yes — actively looking</option>
            <option value="open">Open — willing to consider</option>
            <option value="no">No — not currently looking</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Highlight video URL</label>
          <input
            type="url"
            name="highlight_video_url"
            value={form.highlight_video_url}
            onChange={handleChange}
            className="input-base w-full"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">Profile saved successfully.</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  )
}
