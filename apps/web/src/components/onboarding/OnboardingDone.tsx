import Link from "next/link"
import type { SearchSuggestion } from "@/lib/onboarding/suggestions"

export default function OnboardingDone({
  suggestions,
  onGoToSearch,
}: {
  suggestions: SearchSuggestion[]
  onGoToSearch: () => void
}) {
  return (
    <div className="step-animate flex flex-col justify-center min-h-[calc(100vh-56px)] px-8 max-w-lg mx-auto">
      <div className="mb-12">
        <div className="w-8 h-[2px] bg-gold mb-10" />
        <h2 className="text-white text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-4">
          You&apos;re in.
        </h2>
        <p className="text-gray-400 text-base leading-relaxed">
          {suggestions.length > 0
            ? "Based on your answers, here\u2019s where to start."
            : "Start searching the network."}
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {suggestions.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] text-white/80 text-sm font-medium rounded-xl hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={onGoToSearch}
        className="w-full py-4 bg-gold text-navy-dark font-bold rounded-2xl hover:bg-gold-dark transition-colors text-[15px]"
      >
        Start searching
      </button>
    </div>
  )
}

