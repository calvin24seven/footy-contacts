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
    <>
      <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
        What&apos;s your role<br />in football?
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        We&apos;ll surface the contacts most relevant to you.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-8">
        {USER_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setSelected(t.value)}
            className={`py-3.5 px-4 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
              selected === t.value
                ? "bg-gold text-navy-dark border-gold"
                : "bg-white/[0.04] border-white/[0.08] text-white/80 hover:border-gold/40 hover:bg-white/[0.06]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        disabled={!selected}
        onClick={() => selected && onNext(selected)}
        className="w-full py-4 bg-gold text-navy-dark font-bold rounded-2xl hover:bg-gold-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[15px]"
      >
        Continue
      </button>
    </>
  )
}
