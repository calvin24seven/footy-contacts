"use client"

import { useState } from "react"

// Keys must match ROLE_BY_GOAL keys in suggestions.ts exactly.
const LOOKING_FOR = [
  "Scouts",
  "Agents / Representatives",
  "Club contacts",
  "Coaching staff",
  "Academy contacts",
  "Media / Press contacts",
  "Trials / Opportunities",
  "Job openings",
]

export default function StepWhat({
  onNext,
  onSkip,
}: {
  onNext: (goals: string[]) => void
  onSkip: () => void
}) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(goal: string) {
    setSelected((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    )
  }

  return (
    <div className="bg-navy-light border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-2xl">
      <h2 className="text-white text-xl font-bold mb-1.5">
        What are you looking for?
      </h2>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        Select all that apply. We&apos;ll suggest relevant searches.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-7">
        {LOOKING_FOR.map((goal) => (
          <button
            key={goal}
            type="button"
            onClick={() => toggle(goal)}
            className={`py-2.5 px-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
              selected.includes(goal)
                ? "bg-gold text-navy-dark border-gold"
                : "bg-navy/60 border-white/[0.08] text-white hover:border-gold/50 hover:bg-navy"
            }`}
          >
            {goal}
          </button>
        ))}
      </div>

      <button
        onClick={() => onNext(selected)}
        className="w-full py-3.5 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors text-sm mb-3"
      >
        Continue →
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-1"
      >
        Skip this step →
      </button>
    </div>
  )
}
