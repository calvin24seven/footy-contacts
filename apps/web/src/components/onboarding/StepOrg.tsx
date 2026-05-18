"use client"

import { useState } from "react"

const LABEL_BY_TYPE: Record<string, string> = {
  agent:  "What's the name of your agency or company?",
  scout:  "Which organisation do you represent?",
  coach:  "Which club or organisation are you with?",
  club:   "What's the name of your club or organisation?",
  media:  "Which company or publication are you with?",
  player: "Which club are you with?",
  parent: "Which club is your child with?",
  other:  "Which organisation are you with?",
}

const PLACEHOLDER_BY_TYPE: Record<string, string> = {
  agent:  "e.g. Elite Sports Group, Stellar Football",
  scout:  "e.g. Manchester City, Brentford FC",
  coach:  "e.g. Stoke City Academy, AFC Bournemouth",
  club:   "e.g. Crystal Palace FC, FC Dallas",
  media:  "e.g. The Athletic, Sky Sports",
  player: "e.g. Your current club",
  parent: "e.g. Your child's club",
  other:  "e.g. Your organisation",
}

export default function StepOrg({
  userType,
  onNext,
  onSkip,
}: {
  userType?: string
  onNext: (club: string) => void
  onSkip: () => void
}) {
  const [value, setValue] = useState("")
  const trimmed = value.trim()

  const label = LABEL_BY_TYPE[userType ?? ""] ?? "Which club or agency are you with?"
  const placeholder = PLACEHOLDER_BY_TYPE[userType ?? ""] ?? "Organisation name"

  return (
    <>
      <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
        {label}
      </h2>
      <p className="text-gray-500 text-sm mb-10">
        Optional — you can update this from your profile anytime.
      </p>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        autoComplete="organization"
        className="w-full px-0 py-3 bg-transparent text-white text-xl border-b border-white/20 focus:outline-none focus:border-gold/70 placeholder-gray-600 transition-colors mb-12"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (trimmed) onNext(trimmed)
            else onSkip()
          }
        }}
      />

      <button
        onClick={() => { if (trimmed) onNext(trimmed); else onSkip() }}
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
