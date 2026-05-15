"use client"

import { useState } from "react"

// Keys must match the ROLE_BY_USER_TYPE keys in suggestions.ts exactly.
const USER_TYPES = [
  { value: "player",  label: "Player" },
  { value: "agent",   label: "Agent / Representative" },
  { value: "scout",   label: "Scout / Recruiter" },
  { value: "coach",   label: "Coach / Manager" },
  { value: "club",    label: "Club / Academy Staff" },
  { value: "media",   label: "Media / Journalist" },
  { value: "parent",  label: "Parent / Guardian" },
  { value: "other",   label: "Other" },
]

export default function StepWho({
  onNext,
}: {
  onNext: (userType: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="bg-navy-light border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-2xl">
      <h2 className="text-white text-xl font-bold mb-1.5">
        What best describes you?
      </h2>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        We&apos;ll use this to surface the most relevant contacts and opportunities.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-7">
        {USER_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setSelected(t.value)}
            className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
              selected === t.value
                ? "bg-gold text-navy-dark border-gold"
                : "bg-navy/60 border-white/[0.08] text-white hover:border-gold/50 hover:bg-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        disabled={!selected}
        onClick={() => selected && onNext(selected)}
        className="w-full py-3.5 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        Continue →
      </button>
    </div>
  )
}
