"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import AuthSplitLayout from "@/components/auth/AuthSplitLayout"
import TurnstileWidget from "@/components/auth/TurnstileWidget"

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""

function PasswordStrength({ password }: { password: string }) {
  const hasLength = password.length >= 8
  const hasSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  if (!password) return null
  return (
    <ul className="mt-1.5 space-y-1">
      <li className={`flex items-center gap-1.5 text-xs ${hasLength ? "text-green-400" : "text-gray-500"}`}>
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {hasLength
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
        </svg>
        At least 8 characters
      </li>
      <li className={`flex items-center gap-1.5 text-xs ${hasSymbol ? "text-green-400" : "text-gray-500"}`}>
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {hasSymbol
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
        </svg>
        At least one number or symbol
      </li>
    </ul>
  )
}

function PasswordField({
  name,
  placeholder,
  autoComplete,
  value,
  onChange,
  minLength,
}: {
  name: string
  placeholder: string
  autoComplete: string
  value: string
  onChange: (v: string) => void
  minLength?: number
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 pr-11 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startCooldown() {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return n - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    const hasSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    if (password.length < 8 || !hasSymbol) {
      setError("Password must be at least 8 characters with a number or symbol.")
      return
    }
    if (!turnstileToken) {
      setError("Please complete the security check below.")
      return
    }
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, turnstileToken }),
    })
    const data = await res.json() as { error?: string; code?: string; success?: boolean }
    if (!res.ok) {
      setError(data.error ?? "Could not create account. Please try again.")
      setTurnstileToken(null) // force re-challenge
    } else {
      setSentEmail(email)
      setSent(true)
    }
    setLoading(false)
  }

  async function handleResend() {
    if (!sentEmail || resendCooldown > 0) return
    setResending(true)
    // Use a fresh Supabase client for resend only (no signup here)
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    await supabase.auth.resend({ type: "signup", email: sentEmail })
    setResending(false)
    startCooldown()
  }

  if (sent) {
    return (
      <AuthSplitLayout variant="signup">
        <div className="text-center">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-gray-400 text-sm mb-1">We sent a confirmation link to</p>
          <p className="text-white font-medium text-sm mb-6">{sentEmail}</p>
          <p className="text-gray-500 text-xs mb-6">Check your spam folder if you don&apos;t see it within 2 minutes.</p>
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-sm text-gold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? "Sending…" : "Resend confirmation email"}
          </button>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout variant="signup">
      <div>
        <h2 className="text-white text-2xl font-bold mb-1">Create your account</h2>
        <p className="text-gray-400 text-sm mb-6">Start with 3 free unlocks — no credit card needed.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">
              {error}
              {error.includes("already exists") && (
                <> <Link href="/login" className="text-gold underline">Sign in instead</Link></>
              )}
            </p>
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
          <div>
            <PasswordField
              name="password"
              placeholder="Create a password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              minLength={8}
            />
            <PasswordStrength password={password} />
          </div>
          <PasswordField
            name="confirm"
            placeholder="Confirm your password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
          />
          {TURNSTILE_SITE_KEY && (
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              onToken={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p className="text-gray-500 text-xs text-center mt-4">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="hover:text-gray-300 underline">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:text-gray-300 underline">Privacy Policy</Link>.
        </p>

        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthSplitLayout>
  )
}


