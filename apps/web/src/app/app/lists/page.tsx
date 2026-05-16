import { createClient } from "@/lib/supabase/server"
import ListsClient from "./ListsClient"

export default async function ListsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rawLists } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  const lists = rawLists ?? []
  const listIds = lists.map((l) => l.id)

  // Fetch all list_contacts rows in one query, then count client-side
  let countByList: Record<string, number> = {}
  if (listIds.length > 0) {
    const { data: contactRows } = await supabase
      .from("list_contacts")
      .select("list_id")
      .in("list_id", listIds)
    countByList = (contactRows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.list_id] = (acc[r.list_id] ?? 0) + 1
      return acc
    }, {})
  }

  const listsWithCounts = lists.map((l) => ({
    ...l,
    // tags and is_system may not yet be in the generated types — cast safely
    tags: ((l as unknown as { tags?: string[] }).tags ?? []) as string[],
    is_system: ((l as unknown as { is_system?: boolean }).is_system ?? false),
    contact_count: countByList[l.id] ?? 0,
  }))

  return <ListsClient initialLists={listsWithCounts} />
}
