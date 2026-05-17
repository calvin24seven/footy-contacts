"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminContact {
  id: string
  name: string
  role: string | null
  organisation: string | null
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
  category: string | null
  level: string | null
  verified_status: string
  visibility_status: string
  suppression_status: string
  has_email: boolean | null
  has_phone: boolean | null
  has_linkedin: boolean | null
  linkedin_url: string | null
  is_honeypot: boolean
  created_at: string
  updated_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50
const MAX_VALUES = 5

const CATEGORIES = [
  "Agent", "Scout", "Coach", "Club Official",
  "Performance", "Medical", "Academy", "Player", "Media", "Football",
]

const EMAIL_STATUS_OPTIONS = [
  { value: "",            label: "All email statuses" },
  { value: "has_email",   label: "Has email" },
  { value: "no_email",    label: "No email" },
  { value: "verified",    label: "✓ Verified" },
  { value: "catch_all",   label: "~ Catch-all" },
  { value: "unknown",     label: "? Unknown" },
  { value: "risky",       label: "⚠ Risky" },
  { value: "unverified",  label: "Unverified" },
]

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest first" },
  { value: "created_at_asc",  label: "Oldest first" },
  { value: "name_asc",        label: "Name A–Z" },
  { value: "name_desc",       label: "Name Z–A" },
]

const BULK_ACTIONS = [
  { value: "blacklist",  label: "Blacklist (email + suppress)", danger: true },
  { value: "suppress",   label: "Mark suppressed",              danger: false },
  { value: "unsuppress", label: "Remove suppression",           danger: false },
  { value: "archive",    label: "Archive",                      danger: false },
  { value: "publish",    label: "Publish",                      danger: false },
  { value: "draft",      label: "Set to Draft",                 danger: false },
  { value: "delete",     label: "Delete permanently",           danger: true },
]

// ── Colour helpers ────────────────────────────────────────────────────────────
const VERIFIED_COLOURS: Record<string, string> = {
  verified:   "bg-green-900/40 text-green-300",
  catch_all:  "bg-yellow-900/40 text-yellow-300",
  unknown:    "bg-gray-800 text-gray-300",
  risky:      "bg-orange-900/40 text-orange-300",
  unverified: "bg-navy text-gray-500",
}
const VISIBILITY_COLOURS: Record<string, string> = {
  published: "bg-green-900/40 text-green-300",
  draft:     "bg-yellow-900/40 text-yellow-300",
  archived:  "bg-gray-800 text-gray-400",
}
const SUPPRESSION_COLOURS: Record<string, string> = {
  active:     "bg-green-900/30 text-green-400",
  suppressed: "bg-red-900/40 text-red-400",
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({
  label,
  variant = "include",
  onRemove,
}: {
  label: string
  variant?: "include" | "exclude"
  onRemove: () => void
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      variant === "exclude"
        ? "bg-red-900/30 text-red-300 border border-red-700/40"
        : "bg-gold/10 text-gold border border-gold/30"
    }`}>
      {variant === "exclude" && <span className="text-red-400">–</span>}
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  )
}

function ChipInput({
  label,
  values,
  onAdd,
  onRemove,
  placeholder,
  variant = "include",
}: {
  label: string
  values: string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  placeholder?: string
  variant?: "include" | "exclude"
}) {
  const [input, setInput] = useState("")

  function add() {
    const v = input.trim()
    if (v && !values.includes(v) && values.length < MAX_VALUES) {
      onAdd(v)
      setInput("")
    }
  }

  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {values.map(v => <Chip key={v} label={v} variant={variant} onRemove={() => onRemove(v)} />)}
        </div>
      )}
      {values.length < MAX_VALUES && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add() } }}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 bg-navy text-white text-xs rounded-lg border border-gray-700 focus:outline-none focus:border-gold placeholder-gray-600"
          />
          <button
            type="button"
            onClick={add}
            disabled={!input.trim()}
            className="px-3 py-1.5 text-xs rounded-lg bg-navy-light border border-gray-600 text-gray-300 hover:border-gray-400 disabled:opacity-40 cursor-pointer"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminContactsClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // ── Filter state (mirrors URL) ─────────────────────────────────────────────
  const [q,                setQ]                = useState(searchParams.get("q") ?? "")
  const [roles,            setRoles]            = useState<string[]>(parseCSV(searchParams.get("role")))
  const [roleExcludes,     setRoleExcludes]     = useState<string[]>(parseCSV(searchParams.get("role_exclude")))
  const [orgs,             setOrgs]             = useState<string[]>(parseCSV(searchParams.get("org")))
  const [orgExcludes,      setOrgExcludes]      = useState<string[]>(parseCSV(searchParams.get("org_exclude")))
  const [city,             setCity]             = useState(searchParams.get("city") ?? "")
  const [country,          setCountry]          = useState(searchParams.get("country") ?? "")
  const [emailStatus,      setEmailStatus]      = useState(searchParams.get("email_status") ?? "")
  const [category,         setCategory]         = useState(searchParams.get("category") ?? "")
  const [visibilityStatus, setVisibilityStatus] = useState(searchParams.get("visibility_status") ?? "")
  const [suppressionStatus,setSuppressionStatus]= useState(searchParams.get("suppression_status") ?? "")
  const [isHoneypot,       setIsHoneypot]       = useState(searchParams.get("is_honeypot") ?? "")
  const [hasPhone,         setHasPhone]         = useState(searchParams.get("has_phone") ?? "")
  const [sort,             setSort]             = useState(searchParams.get("sort") ?? "created_at_desc")
  const [page,             setPage]             = useState(parseInt(searchParams.get("page") ?? "1", 10))
  const [filtersOpen,      setFiltersOpen]      = useState(false)

  // ── Data state ────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<AdminContact[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)

  // ── Selection state ───────────────────────────────────────────────────────
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [bulkAction,  setBulkAction]  = useState("")
  const [acting,      setActing]      = useState(false)
  const [rowActing,   setRowActing]   = useState<Set<string>>(new Set())
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [confirmText, setConfirmText] = useState<string | null>(null)
  const pendingAction = useRef<string>("")

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Build URL params from current filter state ────────────────────────────
  function buildParams(overrides: Record<string, string | number> = {}) {
    const p = new URLSearchParams()
    const state: Record<string, string> = {
      q,
      role:                toCSV(roles),
      role_exclude:        toCSV(roleExcludes),
      org:                 toCSV(orgs),
      org_exclude:         toCSV(orgExcludes),
      city,
      country,
      email_status:        emailStatus,
      category,
      visibility_status:   visibilityStatus,
      suppression_status:  suppressionStatus,
      is_honeypot:         isHoneypot,
      has_phone:           hasPhone,
      sort:                sort !== "created_at_desc" ? sort : "",
      page:                String(page),
    }
    for (const [k, v] of Object.entries({ ...state, ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])) })) {
      if (v) p.set(k, v); else p.delete(k)
    }
    return p.toString()
  }

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    const params = buildParams()
    const res = await fetch(`/api/admin/contacts?${params}&limit=${PAGE_SIZE}`)
    if (!res.ok) { setLoading(false); return }
    const body = await res.json() as { data: AdminContact[]; count: number }
    setContacts(body.data)
    setTotal(body.count)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, roles, roleExcludes, orgs, orgExcludes, city, country, emailStatus,
      category, visibilityStatus, suppressionStatus, isHoneypot, hasPhone, sort, page])

  useEffect(() => { load() }, [load])

  // ── Apply filters: push to URL + reset to page 1 ─────────────────────────
  function applyFilters() {
    setPage(1)
    const params = buildParams({ page: 1 })
    router.replace(`/admin/contacts?${params}`)
    setFiltersOpen(false)
  }

  function clearAll() {
    setQ(""); setRoles([]); setRoleExcludes([]); setOrgs([]); setOrgExcludes([])
    setCity(""); setCountry(""); setEmailStatus(""); setCategory("")
    setVisibilityStatus(""); setSuppressionStatus(""); setIsHoneypot(""); setHasPhone("")
    setSort("created_at_desc"); setPage(1)
    router.replace("/admin/contacts")
    setFiltersOpen(false)
  }

  const activeFilterCount =
    [q, city, country, emailStatus, category, visibilityStatus, suppressionStatus, isHoneypot, hasPhone === "1" ? "1" : ""]
      .filter(Boolean).length +
    roles.length + roleExcludes.length + orgs.length + orgExcludes.length

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const selectPage = () => setSelected(new Set(contacts.map(c => c.id)))
  const clearSelection = () => setSelected(new Set())

  const isAllPageSelected = contacts.length > 0 && contacts.every(c => selected.has(c.id))

  function toggleAll() {
    if (isAllPageSelected) clearSelection()
    else selectPage()
  }

  // ── Bulk action ───────────────────────────────────────────────────────────
  async function executeBulkAction(action: string) {
    if (selected.size === 0 || !action) return
    setActing(true)
    const res = await fetch("/api/admin/contacts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: [...selected] }),
    })
    setActing(false)
    const body = await res.json() as { processed?: number; error?: string; emails_suppressed?: number }
    if (!res.ok) {
      showToast(body.error ?? "Action failed", false)
      return
    }
    const extras = body.emails_suppressed != null ? ` (${body.emails_suppressed} email(s) blacklisted)` : ""
    showToast(`${body.processed} contact(s) updated${extras}`, true)
    setBulkAction("")
    load()
  }

  function handleBulkActionConfirm() {
    const action = bulkAction
    if (!action) return
    const isDanger = BULK_ACTIONS.find(a => a.value === action)?.danger
    if (isDanger) {
      const label = BULK_ACTIONS.find(a => a.value === action)?.label ?? action
      pendingAction.current = action
      setConfirmText(`Are you sure you want to "${label}" ${selected.size} contact(s)? This cannot be undone.`)
      return
    }
    executeBulkAction(action)
  }

  // ── Row quick action ──────────────────────────────────────────────────────
  async function executeRowAction(id: string, action: string) {
    setRowActing(prev => new Set(prev).add(id))
    // Optimistic update
    setContacts(prev => prev.map(c => {
      if (c.id !== id) return c
      if (action === "suppress")   return { ...c, suppression_status: "suppressed" }
      if (action === "unsuppress") return { ...c, suppression_status: "active" }
      if (action === "publish")    return { ...c, visibility_status: "published" }
      if (action === "draft")      return { ...c, visibility_status: "draft" }
      return c
    }))
    const res = await fetch("/api/admin/contacts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: [id] }),
    })
    setRowActing(prev => { const next = new Set(prev); next.delete(id); return next })
    if (!res.ok) {
      showToast("Action failed", false)
      load() // revert optimistic update
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function handleExport() {
    const params = buildParams()
    window.location.href = `/api/admin/contacts/export?${params}`
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function goToPage(p: number) {
    setPage(p)
    router.replace(`/admin/contacts?${buildParams({ page: p })}`)
  }

  // ── Debounce search ───────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  function handleSearchChange(value: string) {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      const params = new URLSearchParams()
      if (value) params.set("q", value)
      const rest = buildParams({ page: 1 })
      const merged = new URLSearchParams(rest)
      if (value) merged.set("q", value); else merged.delete("q")
      router.replace(`/admin/contacts?${merged.toString()}`)
    }, 350)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.ok ? "bg-green-900/90 text-green-200 border border-green-700" : "bg-red-900/90 text-red-200 border border-red-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm modal */}
      {confirmText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-navy-light border border-gray-600 rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-white font-semibold">Confirm action</h2>
            <p className="text-gray-300 text-sm">{confirmText}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmText(null)}
                className="btn-secondary text-sm"
              >Cancel</button>
              <button
                onClick={() => {
                  setConfirmText(null)
                  executeBulkAction(pendingAction.current)
                }}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors cursor-pointer"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total.toLocaleString()} matching</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <Link href="/admin/contacts/import" className="btn-primary text-sm">Import CSV</Link>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={q}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search name, email, role, org…"
            className="w-full pl-9 pr-9 py-2 bg-navy-light text-white rounded-lg border border-gray-700 focus:outline-none focus:border-gold text-sm placeholder-gray-500"
          />
          {q && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick filters */}
        <select
          value={visibilityStatus}
          onChange={e => { setVisibilityStatus(e.target.value); setPage(1) }}
          onBlur={applyFilters}
          className="input-base text-sm py-2 min-w-[130px]"
        >
          <option value="">All visibility</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={suppressionStatus}
          onChange={e => { setSuppressionStatus(e.target.value); setPage(1) }}
          onBlur={applyFilters}
          className="input-base text-sm py-2 min-w-[130px]"
        >
          <option value="">All suppression</option>
          <option value="active">Active</option>
          <option value="suppressed">Suppressed</option>
        </select>

        <select
          value={emailStatus}
          onChange={e => { setEmailStatus(e.target.value); setPage(1) }}
          onBlur={applyFilters}
          className="input-base text-sm py-2 min-w-[130px]"
        >
          {EMAIL_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Advanced filters drawer trigger */}
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            filtersOpen || activeFilterCount > 0
              ? "border-gold bg-gold/10 text-gold"
              : "border-gray-600 text-gray-400 hover:border-gray-400"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-gold text-navy text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1) }}
          onBlur={applyFilters}
          className="input-base text-sm py-2 min-w-[130px]"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Advanced filter drawer */}
      {filtersOpen && (
        <div className="bg-navy-light border border-gray-600/50 rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <ChipInput
              label="Role includes"
              values={roles}
              onAdd={v => setRoles(p => [...p, v])}
              onRemove={v => setRoles(p => p.filter(x => x !== v))}
              placeholder="e.g. Head Coach, Scout…"
            />
            <ChipInput
              label="Exclude roles"
              variant="exclude"
              values={roleExcludes}
              onAdd={v => setRoleExcludes(p => [...p, v])}
              onRemove={v => setRoleExcludes(p => p.filter(x => x !== v))}
              placeholder="e.g. Intern, Player…"
            />

            <ChipInput
              label="Organisation includes"
              values={orgs}
              onAdd={v => setOrgs(p => [...p, v])}
              onRemove={v => setOrgs(p => p.filter(x => x !== v))}
              placeholder="e.g. Arsenal, FIFA…"
            />
            <ChipInput
              label="Exclude organisations"
              variant="exclude"
              values={orgExcludes}
              onAdd={v => setOrgExcludes(p => [...p, v])}
              onRemove={v => setOrgExcludes(p => p.filter(x => x !== v))}
              placeholder="e.g. Manchester City…"
            />

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-700 focus:outline-none focus:border-gold"
              >
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. London, Madrid…"
                className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-700 focus:outline-none focus:border-gold placeholder-gray-600"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Country</label>
              <input
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g. England, Spain…"
                className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-700 focus:outline-none focus:border-gold placeholder-gray-600"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPhone === "1"}
                  onChange={e => setHasPhone(e.target.checked ? "1" : "")}
                  className="accent-gold"
                />
                <span className="text-sm text-gray-300">Has phone</span>
              </label>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Honeypot contacts</label>
                <select
                  value={isHoneypot}
                  onChange={e => setIsHoneypot(e.target.value)}
                  className="w-full px-3 py-2 bg-navy text-white text-sm rounded-lg border border-gray-700 focus:outline-none focus:border-gold"
                >
                  <option value="">All contacts</option>
                  <option value="false">Exclude honeypots</option>
                  <option value="true">Honeypots only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-700/50">
            <button onClick={applyFilters} className="btn-primary text-sm">Apply filters</button>
            <button onClick={clearAll} className="btn-secondary text-sm">Clear all</button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !filtersOpen && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {q && <Chip label={`"${q}"`} onRemove={() => handleSearchChange("")} />}
          {roles.map(v => <Chip key={`r-${v}`} label={v} onRemove={() => { setRoles(p => p.filter(x => x !== v)); setPage(1) }} />)}
          {roleExcludes.map(v => <Chip key={`re-${v}`} label={v} variant="exclude" onRemove={() => { setRoleExcludes(p => p.filter(x => x !== v)); setPage(1) }} />)}
          {orgs.map(v => <Chip key={`o-${v}`} label={v} onRemove={() => { setOrgs(p => p.filter(x => x !== v)); setPage(1) }} />)}
          {orgExcludes.map(v => <Chip key={`oe-${v}`} label={v} variant="exclude" onRemove={() => { setOrgExcludes(p => p.filter(x => x !== v)); setPage(1) }} />)}
          {city && <Chip label={`City: ${city}`} onRemove={() => { setCity(""); setPage(1) }} />}
          {country && <Chip label={country} onRemove={() => { setCountry(""); setPage(1) }} />}
          {emailStatus && <Chip label={EMAIL_STATUS_OPTIONS.find(o => o.value === emailStatus)?.label ?? emailStatus} onRemove={() => { setEmailStatus(""); setPage(1) }} />}
          {category && <Chip label={category} onRemove={() => { setCategory(""); setPage(1) }} />}
          {visibilityStatus && <Chip label={`Visibility: ${visibilityStatus}`} onRemove={() => { setVisibilityStatus(""); setPage(1) }} />}
          {suppressionStatus && <Chip label={`Suppression: ${suppressionStatus}`} onRemove={() => { setSuppressionStatus(""); setPage(1) }} />}
          {isHoneypot && <Chip label={isHoneypot === "true" ? "Honeypots only" : "No honeypots"} onRemove={() => { setIsHoneypot(""); setPage(1) }} />}
          {hasPhone === "1" && <Chip label="Has phone" onRemove={() => { setHasPhone(""); setPage(1) }} />}
          <button onClick={clearAll} className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-navy-light border border-gold/30 rounded-xl">
          <span className="text-sm text-gold font-medium">{selected.size} selected</span>
          <button onClick={selectPage} className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
            Select page ({contacts.length})
          </button>
          <button onClick={clearSelection} className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">
            Clear
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
              className="input-base text-sm py-1.5"
            >
              <option value="">Choose action…</option>
              {BULK_ACTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkActionConfirm}
              disabled={!bulkAction || acting}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                BULK_ACTIONS.find(a => a.value === bulkAction)?.danger
                  ? "bg-red-700 hover:bg-red-600 text-white"
                  : "btn-primary"
              }`}
            >
              {acting ? "Working…" : "Apply"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-navy-light rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-navy-dark">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleAll}
                  className="accent-gold cursor-pointer"
                  aria-label="Select all on page"
                />
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Organisation</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Country</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Verified</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Visibility</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Suppression</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">LI</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">Loading…</td>
              </tr>
            ) : !contacts.length ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">No contacts found</td>
              </tr>
            ) : contacts.map(c => (
              <tr
                key={c.id}
                className={`border-b border-navy-dark last:border-0 transition-colors ${
                  selected.has(c.id) ? "bg-gold/5" : "hover:bg-navy/30"
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="accent-gold cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-medium truncate max-w-[140px]">{c.name}</span>
                    {c.is_honeypot && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-red-900/40 text-red-400 shrink-0">🍯</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 max-w-[130px] truncate">{c.role ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300 max-w-[130px] truncate">{c.organisation ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300 max-w-[160px] truncate">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300">{c.country ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{c.category ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${VERIFIED_COLOURS[c.verified_status] ?? "text-gray-400"}`}>
                    {c.verified_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${VISIBILITY_COLOURS[c.visibility_status] ?? "text-gray-400"}`}>
                    {c.visibility_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${SUPPRESSION_COLOURS[c.suppression_status] ?? "text-gray-400"}`}>
                    {c.suppression_status === "active" ? "Live" : c.suppression_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.linkedin_url ? (
                    <a
                      href={c.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0A66C2] hover:opacity-80 transition-opacity"
                      title={c.linkedin_url}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  ) : (
                    <span className="text-gray-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* Suppress / Unsuppress */}
                    <button
                      onClick={() => executeRowAction(c.id, c.suppression_status === "active" ? "suppress" : "unsuppress")}
                      disabled={rowActing.has(c.id)}
                      title={c.suppression_status === "active" ? "Suppress contact" : "Remove suppression"}
                      className={`p-1 rounded transition-colors disabled:opacity-40 cursor-pointer ${
                        c.suppression_status === "active"
                          ? "text-gray-500 hover:text-red-400"
                          : "text-red-400 hover:text-green-400"
                      }`}
                    >
                      {c.suppression_status === "active" ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    {/* Publish / Unpublish */}
                    <button
                      onClick={() => executeRowAction(c.id, c.visibility_status === "published" ? "draft" : "publish")}
                      disabled={rowActing.has(c.id)}
                      title={c.visibility_status === "published" ? "Unpublish (set to draft)" : "Publish"}
                      className={`p-1 rounded transition-colors disabled:opacity-40 cursor-pointer ${
                        c.visibility_status === "published"
                          ? "text-gray-500 hover:text-yellow-400"
                          : "text-yellow-400 hover:text-green-400"
                      }`}
                    >
                      {c.visibility_status === "published" ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                    {/* Edit */}
                    <Link
                      href={`/admin/contacts/${c.id}`}
                      title="Edit contact"
                      className="p-1 text-gray-500 hover:text-gold transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages} ({total.toLocaleString()} contacts)
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseCSV(s: string | null): string[] {
  if (!s?.trim()) return []
  return s.split(",").map(v => v.trim()).filter(Boolean)
}

function toCSV(arr: string[]): string {
  return arr.join(",")
}
