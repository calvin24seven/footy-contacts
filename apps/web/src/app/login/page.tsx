"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import AuthSplitLayout from "@/components/auth/AuthSplitLayout"

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed:          "Sign-in failed. Please try again.",
  invalid_reset_link:            "That password reset link has expired. Request a new one below.",
  email_verification_required:   "__verify__",
  session_expired:               "Your session expired. Please sign in again.",
}

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVerifyResend, setShowVerifyResend] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const code = searchParams.get("error")
    if (code) {
      const msg = ERROR_MESSAGES[code]
      if (msg === "__verify__") {
        setShowVerifyResend(true)
      } else {
        setError(msg ?? "An error occurred. Please try again.")
      }
    }
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [searchParams])

  function startCooldown() {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return n - 1
      })
    }, 1000)
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowVerifyResend(false)
    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setVerifyEmail(email)
        setShowVerifyResend(true)
      } else {
        setError("Incorrect email or password.")
      }
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  async function handleResendVerification() {
    if (!verifyEmail || resendCooldown > 0) return
    setResending(true)
    await supabase.auth.resend({ type: "signup", email: verifyEmail })
    setResending(false)
    setResendSent(true)
    startCooldown()
  }

  return (
    <div>
      <h2 className="text-white text-2xl font-bold mb-1">Sign in</h2>
      <p className="text-gray-400 text-sm mb-6">Welcome back to Footy Contacts.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {showVerifyResend && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg px-4 py-3 mb-4">
          <p className="text-amber-200 text-sm font-medium mb-1">Email not confirmed</p>
          <p className="text-amber-300/80 text-xs mb-2">
            Please verify your email address before signing in.
            {verifyEmail && <> We sent a link to <span className="font-medium">{verifyEmail}</span>.</>}
          </p>
          {resendSent ? (
            <p className="text-amber-400 text-xs">Verification email sent!</p>
          ) : (
            <button
              onClick={handleResendVerification}
              disabled={resending || resendCooldown > 0}
              className="text-amber-300 text-xs underline hover:no-underline disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
        />
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Password"
            className="w-full px-4 py-3 pr-11 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
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
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </form>

      <div className="flex justify-between text-sm text-gray-400 mt-4">
        <Link href="/forgot-password" className="hover:text-gold">
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:text-gold">
          Create account
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthSplitLayout variant="signin">
      <Suspense fallback={<div className="space-y-3"><div className="h-8 bg-navy-light rounded animate-pulse w-32 mb-6" /><div className="h-12 bg-navy-light rounded-lg animate-pulse" /><div className="h-12 bg-navy-light rounded-lg animate-pulse" /><div className="h-12 bg-navy rounded-lg animate-pulse" /></div>}>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  )
}

