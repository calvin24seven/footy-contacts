import Link from "next/link"

interface EmptyStateProps {
  query?: string
}

export default function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {/* Icon */}
      <div className="w-14 h-14 rounded-full bg-navy-light flex items-center justify-center mx-auto mb-5">
        <svg
          className="w-7 h-7 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Heading */}
      <p className="text-white font-semibold text-lg mb-1.5">
        {query ? (
          <>No contacts found for &ldquo;{query}&rdquo;</>
        ) : (
          "No contacts found"
        )}
      </p>

      {/* Suggestions */}
      <ul className="text-gray-400 text-sm space-y-1 mb-7 inline-block text-left">
        <li className="flex items-start gap-2">
          <span className="text-gray-600 mt-0.5" aria-hidden="true">•</span>
          Try removing a filter
        </li>
        <li className="flex items-start gap-2">
          <span className="text-gray-600 mt-0.5" aria-hidden="true">•</span>
          Search a broader term
        </li>
        <li className="flex items-start gap-2">
          <span className="text-gray-600 mt-0.5" aria-hidden="true">•</span>
          Check for spelling variations
        </li>
      </ul>

      {/* Clear action */}
      <div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-light text-gold rounded-lg text-sm font-medium hover:bg-navy transition-colors"
        >
          Clear search
        </Link>
      </div>
    </div>
  )
}
