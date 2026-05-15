import Link from "next/link"
import type { SearchSuggestion } from "@/lib/onboarding/suggestions"

export default function SuggestedSearches({ suggestions }: { suggestions: SearchSuggestion[] }) {
  if (!suggestions.length) return null

  return (
    <div className="mx-4 mt-3 mb-0 px-4 py-3 bg-navy-light/50 border border-white/[0.06] rounded-xl">
      <p className="text-xs text-gray-500 mb-2.5">Suggested searches based on your profile</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="text-xs px-3 py-1.5 rounded-full bg-navy border border-navy-light text-gray-300 hover:border-gold/50 hover:text-gold transition-colors"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
