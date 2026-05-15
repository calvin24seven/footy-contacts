"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed:  "Sign-in failed. Please try again.",
  invalid_reset_link:    "That password reset link has expired. Please request a new one.",
  email_verification_required: "Please verify your email address before signing in.",
  session_expired:       "Your session expired. Please sign in again.",
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const code = searchParams.get("error")
    if (code) {
      setError(ERROR_MESSAGES[code] ?? "An error occurred. Please try again.")
    }
  }, [searchParams])

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      // Surface a friendly message without leaking internal Supabase error strings
      setError("Incorrect email or password.")
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Footy Contacts" className="h-10 w-auto mx-auto" />
          <h1 className="text-white text-xl font-semibold mt-2">Sign in to your account</h1>
        </div>

        <div className="bg-navy-light rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Email/password */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
            />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="flex justify-between text-sm text-gray-400">
            <Link href="/forgot-password" className="hover:text-gold">
              Forgot password?
            </Link>
            <Link href="/signup" className="hover:text-gold">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
