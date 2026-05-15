"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const [resending, setResending] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (signUpError) {
      setError("Could not create account. Please check your details and try again.")
    } else {
      setSentEmail(email)
      setSent(true)
    }
    setLoading(false)
  }

  async function handleResend() {
    if (!sentEmail) return
    setResending(true)
    await supabase.auth.resend({ type: "signup", email: sentEmail })
    setResending(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="text-center text-white max-w-sm">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gold mb-3">Check your email</h2>
          <p className="text-gray-300 mb-6">
            We sent a confirmation link to <span className="text-white font-medium">{sentEmail}</span>.
            Click it to activate your account.
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-gold hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend confirmation email"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Footy Contacts" className="h-10 w-auto mx-auto" />
          <h1 className="text-white text-xl font-semibold mt-2">Create your account</h1>
        </div>

        <div className="bg-navy-light rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
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
              minLength={8}
              autoComplete="new-password"
              placeholder="Password (min 8 characters)"
              className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
