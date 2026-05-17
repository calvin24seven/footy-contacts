"use client"

import { useState } from "react"

const REGIONS = [
  "United Kingdom",
  "Europe",
  "Africa",
  "North America",
  "South America",
  "Middle East",
  "Asia / Oceania",
  "Worldwide",
]

export default function StepWhere({
  onNext,
  onSkip,
  loading,
  error,
}: {
  onNext: (region: string | undefined, country: string | undefined) => void
  onSkip: () => void
  loading: boolean
  error: string | null
}) {
  const [region, setRegion] = useState<string | null>(null)
  const [country, setCountry] = useState("")

  return (
    <>
      <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
        Where&apos;s your<br />football world?
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        We&apos;ll prioritise contacts from your region.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`py-3.5 px-4 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
              region === r
                ? "bg-gold text-navy-dark border-gold"
                : "bg-white/[0.04] border-white/[0.08] text-white/80 hover:border-gold/40 hover:bg-white/[0.06]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Your country (optional)"
          className="w-full px-0 py-2.5 bg-transparent text-white border-b border-white/15 focus:outline-none focus:border-gold/60 placeholder-gray-600 text-sm transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
          {error}
        </p>
      )}

      <button
        disabled={loading}
        onClick={() =>
          onNext(region ?? undefined, country.trim() || undefined)
        }
        className="w-full py-4 bg-gold text-navy-dark font-bold rounded-2xl hover:bg-gold-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-[15px] mb-3"
      >
        {loading ? "Setting up your access..." : "Finish"}
      </button>
      <button
        type="button"
        onClick={onSkip}
        disabled={loading}
        className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-400 disabled:opacity-40 transition-colors"
      >
        Skip
      </button>
    </>
  )
}
