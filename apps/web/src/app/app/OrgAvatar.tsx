"use client"

const CATEGORY_COLORS: Record<string, string> = {
  "Agent":         "bg-purple-900/60 text-purple-300",
  "Scout":         "bg-blue-900/60 text-blue-300",
  "Coach":         "bg-teal-900/60 text-teal-300",
  "Club Official": "bg-gold/15 text-gold",
  "Club":          "bg-gold/15 text-gold",
  "Performance":   "bg-orange-900/60 text-orange-300",
  "Medical":       "bg-red-900/60 text-red-300",
  "Academy":       "bg-indigo-900/60 text-indigo-300",
  "Player":        "bg-emerald-900/60 text-emerald-300",
  "Media":         "bg-pink-900/60 text-pink-300",
  "Other":         "bg-gray-700 text-gray-300",
}

export default function OrgAvatar({
  name,
  category,
  logoUrl,
}: {
  name: string | null
  category: string | null
  logoUrl?: string | null
}) {
  const initials = name
    ? name.split(/[\s\-&]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : "?"
  const colorClass = CATEGORY_COLORS[category ?? ""] ?? "bg-navy text-gray-400 border border-gray-700"

  if (logoUrl) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white/5 overflow-hidden border border-gray-700/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={name ?? ""}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = "none"
            el.parentElement!.setAttribute("data-fallback", "1")
            el.parentElement!.className = `w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none ${colorClass}`
            el.parentElement!.textContent = initials.slice(0, 2)
          }}
        />
      </div>
    )
  }

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none ${colorClass}`}>
      {initials.slice(0, 2)}
    </div>
  )
}
