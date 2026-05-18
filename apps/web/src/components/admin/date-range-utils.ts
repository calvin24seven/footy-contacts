// Server-safe date range utilities — no "use client" boundary

export type DatePreset = "7d" | "30d" | "90d" | "12m" | "today" | "yesterday" | "mtd"

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
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
