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
    <div className="bg-navy-light border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-2xl">
      <h2 className="text-white text-xl font-bold mb-1.5">
        Which region matters most to you?
      </h2>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        We&apos;ll prioritise contacts from your region.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`py-2.5 px-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
              region === r
                ? "bg-gold text-navy-dark border-gold"
                : "bg-navy/60 border-white/[0.08] text-white hover:border-gold/50 hover:bg-navy"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mb-7">
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Your country (optional)
        </label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="e.g. England, Nigeria, France"
          className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-white/10 focus:outline-none focus:border-gold/60 placeholder-gray-600 text-sm transition-colors"
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
        className="w-full py-3.5 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm mb-3"
      >
        {loading ? "Saving…" : "Continue →"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onSkip}
        className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-1 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Skip this step →
      </button>
    </div>
  )
}
