"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface VerificationBannerProps {
  email: string
}

export default function VerificationBanner({ email }: VerificationBannerProps) {
  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function startCooldown() {
    setCooldown(60)
    timerRef.current = setInterval(() => {
      setCooldown((n) => {
        if (n <= 1) { clearInterval(timerRef.current!); return 0 }
        return n - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (resending || cooldown > 0) return
    setResending(true)
    await supabase.auth.resend({ type: "signup", email })
    setResending(false)
    setSent(true)
    startCooldown()
  }

  return (
    <div className="mx-4 mt-3 mb-0 flex items-start gap-3 px-4 py-3 bg-amber-900/30 border border-amber-700/50 rounded-xl">
      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-amber-200 text-sm">
          <span className="font-semibold">Verify your email</span> to unlock contact details.{" "}
          We sent a link to{" "}
          <span className="font-medium text-amber-100 truncate">{email}</span>.
        </p>

        {sent ? (
          <p className="text-amber-400 text-xs mt-1">Verification email sent!</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-amber-300 text-xs mt-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend verification email"}
          </button>
        )}
      </div>
    </div>
  )
}
