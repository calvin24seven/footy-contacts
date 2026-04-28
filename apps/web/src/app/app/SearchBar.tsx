"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useTransition, useState, useRef, useEffect } from "react"

interface Props {
  initialQ?: string
}

export default function SearchBar({ initialQ }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState(initialQ ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Sync q when URL changes externally (e.g. "Clear all" from SearchFilters)
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? ""
    setQ(urlQ)
  }, [searchParams])

  function navigate(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) params.set("q", value.trim())
    else params.delete("q")
    params.delete("page")
    startTransition(() => router.replace(`/app?${params.toString()}`))
  }

  function handleChange(value: string) {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(value), 350)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    navigate(q)
  }

  function handleClear() {
    setQ("")
    clearTimeout(debounceRef.current)
    navigate("")
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      {/* Search / spinner icon */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        {isPending ? (
          <svg className="w-4 h-4 text-gold animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      <input
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search scouts, clubs, agents, academies…"
        autoComplete="off"
        className="flex-1 pl-10 pr-9 py-3 bg-navy-light text-white rounded-xl border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 text-sm transition-colors"
      />

      {/* Clear button */}
      {q && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-[4.5rem] top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <button
        type="submit"
        className="px-4 py-3 bg-gold text-navy rounded-xl font-semibold hover:bg-gold-dark transition-colors text-sm shrink-0"
      >
        Search
      </button>
    </form>
  )
}
