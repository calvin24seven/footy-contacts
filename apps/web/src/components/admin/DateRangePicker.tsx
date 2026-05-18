"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export type DatePreset = "7d" | "30d" | "90d" | "12m" | "today" | "yesterday" | "mtd"

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d",        label: "Last 7 days" },
  { value: "30d",       label: "Last 30 days" },
  { value: "90d",       label: "Last 90 days" },
  { value: "mtd",       label: "Month to date" },
  { value: "12m",       label: "Last 12 months" },
]

export function getDateRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const today = fmt(now)

  switch (preset) {
    case "today":
      return { from: today, to: today }
    case "yesterday": {
      const y = new Date(now); y.setDate(now.getDate() - 1)
      const ys = fmt(y)
      return { from: ys, to: ys }
    }
    case "7d": {
      const f = new Date(now); f.setDate(now.getDate() - 6)
      return { from: fmt(f), to: today }
    }
    case "30d": {
      const f = new Date(now); f.setDate(now.getDate() - 29)
      return { from: fmt(f), to: today }
    }
    case "90d": {
      const f = new Date(now); f.setDate(now.getDate() - 89)
      return { from: fmt(f), to: today }
    }
    case "mtd": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: fmt(f), to: today }
    }
    case "12m": {
      const f = new Date(now); f.setFullYear(now.getFullYear() - 1); f.setDate(f.getDate() + 1)
      return { from: fmt(f), to: today }
    }
  }
}

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
      {PRESETS.map((p) => (
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

/** Resolve from/to strings from searchParams (preset takes priority) */
export function resolveDateRange(params: {
  preset?: string
  from?: string
  to?: string
}): { from: string; to: string; preset: DatePreset } {
  const preset = (params.preset ?? "30d") as DatePreset
  const range  = getDateRange(preset)
  return {
    preset,
    from: params.from ?? range.from,
    to:   params.to   ?? range.to,
  }
}
