"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

const CATEGORIES = ["Agent", "Scout", "Coach", "Club", "Media", "Other"]

interface Props {
  countries: string[]
}

export default function SearchFilters({ countries }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  // Local state = what's staged in the filter panel (may differ from URL until Apply)
  const [role, setRole] = useState(searchParams.get("role") ?? "")
  const [org, setOrg] = useState(searchParams.get("org") ?? "")
  const [country, setCountry] = useState(searchParams.get("country") ?? "")
  const [emailStatus, setEmailStatus] = useState(searchParams.get("email_status") ?? "")
  const [category, setCategory] = useState(searchParams.get("category") ?? "")

  // Active filter values (from URL — what the server actually used)
  const activeRole = searchParams.get("role") ?? ""
  const activeOrg = searchParams.get("org") ?? ""
  const activeCountry = searchParams.get("country") ?? ""
  const activeEmailStatus = searchParams.get("email_status") ?? ""
  const activeCategory = searchParams.get("category") ?? ""
  const activeCount = [activeRole, activeOrg, activeCountry, activeEmailStatus, activeCategory].filter(Boolean).length

  function buildParams(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    // Use current URL values as base, apply overrides
    if (activeRole) params.set("role", activeRole)
    if (activeOrg) params.set("org", activeOrg)
    if (activeCountry) params.set("country", activeCountry)
    if (activeEmailStatus) params.set("email_status", activeEmailStatus)
    if (activeCategory) params.set("category", activeCategory)
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    params.delete("page")
    return params.toString()
  }

  function applyFilters() {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    if (role) params.set("role", role)
    if (org) params.set("org", org)
    if (country) params.set("country", country)
    if (emailStatus) params.set("email_status", emailStatus)
    if (category) params.set("category", category)
    startTransition(() => { router.replace(`/app?${params.toString()}`) })
    setOpen(false)
  }

  function removeFilter(key: string) {
    startTransition(() => { router.replace(`/app?${buildParams({ [key]: "" })}`) })
    if (key === "role") setRole("")
    if (key === "org") setOrg("")
    if (key === "country") setCountry("")
    if (key === "email_status") setEmailStatus("")
    if (key === "category") setCategory("")
  }

  function clearAll() {
    setRole(""); setOrg(""); setCountry(""); setEmailStatus(""); setCategory("")
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    startTransition(() => { router.replace(`/app?${params.toString()}`) })
    setOpen(false)
  }

  // Sync local state when filter panel opens (in case URL changed externally)
  function handleOpen() {
    setRole(activeRole)
    setOrg(activeOrg)
    setCountry(activeCountry)
    setEmailStatus(activeEmailStatus)
    setCategory(activeCategory)
    setOpen(true)
  }

  return (
    <div className="mb-6">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={open ? () => setOpen(false) : handleOpen}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            open || activeCount > 0
              ? "border-gold bg-gold/10 text-gold"
              : "border-gray-600 text-gray-300 hover:border-gray-400"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="bg-gold text-navy text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              {activeCount}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {activeRole && (
          <Chip label={`Role: ${activeRole}`} onRemove={() => removeFilter("role")} />
        )}
        {activeOrg && (
          <Chip label={`Org: ${activeOrg}`} onRemove={() => removeFilter("org")} />
        )}
        {activeCountry && (
          <Chip label={activeCountry} onRemove={() => removeFilter("country")} />
        )}
        {activeEmailStatus && (
          <Chip
            label={activeEmailStatus === "verified" ? "Verified email" : "Unverified"}
            onRemove={() => removeFilter("email_status")}
          />
        )}
        {activeCategory && (
          <Chip label={activeCategory} onRemove={() => removeFilter("category")} />
        )}
        {activeCount > 1 && (
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-white transition-colors ml-1">
            Clear all
          </button>
        )}

        {isPending && (
          <span className="text-xs text-gray-500 ml-1">Updating…</span>
        )}
      </div>

      {/* Expandable filter panel */}
      {open && (
        <div className="mt-3 p-5 bg-navy-light rounded-xl border border-gray-600/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FilterInput
              label="Role contains"
              value={role}
              onChange={setRole}
              placeholder="e.g. Scout, Head Coach…"
              onEnter={applyFilters}
            />
            <FilterInput
              label="Organisation contains"
              value={org}
              onChange={setOrg}
              placeholder="e.g. Arsenal, FIFA…"
              onEnter={applyFilters}
            />
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold"
              >
                <option value="">Any country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email status toggle */}
          <div className="mb-5">
            <label className="text-xs text-gray-400 mb-1.5 block">Email status</label>
            <div className="flex gap-2">
              {(["", "verified", "unverified"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEmailStatus(s)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    emailStatus === s
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-gray-600 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {s === "" ? "Any" : s === "verified" ? "✓ Verified" : "Unverified"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              disabled={isPending}
              className="px-6 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors"
            >
              {isPending ? "Applying…" : "Apply filters"}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors ml-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gold/10 text-gold text-xs rounded-full border border-gold/30">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gold/20 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  )
}

function FilterInput({
  label, value, onChange, placeholder, onEnter,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  onEnter: () => void
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
      />
    </div>
  )
}
