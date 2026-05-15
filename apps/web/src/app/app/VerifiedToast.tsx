"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export default function VerifiedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setShow(true)
      // Remove the param from the URL without pushing to history
      const params = new URLSearchParams(searchParams.toString())
      params.delete("verified")
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname
      router.replace(newUrl, { scroll: false })
      // Auto-dismiss after 5s
      const t = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(t)
    }
  }, [searchParams, router, pathname])

  if (!show) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-green-900/90 border border-green-700/60 rounded-xl shadow-xl backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
      <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
        <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-green-200 text-sm font-medium">Email verified. You can now unlock contact details.</p>
      <button
        onClick={() => setShow(false)}
        className="ml-1 text-green-400/60 hover:text-green-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
