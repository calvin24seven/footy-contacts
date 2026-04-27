import { createClient } from "@/lib/supabase/server"
import ListsClient from "./ListsClient"

export default async function ListsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  return <ListsClient initialLists={lists ?? []} />
}
