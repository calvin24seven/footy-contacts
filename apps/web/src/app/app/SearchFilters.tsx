"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useRef } from "react"

const MAX_VALUES = 5
const CATEGORIES = ["Agent", "Scout", "Coach", "Club Official", "Performance", "Medical", "Academy", "Player", "Media"]

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "recently_added", label: "Recently added" },
  { value: "recently_verified", label: "Recently verified" },
]

function parseCSV(s: string | null): string[] {
  if (!s?.trim()) return []
  return s.split(",").map((v) => v.trim()).filter(Boolean)
}

function toCSV(arr: string[]): string {
  return arr.join(",")
}

function emailStatusLabel(v: string): string {
  return (
    v === "has_email"  ? "Has email" :
    v === "verified"   ? "✓ Verified" :
    v === "catch_all"  ? "~ Catch-all" :
    v === "unknown"    ? "? Unknown" :
    v === "risky"      ? "⚠ Risky" :
    v === "unverified" ? "Unverified" :
    v === "no_email"   ? "No email" :
    v
  )
}


interface Props {
  countries: string[]
  currentSort?: string
}

export default function SearchFilters({ countries, currentSort = "name_asc" }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [showRoleExclude, setShowRoleExclude] = useState(false)
  const [showOrgExclude, setShowOrgExclude] = useState(false)

  // ── Active (URL) state ────────────────────────────────────────────────────
  const activeRole        = parseCSV(searchParams.get("role"))
  const activeRoleExclude = parseCSV(searchParams.get("role_exclude"))
  const activeOrg         = parseCSV(searchParams.get("org"))
  const activeOrgExclude  = parseCSV(searchParams.get("org_exclude"))
  const activeCity        = searchParams.get("city") ?? ""
  const activeCountry     = searchParams.get("country") ?? ""
  const activeEmailStatus = searchParams.get("email_status") ?? ""
  const activeCategory    = searchParams.get("category") ?? ""
  const activeHasPhone    = searchParams.get("has_phone") ?? ""
  const activeSort        = searchParams.get("sort") ?? currentSort

  const activeCount =
    activeRole.length + activeRoleExclude.length +
    activeOrg.length  + activeOrgExclude.length  +
    [activeCity, activeCountry, activeEmailStatus, activeCategory, activeHasPhone].filter(Boolean).length

  // ── Drawer staging state ──────────────────────────────────────────────────
  const [roleValues,   setRoleValues]   = useState<string[]>([])
  const [roleExcludes, setRoleExcludes] = useState<string[]>([])
  const [orgValues,    setOrgValues]    = useState<string[]>([])
  const [orgExcludes,  setOrgExcludes]  = useState<string[]>([])
  const [city,         setCity]         = useState("")
  const [country,      setCountry]      = useState("")
  const [emailStatus,  setEmailStatus]  = useState("")
  const [category,     setCategory]     = useState("")

  // Items shown in the active-filter summary at top of drawer (staged, not applied yet)
  type StagedItem = { key: string; value: string; display: string; variant: "include" | "exclude" }
  const stagedItems: StagedItem[] = [
    ...roleValues.map(v   => ({ key: "role",         value: v, display: v, variant: "include" as const })),
    ...roleExcludes.map(v => ({ key: "role_exclude", value: v, display: v, variant: "exclude" as const })),
    ...orgValues.map(v    => ({ key: "org",          value: v, display: v, variant: "include" as const })),
    ...orgExcludes.map(v  => ({ key: "org_exclude",  value: v, display: v, variant: "exclude" as const })),
    ...(city        ? [{ key: "city",         value: city,        display: `City: ${city}`,         variant: "include" as const }] : []),
    ...(country     ? [{ key: "country",      value: country,     display: country,                 variant: "include" as const }] : []),
    ...(emailStatus ? [{ key: "email_status", value: emailStatus, display: emailStatusLabel(emailStatus), variant: "include" as const }] : []),
    ...(category    ? [{ key: "category",     value: category,    display: category,                variant: "include" as const }] : []),
  ]

  function removeStagedItem(key: string, value: string) {
    if      (key === "role")         setRoleValues(p => p.filter(x => x !== value))
    else if (key === "role_exclude") setRoleExcludes(p => p.filter(x => x !== value))
    else if (key === "org")          setOrgValues(p => p.filter(x => x !== value))
    else if (key === "org_exclude")  setOrgExcludes(p => p.filter(x => x !== value))
    else if (key === "city")         setCity("")
    else if (key === "country")      setCountry("")
    else if (key === "email_status") setEmailStatus("")
    else if (key === "category")     setCategory("")
  }

  // ── URL helpers ───────────────────────────────────────────────────────────
  function buildParams(overrides: Record<string, string> = {}) {
    const p = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) p.set("q", q)
    const base: Record<string, string> = {
      role:         toCSV(activeRole),
      role_exclude: toCSV(activeRoleExclude),
      org:          toCSV(activeOrg),
      org_exclude:  toCSV(activeOrgExclude),
      city:         activeCity,
      country:      activeCountry,
      email_status: activeEmailStatus,
      category:     activeCategory,
      has_phone:    activeHasPhone,
      sort:         activeSort !== "name_asc" ? activeSort : "",
    }
    for (const [k, v] of Object.entries({ ...base, ...overrides })) {
      if (v) p.set(k, v); else p.delete(k)
    }
    p.delete("page")
    return p.toString()
  }

  function navigate(overrides: Record<string, string> = {}) {
    startTransition(() => router.replace(`/app?${buildParams(overrides)}`))
  }

  function handleOpen() {
    setRoleValues([...activeRole])
    setRoleExcludes([...activeRoleExclude])
    setOrgValues([...activeOrg])
    setOrgExcludes([...activeOrgExclude])
    setCity(activeCity)
    setCountry(activeCountry)
    setEmailStatus(activeEmailStatus)
    setCategory(activeCategory)
    setShowRoleExclude(activeRoleExclude.length > 0)
    setShowOrgExclude(activeOrgExclude.length > 0)
    setOpen(true)
  }

  function applyFilters() {
    const p = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) p.set("q", q)
    const roleCSV   = toCSV(roleValues)
    const roleExCSV = toCSV(roleExcludes)
    const orgCSV    = toCSV(orgValues)
    const orgExCSV  = toCSV(orgExcludes)
    if (roleCSV)        p.set("role",         roleCSV)
    if (roleExCSV)      p.set("role_exclude", roleExCSV)
    if (orgCSV)         p.set("org",          orgCSV)
    if (orgExCSV)       p.set("org_exclude",  orgExCSV)
    if (city)           p.set("city",         city)
    if (country)        p.set("country",      country)
    if (emailStatus)    p.set("email_status", emailStatus)
    if (category)       p.set("category",     category)
    if (activeHasPhone) p.set("has_phone",    activeHasPhone)
    if (activeSort && activeSort !== "name_asc") p.set("sort", activeSort)
    startTransition(() => router.replace(`/app?${p.toString()}`))
    setOpen(false)
  }

  function removeFilterValue(key: "role" | "role_exclude" | "org" | "org_exclude", value: string) {
    const map: Record<string, string[]> = {
      role: activeRole, role_exclude: activeRoleExclude,
      org:  activeOrg,  org_exclude:  activeOrgExclude,
    }
    navigate({ [key]: toCSV(map[key].filter(v => v !== value)) })
  }

  function removeSimpleFilter(key: string) {
    navigate({ [key]: "" })
  }

  function clearAll() {
    setRoleValues([]); setRoleExcludes([])
    setOrgValues([]);  setOrgExcludes([])
    setCity(""); setCountry(""); setEmailStatus(""); setCategory("")
    const p = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) p.set("q", q)
    startTransition(() => router.replace(`/app?${p.toString()}`))
    setOpen(false)
  }

  function toggleQuickChip(key: string, value: string) {
    const current = searchParams.get(key) ?? ""
    navigate({ [key]: current === value ? "" : value })
  }

  function handleSort(value: string) {
    navigate({ sort: value === "name_asc" ? "" : value })
  }

  return (
    <div className="mt-3">
      {/* ── Filters + quick chips row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {/* Filter drawer trigger */}
        <button
          onClick={open ? () => setOpen(false) : handleOpen}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            open || activeCount > 0
              ? "border-gold bg-gold/10 text-gold"
              : "border-gray-600 text-gray-400 hover:border-gray-400"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="bg-gold text-navy text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              {activeCount}
            </span>
          )}
        </button>

        {/* Quick chips */}
        <QuickChip label="Has email"  active={activeEmailStatus === "has_email"} onClick={() => toggleQuickChip("email_status", "has_email")} />
        <QuickChip label="✓ Verified" active={activeEmailStatus === "verified"}  onClick={() => toggleQuickChip("email_status", "verified")} />
        <QuickChip label="Has phone"  active={activeHasPhone === "1"}            onClick={() => toggleQuickChip("has_phone", "1")} />

        <span className="text-gray-700 shrink-0 hidden sm:inline">|</span>

        {/* Active multi-value role chips */}
        {activeRole.map(v => <Chip key={`r-${v}`} label={v} onRemove={() => removeFilterValue("role", v)} />)}
        {activeRoleExclude.map(v => <Chip key={`re-${v}`} label={v} variant="exclude" onRemove={() => removeFilterValue("role_exclude", v)} />)}

        {/* Active multi-value org chips */}
        {activeOrg.map(v => <Chip key={`o-${v}`} label={v} onRemove={() => removeFilterValue("org", v)} />)}
        {activeOrgExclude.map(v => <Chip key={`oe-${v}`} label={v} variant="exclude" onRemove={() => removeFilterValue("org_exclude", v)} />)}

        {/* Single-value chips */}
        {activeCity    && <Chip label={`City: ${activeCity}`} onRemove={() => removeSimpleFilter("city")} />}
        {activeCountry && <Chip label={activeCountry}         onRemove={() => removeSimpleFilter("country")} />}
        {activeEmailStatus && !["has_email", "verified"].includes(activeEmailStatus) && (
          <Chip label={emailStatusLabel(activeEmailStatus)} onRemove={() => removeSimpleFilter("email_status")} />
        )}
        {activeCategory && <Chip label={activeCategory} onRemove={() => removeSimpleFilter("category")} />}

        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-gray-500 hover:text-white transition-colors shrink-0 ml-1 cursor-pointer">
            Clear all
          </button>
        )}

        {isPending && <span className="text-xs text-gray-600 ml-1 shrink-0">Updating…</span>}

        {/* Sort — always visible, pushed to right */}
        <div className="ml-auto shrink-0 flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Sort:</span>
          <select
            value={activeSort}
            onChange={(e) => handleSort(e.target.value)}
            className="bg-navy-light text-gray-300 text-xs border border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Advanced filter drawer ─────────────────────────────────────────── */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Drawer
              Mobile  : fixed full-screen overlay, own scroll, sticky Apply bar
              Desktop : inline card below the filter row */}
          <div className="
            fixed inset-0 z-50 flex flex-col bg-navy overflow-hidden
            md:relative md:inset-auto md:z-auto md:flex-none md:overflow-visible
            md:mt-3 md:rounded-xl md:border md:border-gray-600/50 md:bg-navy-light
          ">
            {/* Mobile-only header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0 md:hidden">
              <span className="text-sm font-semibold text-white">Filters</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-navy-light transition-colors text-gray-400 hover:text-white cursor-pointer"
                aria-label="Close filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-6 md:p-5 space-y-5">

              {/* Active filter summary */}
              {stagedItems.length > 0 && (
                <div className="pb-4 border-b border-gray-700/50">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">Active filters</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stagedItems.map(item => (
                      <Chip
                        key={`${item.key}-${item.value}`}
                        label={item.display}
                        variant={item.variant}
                        onRemove={() => removeStagedItem(item.key, item.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Role includes + excludes */}
              <div>
                <ChipInput
                  label="Role includes"
                  values={roleValues}
                  onAdd={v => setRoleValues(p => [...p, v])}
                  onRemove={v => setRoleValues(p => p.filter(x => x !== v))}
                  placeholder="e.g. Head Coach, Scout… press Enter or Add"
                />
                {!showRoleExclude ? (
                  <button
                    type="button"
                    onClick={() => setShowRoleExclude(true)}
                    className="mt-2 text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Exclude roles
                  </button>
                ) : (
                  <div className="mt-3">
                    <ChipInput
                      label="Exclude roles"
                      variant="exclude"
                      values={roleExcludes}
                      onAdd={v => setRoleExcludes(p => [...p, v])}
                      onRemove={v => setRoleExcludes(p => p.filter(x => x !== v))}
                      placeholder="e.g. Intern, Volunteer…"
                    />
                  </div>
                )}
              </div>

              {/* Organisation includes + excludes */}
              <div>
                <ChipInput
                  label="Organisation includes"
                  values={orgValues}
                  onAdd={v => setOrgValues(p => [...p, v])}
                  onRemove={v => setOrgValues(p => p.filter(x => x !== v))}
                  placeholder="e.g. Arsenal, FIFA… press Enter or Add"
                />
                {!showOrgExclude ? (
                  <button
                    type="button"
                    onClick={() => setShowOrgExclude(true)}
                    className="mt-2 text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Exclude organisations
                  </button>
                ) : (
                  <div className="mt-3">
                    <ChipInput
                      label="Exclude organisations"
                      variant="exclude"
                      values={orgExcludes}
                      onAdd={v => setOrgExcludes(p => [...p, v])}
                      onRemove={v => setOrgExcludes(p => p.filter(x => x !== v))}
                      placeholder="e.g. Manchester City…"
                    />
                  </div>
                )}
              </div>

              {/* City + Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FilterInput
                  label="City"
                  value={city}
                  onChange={setCity}
                  placeholder="e.g. London, Madrid…"
                  onEnter={applyFilters}
                />
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold"
                    size={1}
                  >
                    <option value="">Any country</option>
                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Category + Email status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold"
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Email status</label>
                  <select
                    value={emailStatus}
                    onChange={(e) => setEmailStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold"
                  >
                    <option value="">Any status</option>
                    <option value="has_email">Has email</option>
                    <option value="verified">✓ Verified</option>
                    <option value="catch_all">~ Catch-all (usable)</option>
                    <option value="unknown">? Unknown</option>
                    <option value="risky">⚠ Risky</option>
                    <option value="unverified">Unverified</option>
                    <option value="no_email">No email</option>
                  </select>
                </div>
              </div>

              {/* Desktop action buttons (inline) */}
              <div className="hidden md:flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-700/50">
                <button
                  onClick={applyFilters}
                  disabled={isPending}
                  className="flex-1 sm:flex-none px-6 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {isPending ? "Applying…" : "Apply filters"}
                </button>
                <button onClick={clearAll} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                  Clear all
                </button>
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors sm:ml-auto cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>

            {/* Mobile sticky action bar */}
            <div className="md:hidden shrink-0 px-4 py-3 border-t border-gray-700 flex gap-2 bg-navy">
              <button
                onClick={applyFilters}
                disabled={isPending}
                className="flex-1 px-4 py-3 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isPending ? "Applying…" : "Apply filters"}
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-3 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function QuickChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 cursor-pointer ${
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
      }`}
    >
      {active && (
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </button>
  )
}

function Chip({ label, onRemove, variant = "include" }: { label: string; onRemove: () => void; variant?: "include" | "exclude" }) {
  return (
    <span className={`flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs rounded-full border shrink-0 ${
      variant === "exclude"
        ? "bg-red-900/20 text-red-400 border-red-900/40"
        : "bg-gold/10 text-gold border-gold/30"
    }`}>
      {variant === "exclude" && <span className="opacity-60 leading-none">≠</span>}
      {label}
      <button
        onClick={onRemove}
        className="w-3.5 h-3.5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}

function ChipInput({
  label, values, onAdd, onRemove, placeholder, variant = "include",
}: {
  label: string
  values: string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  placeholder?: string
  variant?: "include" | "exclude"
}) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function add() {
    const v = input.trim()
    if (!v || values.includes(v) || values.length >= MAX_VALUES) return
    onAdd(v)
    setInput("")
    inputRef.current?.focus()
  }

  const focusBorder = variant === "exclude" ? "focus:border-red-500/70" : "focus:border-gold"
  const labelClass  = variant === "exclude" ? "text-red-400/80" : "text-gray-400"

  return (
    <div>
      <label className={`text-xs mb-1.5 block ${labelClass}`}>{label}</label>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {values.map(v => (
            <span
              key={v}
              className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs border ${
                variant === "exclude"
                  ? "bg-red-900/20 text-red-400 border-red-900/40"
                  : "bg-gold/10 text-gold border-gold/30"
              }`}
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="w-3.5 h-3.5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={`Remove ${v}`}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {values.length < MAX_VALUES ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
            placeholder={placeholder}
            className={`flex-1 px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none ${focusBorder} placeholder-gray-500`}
          />
          <button
            type="button"
            onClick={add}
            disabled={!input.trim()}
            className="px-3 py-2 bg-navy text-gray-300 rounded-lg text-xs font-medium border border-gray-600 hover:border-gray-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-600 mt-1">Max {MAX_VALUES} values reached</p>
      )}
    </div>
  )
}

function FilterInput({
  label, value, onChange, placeholder, onEnter,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; onEnter: () => void
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onEnter() }}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
      />
    </div>
  )
}

