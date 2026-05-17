"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      setMessage("No invite token provided.")
      return
    }

    async function accept() {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (res.status === 401) {
        // Not logged in — redirect to login with invite preserved
        router.push(`/login?invite=${encodeURIComponent(token ?? "")}`)
        return
      }

      const json = await res.json() as { success?: boolean; already_member?: boolean; error?: string }

      if (res.ok || json.success) {
        setStatus("success")
        setMessage("You've joined the team!")
        setTimeout(() => router.push("/app"), 2500)
      } else {
        const messages: Record<string, string> = {
          invalid_or_expired_token: "This invite link is invalid or has expired.",
          team_full: "The team is full. Ask your team owner to add more seats.",
        }
        setStatus("error")
        setMessage(messages[json.error ?? ""] ?? "Something went wrong.")
      }
    }

    void accept()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#080c17] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Accepting invite…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-white text-lg font-bold mb-1">Welcome to the team!</h1>
            <p className="text-gray-500 text-sm">{message}</p>
            <p className="text-gray-600 text-xs mt-2">Redirecting you to the app…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-white text-lg font-bold mb-1">Invite error</h1>
            <p className="text-gray-400 text-sm mb-4">{message}</p>
            <a
              href="/app"
              className="inline-block px-5 py-2.5 bg-gold text-[#080c17] rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors"
            >
              Go to app
            </a>
          </>
        )}
      </div>
    </div>
  )
}
