"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"

export interface UnlocksData {
  used: number
  limit: number
  bonus: number
  totalRemaining: number
  periodEnd: string | null
  planName: string
  planCode: string
}

interface UnlocksContextValue {
  data: UnlocksData | null
  refresh: () => void
}

const UnlocksContext = createContext<UnlocksContextValue>({ data: null, refresh: () => {} })

export function useUnlocks(): UnlocksContextValue {
  return useContext(UnlocksContext)
}

/**
 * Single source of truth for unlock data.
 * Fetches once on mount, refreshes on:
 *  - "unlocks-updated" custom event (fired after a contact is unlocked)
 *  - visibilitychange (user returns to tab)
 *
 * All children — UnlocksWidget, WelcomeBanner, etc. — read from this context
 * instead of each making their own /api/account/unlocks call.
 */
export function UnlocksProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UnlocksData | null>(null)

  const refresh = useCallback(() => {
    fetch("/api/account/unlocks")
      .then((r) => r.json())
      .then((d) => setData(d as UnlocksData))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()

    window.addEventListener("unlocks-updated", refresh)

    function onVisibility() {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.removeEventListener("unlocks-updated", refresh)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [refresh])

  return (
    <UnlocksContext.Provider value={{ data, refresh }}>
      {children}
    </UnlocksContext.Provider>
  )
}
