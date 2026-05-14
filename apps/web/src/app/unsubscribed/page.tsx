"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"

function UnsubscribedContent() {
  const params   = useSearchParams()
  const email    = params.get("email")
  const category = params.get("category") ?? "marketing"
  const token    = params.get("token")
  const error    = params.get("error")

  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid link</h1>
          <p className="text-gray-500 text-sm">
            This unsubscribe link is invalid or has expired. If you believe this is
            an error, please contact{" "}
            <a href="mailto:support@footycontacts.com" className="underline">
              support@footycontacts.com
            </a>
            .
          </p>
        </div>
      </main>
    )
  }

  if (state === "done") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            You&apos;ve been unsubscribed
          </h1>
          <p className="text-gray-500 text-sm">
            {email} has been removed from {category} emails.
          </p>
        </div>
      </main>
    )
  }

  async function handleConfirm() {
    setState("loading")
    try {
      const url = new URL("/api/email/unsubscribe", window.location.origin)
      if (email)    url.searchParams.set("email",    email)
      if (category) url.searchParams.set("category", category)
      if (token)    url.searchParams.set("token",    token ?? "")

      const res = await fetch(url.toString(), { method: "POST" })
      if (!res.ok) throw new Error("Request failed")
      setState("done")
    } catch {
      setState("error")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Confirm unsubscribe</h1>
        <p className="text-gray-500 text-sm mb-6">
          You are about to unsubscribe{" "}
          <span className="font-medium text-gray-700">{email}</span> from{" "}
          {category} emails.
        </p>

        {state === "error" && (
          <p className="text-red-600 text-sm mb-4">
            Something went wrong. Please try again.
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={state === "loading" || !email || !token}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium
                     hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {state === "loading" ? "Unsubscribing…" : "Confirm unsubscribe"}
        </button>
      </div>
    </main>
  )
}

export default function UnsubscribedPage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribedContent />
    </Suspense>
  )
}
