"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import type { JSX, ReactNode } from "react"

const isDev = process.env.NODE_ENV === "development"

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDev && <DevTools />}
    </QueryClientProvider>
  )
}

// Loaded only in development — zero impact on production bundle
function DevTools() {
  const { ReactQueryDevtools } = require("@tanstack/react-query-devtools")
  return <ReactQueryDevtools initialIsOpen={false} />
}
