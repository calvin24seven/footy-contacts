import Link from "next/link"
import { buildBreadcrumbSchema } from "@footy/seo"
import type { BreadcrumbItem } from "@footy/seo"

interface BreadcrumbProps {
  items: BreadcrumbItem[] // [{ name, url }] — first item is always Home
}

/** Renders a visual breadcrumb trail + injects BreadcrumbList JSON-LD. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  const schema = buildBreadcrumbSchema(items)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-400">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1
            return (
              <li key={item.url} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <svg
                    className="w-3 h-3 text-gray-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {isLast ? (
                  <span className="text-gray-300 font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-[#F9D783] transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
