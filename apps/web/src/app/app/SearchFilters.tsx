"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

const CATEGORIES = ["Agent", "Scout", "Coach", "Club Official", "Performance", "Medical", "Academy", "Player", "Media"]

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "recently_added", label: "Recently added" },
  { value: "recently_verified", label: "Recently verified" },
]

interface Props {
  countries: string[]
  currentSort?: string
}

export default function SearchFilters({ countries, currentSort = "name_asc" }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const [role, setRole] = useState(searchParams.get("role") ?? "")
  const [org, setOrg] = useState(searchParams.get("org") ?? "")
  const [country, setCountry] = useState(searchParams.get("country") ?? "")
  const [emailStatus, setEmailStatus] = useState(searchParams.get("email_status") ?? "")
  const [category, setCategory] = useState(searchParams.get("category") ?? "")

  const activeRole = searchParams.get("role") ?? ""
  const activeOrg = searchParams.get("org") ?? ""
  const activeCountry = searchParams.get("country") ?? ""
  const activeEmailStatus = searchParams.get("email_status") ?? ""
  const activeCategory = searchParams.get("category") ?? ""
  const activeHasPhone = searchParams.get("has_phone") ?? ""
  const activeSort = searchParams.get("sort") ?? currentSort

  const activeCount = [activeRole, activeOrg, activeCountry, activeEmailStatus, activeCategory, activeHasPhone].filter(Boolean).length

  function buildParams(overrides: Record<string, string> = {}) {
    const p = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) p.set("q", q)
    if (activeRole) p.set("role", activeRole)
    if (activeOrg) p.set("org", activeOrg)
    if (activeCountry) p.set("country", activeCountry)
    if (activeEmailStatus) p.set("email_status", activeEmailStatus)
    if (activeCategory) p.set("category", activeCategory)
    if (activeHasPhone) p.set("has_phone", activeHasPhone)
    if (activeSort && activeSort !== "name_asc") p.set("sort", activeSort)
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    p.delete("page")
    return p.toString()
  }

  function navigate(overrides: Record<string, string> = {}) {
    startTransition(() => router.replace(`/app?${buildParams(overrides)}`))
  }

  function applyFilters() {
    const p = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) p.set("q", q)
    if (role) p.set("role", role)
    if (org) p.set("org", org)
    if (country) p.set("country", country)
    if (emailStatus) p.set("email_status", emailStatus)
    if (category) p.set("category", category)
    if (activeHasPhone) p.set("has_phone", activeHasPhone)
    if (activeSort && activeSort !== "name_asc") p.set("sort", activeSort)
    startTransition(() => router.replace(`/app?${p.toString()}`))
    setOpen(false)
  }

  function removeFilter(key: string) {
    navigate({ [key]: "" })
    if (key === "role") setRole("")
    if (key === "org") setOrg("")
    if (key === "country") setCountry("")
    if (key === "email_status") setEmailStatus("")
    if (key === "category") setCategory("")
  }

  function clearAll() {
    setRole(""); setOrg(""); setCountry(""); setEmailStatus(""); setCategory("")
    const p = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) p.set("q", q)
    startTransition(() => router.replace(`/app?${p.toString()}`))
    setOpen(false)
  }

  function handleOpen() {
    setRole(activeRole); setOrg(activeOrg); setCountry(activeCountry)
    setEmailStatus(activeEmailStatus); setCategory(activeCategory)
    setOpen(true)
  }

  // Quick chip toggles
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
        <QuickChip
          label="Has email"
          active={activeEmailStatus === "has_email"}
          onClick={() => toggleQuickChip("email_status", "has_email")}
        />
        <QuickChip
          label="✓ Verified"
          active={activeEmailStatus === "verified"}
          onClick={() => toggleQuickChip("email_status", "verified")}
        />
        <QuickChip
          label="Has phone"
          active={activeHasPhone === "1"}
          onClick={() => toggleQuickChip("has_phone", "1")}
        />

        {/* Divider */}
        <span className="text-gray-700 shrink-0 hidden sm:inline">|</span>

        {/* Active filter chips from advanced drawer */}
        {activeRole && <Chip label={`Role: ${activeRole}`} onRemove={() => removeFilter("role")} />}
        {activeOrg && <Chip label={`Org: ${activeOrg}`} onRemove={() => removeFilter("org")} />}
        {activeCountry && <Chip label={activeCountry} onRemove={() => removeFilter("country")} />}
        {activeEmailStatus && !["has_email", "verified"].includes(activeEmailStatus) && (
          <Chip
            label={
              activeEmailStatus === "no_email" ? "No email" :
              activeEmailStatus === "catch_all" ? "Catch-all" :
              activeEmailStatus === "unknown" ? "Unknown" :
              activeEmailStatus === "risky" ? "Risky" :
              activeEmailStatus === "unverified" ? "Unverified" :
              activeEmailStatus
            }
            onRemove={() => removeFilter("email_status")}
          />
        )}
        {activeCategory && <Chip label={activeCategory} onRemove={() => removeFilter("category")} />}

        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-gray-500 hover:text-white transition-colors shrink-0 ml-1 cursor-pointer">
            Clear all
          </button>
        )}

        {isPending && (
          <span className="text-xs text-gray-600 ml-1 shrink-0">Updating…</span>
        )}

        {/* Sort — pushed to right on desktop */}
        <div className="ml-auto shrink-0 hidden sm:flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Sort:</span>
          <select
            value={activeSort}
            onChange={(e) => handleSort(e.target.value)}
            className="bg-navy-light text-gray-300 text-xs border border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile sort (below chips) */}
      <div className="flex sm:hidden items-center gap-1.5 mt-2">
        <span className="text-xs text-gray-500">Sort:</span>
        <select
          value={activeSort}
          onChange={(e) => handleSort(e.target.value)}
          className="flex-1 bg-navy-light text-gray-300 text-xs border border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Advanced filter drawer ─────────────────────────────────────────── */}
      {open && (
        <div className="mt-3 p-5 bg-navy-light rounded-xl border border-gray-600/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FilterInput label="Role contains" value={role} onChange={setRole} placeholder="e.g. Scout, Head Coach…" onEnter={applyFilters} />
            <FilterInput label="Organisation contains" value={org} onChange={setOrg} placeholder="e.g. Arsenal, FIFA…" onEnter={applyFilters} />
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold"
              >
                <option value="">Any country</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
          </div>

          <div className="mb-5">
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

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={applyFilters}
              disabled={isPending}
              className="flex-1 sm:flex-none px-6 py-2.5 sm:py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
      )}
    </div>
  )
}

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

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gold/10 text-gold text-xs rounded-full border border-gold/30 shrink-0">
      {label}
      <button
        onClick={onRemove}
        className="w-3.5 h-3.5 rounded-full hover:bg-gold/20 flex items-center justify-center transition-colors cursor-pointer"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
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

