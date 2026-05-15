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
    <div className="text-center">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
        <svg
          className="w-8 h-8 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-white text-2xl font-bold mb-3">
        Your access is ready.
      </h2>
      <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-xs mx-auto">
        Based on your answers, here are your first suggested searches.
      </p>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {suggestions.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="px-4 py-2 bg-gold/10 border border-gold/25 text-gold text-sm font-medium rounded-full hover:bg-gold/20 transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mb-8" />
      )}

      <button
        onClick={onGoToSearch}
        className="w-full max-w-xs mx-auto block py-4 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors text-sm"
      >
        Go to search →
      </button>
    </div>
  )
}
