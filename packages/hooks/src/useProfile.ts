import { useQuery } from "@tanstack/react-query"
import { supabase } from "@footy/supabase"
import type { Profile } from "@footy/types"

export function useProfile(userId: string | undefined) {
  return useQuery<Profile | null>({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
