"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { DATE_PRESETS, type DatePreset } from "./date-range-utils"

export type { DatePreset }
export { getDateRange, resolveDateRange } from "./date-range-utils"

interface Props {
  preset: DatePreset
  from?: string
  to?: string
}

export default function DateRangePicker({ preset, from, to }: Props) {
  const router    = useRouter()
  const pathname  = usePathname()
  const searchParams = useSearchParams()

  const navigate = useCallback(
    (newPreset: DatePreset, customFrom?: string, customTo?: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("preset", newPreset)
      if (customFrom) params.set("from", customFrom)
      else params.delete("from")
      if (customTo) params.set("to", customTo)
      else params.delete("to")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {DATE_PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => navigate(p.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            preset === p.value
              ? "bg-gold text-navy"
              : "bg-navy-light text-gray-400 hover:text-white hover:bg-navy"
          }`}
        >
          {p.label}
        </button>
      ))}
      {/* Custom range */}
      <div className="flex items-center gap-1 ml-2">
        <input
          type="date"
          defaultValue={from}
          max={to}
          onChange={(e) => navigate("7d", e.target.value, to)}
          className="bg-navy-light border border-navy text-gray-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-gold"
        />
        <span className="text-gray-500 text-xs">→</span>
        <input
          type="date"
          defaultValue={to}
          min={from}
          onChange={(e) => navigate("7d", from, e.target.value)}
          className="bg-navy-light border border-navy text-gray-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-gold"
        />
      </div>
    </div>
  )
}


