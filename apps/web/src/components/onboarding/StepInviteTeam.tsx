"use client"

import { useState } from "react"

interface StepInviteTeamProps {
  onNext: (emails: string[]) => void
  onSkip: () => void
  loading?: boolean
}

export default function StepInviteTeam({ onNext, onSkip, loading }: StepInviteTeamProps) {
  const [emails, setEmails] = useState(["", "", ""])

  function setEmail(index: number, value: string) {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)))
  }

  const validEmails = emails.map((e) => e.trim()).filter((e) => e.includes("@"))
  const canContinue = validEmails.length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (canContinue) onNext(validEmails)
  }

  return (
    <div>
      <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">
        Invite your team
      </h2>
      <p className="text-gray-400 text-sm mb-1 leading-relaxed">
        On the Agency plan, you can share access with your team.
        Enter their email addresses to send invites now.
      </p>
      <p className="text-gray-600 text-xs mb-8">
        Team invites require the Agency plan. You can always invite people later from&nbsp;
        <a href="/app/team" className="text-gold hover:underline">Team settings</a>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 mb-5">
        {emails.map((email, i) => (
          <div key={i}>
            <label className="text-xs text-gray-500 mb-1 block">
              Email {i + 1}{i === 0 ? "" : " (optional)"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(i, e.target.value)}
              placeholder="colleague@agency.com"
              className="w-full px-4 py-3 rounded-xl bg-navy border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={!canContinue || loading}
          className="w-full py-4 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors text-base disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Sending invites…" : "Invite & Continue →"}
        </button>
      </form>

      <button
        type="button"
        onClick={onSkip}
        disabled={loading}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Skip for now
      </button>
    </div>
  )
}
