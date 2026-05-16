"use client"

/**
 * Shared navigation-pending state used by SearchBar, SearchFilters, and
 * the results area. A single useTransition lives here so all three
 * components participate in the same React transition — one spinner/
 * dim covers every way the user can change the search results.
 */

import { createContext, useContext, useTransition, type TransitionStartFunction } from "react"

interface SearchTransitionCtx {
  isPending: boolean
  startTransition: TransitionStartFunction
}

const SearchTransitionContext = createContext<SearchTransitionCtx>({
  isPending: false,
  startTransition: (fn) => fn(),
})

export function useSearchTransition() {
  return useContext(SearchTransitionContext)
}

export function SearchTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()
  return (
    <SearchTransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </SearchTransitionContext.Provider>
  )
}
