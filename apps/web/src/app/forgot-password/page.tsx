"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import AuthSplitLayout from "@/components/auth/AuthSplitLayout"
import { forgotPasswordSchema } from "@/lib/validations"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/update-password`,
    })
    setLoading(false)

    if (err) {
      setError("Something went wrong. Please check your email and try again.")
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <AuthSplitLayout variant="reset">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Check your inbox</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              We sent a password reset link to{" "}
              <span className="text-white">{email}</span>.
              Click it to set a new password.
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Didn&apos;t get it? Check your spam folder.
            </p>
          </div>
          <Link
            href="/login"
            className="block text-sm text-gold hover:text-gold-dark transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout variant="reset">
      <div className="space-y-6">
        <div>
          <h2 className="text-white text-2xl font-bold mb-1.5">Reset your password</h2>
          <p className="text-gray-400 text-sm">
            We&apos;ll send a reset link to your email address.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-gray-400 text-xs font-medium">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
              className="input-base"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-gold hover:text-gold-dark transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  )
}
