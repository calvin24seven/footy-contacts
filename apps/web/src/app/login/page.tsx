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
  const [googleLoading, setGoogleLoading] = useState(false)
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

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    // browser will redirect; no need to setLoading(false)
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

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 py-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.12] rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 mb-5"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-xs text-gray-500">or</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

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

