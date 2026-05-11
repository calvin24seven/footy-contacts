"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const STORAGE_KEY = "cookie_consent_accepted"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable (SSR guard, private browsing with restrictions)
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-sm text-gray-700">
        We use essential cookies to keep you signed in and to improve your experience.
        By continuing you agree to our{" "}
        <Link href="/privacy" className="underline hover:text-gray-900">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        onClick={accept}
        className="mt-3 w-full rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 sm:ml-4 sm:mt-0 sm:w-auto"
      >
        Accept
      </button>
    </div>
  )
}
