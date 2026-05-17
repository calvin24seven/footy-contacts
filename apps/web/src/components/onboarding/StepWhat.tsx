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
    <>
      <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
        What are you<br />here to do?
      </h2>
      <p className="text-gray-500 text-sm mb-8">Select all that apply.</p>

      <div className="grid grid-cols-2 gap-2 mb-8">
        {LOOKING_FOR.map((goal) => (
          <button
            key={goal}
            type="button"
            onClick={() => toggle(goal)}
            className={`py-3 px-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
              selected.includes(goal)
                ? "bg-gold text-navy-dark border-gold"
                : "bg-white/[0.04] border-white/[0.08] text-white/80 hover:border-gold/40 hover:bg-white/[0.06]"
            }`}
          >
            {goal}
          </button>
        ))}
      </div>

      <button
        onClick={() => onNext(selected)}
        className="w-full py-4 bg-gold text-navy-dark font-bold rounded-2xl hover:bg-gold-dark transition-colors text-[15px] mb-3"
      >
        Continue
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
      >
        Skip
      </button>
    </>
  )
}
