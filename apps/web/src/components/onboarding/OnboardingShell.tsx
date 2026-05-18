"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { generateSuggestedSearches } from "@/lib/onboarding/suggestions"
import type { SearchSuggestion } from "@/lib/onboarding/suggestions"
import StepWho from "./StepWho"
import StepWhat from "./StepWhat"
import StepWhere from "./StepWhere"
import StepOrg from "./StepOrg"
import OnboardingDone from "./OnboardingDone"

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = "welcome" | "name" | 1 | 2 | 3 | 4 | "done"

interface OnboardingData {
  full_name?: string
  user_type?: string
  goals?: string[]
  preferred_region?: string
  country?: string
  current_club?: string
}

// ── Thin top progress bar ─────────────────────────────────────────────────────
// Fills smoothly as user advances through the 4 numbered steps.

const STEP_PROGRESS: Record<string, number> = { "1": 25, "2": 50, "3": 75, "4": 100 }

function TopProgress({ screen }: { screen: Screen }) {
  const pct = STEP_PROGRESS[String(screen)] ?? 0
  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.04]">
      <div
        className="h-full bg-gold transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="step-animate flex flex-col justify-center min-h-[calc(100vh-56px)] px-8 max-w-lg mx-auto">
      <div className="mb-12">
        <div className="w-8 h-[2px] bg-gold mb-10" />
        <h1 className="text-white text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-6">
          The football<br />network,<br />at your fingertips.
        </h1>
        <p className="text-gray-400 text-base leading-relaxed max-w-xs">
          50,000+ scouts, agents, clubs and coaches across 114 countries.
          Direct contact details — no middleman.
        </p>
      </div>
      <button
        onClick={onContinue}
        className="w-full py-4 bg-gold text-navy-dark font-bold rounded-2xl hover:bg-gold-dark transition-colors text-[15px] mb-4"
      >
        Get started
      </button>
      <p className="text-center text-xs text-gray-600">Takes about 90 seconds</p>
    </div>
  )
}
// ── Name screen ───────────────────────────────────────────────────────────────

function NameScreen({ onNext }: { onNext: (fullName: string) => void }) {
  const [value, setValue] = useState("")
  const trimmed = value.trim()
  return (
    <div className="step-animate flex flex-col justify-center min-h-[calc(100vh-56px)] px-8 max-w-lg mx-auto">
      <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
        What should we<br />call you?
      </h2>
      <p className="text-gray-500 text-sm mb-10">This appears on your account.</p>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your name"
        autoFocus
        autoComplete="name"
        className="w-full px-0 py-3 bg-transparent text-white text-xl border-b border-white/20 focus:outline-none focus:border-gold/70 placeholder-gray-600 transition-colors mb-12"
        onKeyDown={(e) => { if (e.key === "Enter" && trimmed) onNext(trimmed) }}
      />
      <button
        onClick={() => { if (trimmed) onNext(trimmed) }}
        disabled={!trimmed}
        className="w-full py-4 bg-gold text-navy-dark font-bold rounded-2xl hover:bg-gold-dark transition-colors text-[15px] disabled:opacity-30 disabled:cursor-not-allowed mb-3"
      >
        Continue
      </button>
      <button
        type="button"
        onClick={() => onNext("")}
        className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
      >
        Skip
      </button>
    </div>
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

  function goNext(updates: Partial<OnboardingData> = {}) {
    setData((prev) => ({ ...prev, ...updates }))
    setScreen((prev) => {
      if (prev === "welcome") return "name"
      if (prev === "name") return 1
      if (prev === 1) return 2
      if (prev === 2) return 3
      if (prev === 3) return 4
      return "done"
    })
  }

  // Step 4 (region) — writes to DB, then shows done screen
  async function handleDone(updates: Partial<OnboardingData> = {}) {
    const final = { ...data, ...updates }
    setData(final)

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
        full_name: final.full_name ?? null,
        user_type: final.user_type ?? null,
        primary_goals: (final.goals ?? null) as string[] | null,
        preferred_region: final.preferred_region ?? null,
        country: final.country ?? null,
        current_club: final.current_club ?? null,
        onboarding_completed: true,
        onboarding_step: 4,
        onboarding_completed_at: new Date().toISOString(),
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
      if (prev === "name") return "welcome"
      if (prev === 1) return "name"
      if (prev === 2) return 1
      if (prev === 3) return 2
      if (prev === 4) return 3
      return "welcome"
    })
  }

  const showBack = screen !== "welcome" && screen !== "done"

  return (
    <div className="relative min-h-screen bg-navy-dark overflow-hidden">
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-animate { animation: stepIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      {/* Progress bar — thin gold line at top edge */}
      <TopProgress screen={screen} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center">
          <span className="text-white font-bold text-base tracking-tight">Footy</span>
          <span className="text-gold font-bold text-base tracking-tight">Contacts</span>
        </div>
        {showBack && (
          <button
            onClick={goBack}
            disabled={loading}
            aria-label="Go back"
            className="text-gray-500 hover:text-white disabled:opacity-40 transition-colors -mr-1 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Step content */}
      {screen === "welcome" && (
        <WelcomeScreen onContinue={() => goNext()} />
      )}

      {screen === "name" && (
        <NameScreen onNext={(fullName) => goNext({ full_name: fullName })} />
      )}

      {screen === 1 && (
        <div className="step-animate px-8 pt-8 pb-10 max-w-lg mx-auto">
          <StepWho onNext={(userType) => goNext({ user_type: userType })} />
        </div>
      )}

      {screen === 2 && (
        <div className="step-animate px-8 pt-8 pb-10 max-w-lg mx-auto">
          <StepOrg
            userType={data.user_type}
            onNext={(club) => goNext({ current_club: club })}
            onSkip={() => goNext()}
          />
        </div>
      )}

      {screen === 3 && (
        <div className="step-animate px-8 pt-8 pb-10 max-w-lg mx-auto">
          <StepWhat
            onNext={(goals) => goNext({ goals })}
            onSkip={() => goNext({ goals: [] })}
          />
        </div>
      )}

      {screen === 4 && (
        <div className="step-animate px-8 pt-8 pb-10 max-w-lg mx-auto">
          <StepWhere
            onNext={(region, country) =>
              handleDone({ preferred_region: region, country })
            }
            onSkip={() => handleDone()}
            loading={loading}
            error={error}
          />
        </div>
      )}

      {screen === "done" && (
        <OnboardingDone
          suggestions={suggestions}
          onGoToSearch={() => router.push("/app")}
        />
      )}
    </div>
  )
}
