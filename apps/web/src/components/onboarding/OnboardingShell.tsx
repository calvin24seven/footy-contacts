"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { generateSuggestedSearches } from "@/lib/onboarding/suggestions"
import type { SearchSuggestion } from "@/lib/onboarding/suggestions"
import StepWho from "./StepWho"
import StepWhat from "./StepWhat"
import StepWhere from "./StepWhere"
import OnboardingDone from "./OnboardingDone"

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = "welcome" | 1 | 2 | 3 | "done"

interface OnboardingData {
  user_type?: string
  goals?: string[]
  preferred_region?: string
  country?: string
}

// ── Progress bar ──────────────────────────────────────────────────────────────
// Three segments. completed = gold, active = gold/60, upcoming = navy-light.

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1.5" style={{ width: 240 }} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
      {([1, 2, 3] as const).map((s) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            s < step
              ? "bg-gold"
              : s === step
              ? "bg-gold/60"
              : "bg-navy-light"
          }`}
        />
      ))}
    </div>
  )
}

// ── Welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-8">
        <svg
          className="w-8 h-8 text-gold"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-white text-2xl font-bold mb-3 tracking-tight">
        Let&apos;s set up your access.
      </h1>
      <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-xs mx-auto">
        This takes 2 minutes. We&apos;ll use your answers to show you the right
        contacts and opportunities from the start.
      </p>

      <button
        onClick={onContinue}
        className="w-full py-4 bg-gold text-navy-dark font-bold rounded-xl hover:bg-gold-dark transition-colors text-base"
      >
        Continue →
      </button>
    </div>
  )
}

// ── Back button ───────────────────────────────────────────────────────────────

function BackButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm mb-5 transition-colors"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back
    </button>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function OnboardingShell() {
  const [screen, setScreen] = useState<Screen>("welcome")
  const [data, setData] = useState<OnboardingData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])

  const router = useRouter()
  const supabase = createClient()

  // Advance to the next step, merging new data
  function goNext(updates: Partial<OnboardingData> = {}) {
    setData((prev) => ({ ...prev, ...updates }))
    setScreen((prev) => {
      if (prev === "welcome") return 1
      if (prev === 1) return 2
      if (prev === 2) return 3
      return "done"
    })
  }

  // Step 3 completion — merges final data, writes to DB, then shows done screen
  async function handleDone(updates: Partial<OnboardingData> = {}) {
    const final = { ...data, ...updates }
    setData(final)

    // Compute chips from the completed profile before async work
    const chips = generateSuggestedSearches(
      final.user_type,
      final.goals,
      final.preferred_region,
    )

    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        user_type: final.user_type ?? null,
        primary_goals: (final.goals ?? null) as string[] | null,
        preferred_region: final.preferred_region ?? null,
        country: final.country ?? null,
        onboarding_completed: true,
        onboarding_step: 3,
      },
      { onConflict: "id" },
    )

    setLoading(false)

    if (upsertError) {
      setError("Something went wrong. Please try again.")
      return
    }

    setSuggestions(chips)
    setScreen("done")
  }

  function goBack() {
    setScreen((prev) => {
      if (prev === 1) return "welcome"
      if (prev === 2) return 1
      if (prev === 3) return 2
      return "welcome"
    })
  }

  const numericStep =
    screen === 1 || screen === 2 || screen === 3 ? screen : null

  return (
    <div className="min-h-screen bg-navy-dark flex flex-col">
      {/* ── Top bar ── */}
      <div className="relative flex items-center justify-between px-6 py-5">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <span className="text-white font-bold text-lg tracking-tight">Footy</span>
          <span className="text-gold font-bold text-lg tracking-tight">Contacts</span>
        </div>

        {/* Progress bar — centred absolutely, only during steps 1–3 */}
        {numericStep && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <ProgressBar step={numericStep} />
          </div>
        )}
      </div>

      {/* ── Step content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {screen === "welcome" && (
            <WelcomeScreen onContinue={() => setScreen(1)} />
          )}

          {screen === 1 && (
            <StepWho onNext={(userType) => goNext({ user_type: userType })} />
          )}

          {screen === 2 && (
            <>
              <BackButton onClick={goBack} />
              <StepWhat
                onNext={(goals) => goNext({ goals })}
                onSkip={() => goNext({ goals: [] })}
              />
            </>
          )}

          {screen === 3 && (
            <>
              <BackButton onClick={goBack} disabled={loading} />
              <StepWhere
                onNext={(region, country) =>
                  handleDone({ preferred_region: region, country })
                }
                onSkip={() => handleDone()}
                loading={loading}
                error={error}
              />
            </>
          )}

          {screen === "done" && (
            <OnboardingDone
              suggestions={suggestions}
              onGoToSearch={() => router.push("/app")}
            />
          )}
        </div>
      </div>
    </div>
  )
}
