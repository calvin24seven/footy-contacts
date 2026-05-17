"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface TeamMember {
  id: string
  invite_email: string
  user_id: string | null
  role: "owner" | "member"
  status: "pending" | "active" | "removed"
  invited_at: string
  joined_at: string | null
}

interface Team {
  id: string
  name: string | null
  seat_limit: number
  owner_user_id: string
  team_members: TeamMember[]
}

interface TeamData {
  team: Team | null
  role: "owner" | "member" | null
}

export default function TeamClient() {
  const [data, setData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const load = useCallback(async () => {
    const res = await fetch("/api/team")
    if (res.ok) {
      const json = await res.json() as TeamData
      setData(json)
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError(null)
    setSuccess(null)

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    })
    const json = await res.json() as { error?: string; success?: boolean }

    if (!res.ok) {
      const messages: Record<string, string> = {
        agency_plan_required: "Team seats require the Agency plan.",
        seat_limit_reached:   "You've reached your seat limit. Buy more seats to invite more people.",
        already_member:       "This person is already on your team.",
        already_invited:      "An invite has already been sent to this address.",
        cannot_invite_self:   "You cannot invite yourself.",
      }
      setError(messages[json.error ?? ""] ?? "Something went wrong.")
    } else {
      setSuccess(`Invite sent to ${inviteEmail.trim()}`)
      setInviteEmail("")
      void load()
    }
    setInviting(false)
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this team member?")) return
    const res = await fetch(`/api/team/members/${memberId}`, { method: "DELETE" })
    if (res.ok) {
      void load()
    } else {
      const json = await res.json() as { error?: string }
      setError(json.error ?? "Failed to remove member.")
    }
  }

  async function handleBuySeats() {
    const res = await fetch("/api/team/seats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ additionalSeats: 1 }),
    })
    const json = await res.json() as { url?: string; error?: string }
    if (json.url) {
      router.push(json.url)
    } else if (json.error === "seats_contact_support") {
      setError("To add seats, please contact support@footycontacts.com")
    } else {
      setError(json.error ?? "Failed to start checkout.")
    }
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-white/[0.04] rounded-xl" />
  }

  if (!data?.team) {
    return (
      <div className="bg-navy-light border border-white/[0.05] rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-1">Team management is available on the Agency plan.</p>
        <a href="/app/billing" className="text-gold text-sm hover:underline">Upgrade to Agency →</a>
      </div>
    )
  }

  const { team, role } = data
  const members = team.team_members?.filter((m) => m.status !== "removed") ?? []
  const activeCount = members.filter((m) => m.status === "active").length
  const pendingCount = members.filter((m) => m.status === "pending").length
  const usedSeats = activeCount + pendingCount
  const seatPct = Math.min(100, (usedSeats / team.seat_limit) * 100)

  return (
    <div className="space-y-6">
      {/* Seat usage */}
      <div className="bg-navy-light border border-white/[0.05] rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">Team seats</p>
          <p className="text-sm text-white font-medium">
            {usedSeats} / {team.seat_limit} used
          </p>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${seatPct >= 100 ? "bg-red-500" : "bg-gold"}`}
            style={{ width: `${seatPct}%` }}
          />
        </div>
        {role === "owner" && (
          <button
            onClick={handleBuySeats}
            className="mt-3 text-xs text-gold hover:underline cursor-pointer"
          >
            + Add more seats
          </button>
        )}
      </div>

      {/* Member list */}
      <div className="bg-navy-light border border-white/[0.05] rounded-xl divide-y divide-white/[0.04]">
        <div className="px-5 py-4">
          <h2 className="text-white font-semibold text-sm">Members</h2>
        </div>

        {members.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            No team members yet. Invite someone below.
          </div>
        )}

        {members.map((m) => (
          <div key={m.id} className="px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-gray-400 font-semibold shrink-0">
              {m.invite_email[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{m.invite_email}</p>
              <p className="text-xs text-gray-500 capitalize">{m.status}</p>
            </div>
            {role === "owner" && m.role !== "owner" && (
              <button
                onClick={() => handleRemove(m.id)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite form — owner only */}
      {role === "owner" && (
        <form onSubmit={handleInvite} className="bg-navy-light border border-white/[0.05] rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-3">Invite a team member</h2>
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@agency.com"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="px-4 py-2 bg-gold text-[#080c17] rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {inviting ? "Sending…" : "Invite"}
            </button>
          </div>
          {error  && <p className="text-red-400 text-xs mt-2">{error}</p>}
          {success && <p className="text-emerald-400 text-xs mt-2">{success}</p>}
        </form>
      )}
    </div>
  )
}
