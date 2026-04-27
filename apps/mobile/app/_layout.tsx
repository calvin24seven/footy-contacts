import "react-native-url-polyfill/auto"
import { Stack } from "expo-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#222C41" },
          headerTintColor: "#F9D783",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#161E2E" },
        }}
      />
    </QueryClientProvider>
  )
}
