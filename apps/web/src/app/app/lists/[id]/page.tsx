import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import type { Tables } from "@/database.types"
import ExportListButton from "./ExportListButton"

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify ownership
  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single()

  if (!list) notFound()

  // Get contacts in this list
  const { data: listContacts } = await supabase
    .from("list_contacts")
    .select("contact_id, created_at")
    .eq("list_id", id)
    .order("created_at", { ascending: false })

  const contactIds = listContacts?.map((lc) => lc.contact_id) ?? []

  let contacts: Tables<"contacts">[] = []
  if (contactIds.length > 0) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .in("id", contactIds)
    contacts = data ?? []
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/app/lists"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← My Lists
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-2xl font-bold text-white">{list.name}</h1>
        </div>
        {contacts.length > 0 && <ExportListButton listId={id} />}
      </div>

      {list.description && (
        <p className="text-gray-400 text-sm mb-6">{list.description}</p>
      )}

      {contacts.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-4">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} listId={id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No contacts in this list yet</p>
          <p className="text-sm mb-4">
            Use the &ldquo;Save to list&rdquo; button on any contact to add them here
          </p>
          <Link
            href="/app"
            className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
          >
            Search contacts
          </Link>
        </div>
      )}
    </div>
  )
}

function ContactRow({
  contact,
  listId,
}: {
  contact: Tables<"contacts">
  listId: string
}) {
  return (
    <div className="flex items-center justify-between bg-navy-light rounded-xl px-5 py-4">
      <Link
        href={`/app/contacts/${contact.id}`}
        className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">
          {contact.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium">{contact.name}</p>
          <p className="text-sm text-gray-400 truncate">
            {[contact.role, contact.organisation].filter(Boolean).join(" · ")}
          </p>
        </div>
      </Link>
      <RemoveFromListForm contactId={contact.id} listId={listId} />
    </div>
  )
}

function RemoveFromListForm({
  contactId,
  listId,
}: {
  contactId: string
  listId: string
}) {
  async function removeContact() {
    "use server"
    const supabase = await createClient()
    await supabase
      .from("list_contacts")
      .delete()
      .eq("list_id", listId)
      .eq("contact_id", contactId)

    const { revalidatePath } = await import("next/cache")
    revalidatePath(`/app/lists/${listId}`)
  }

  return (
    <form action={removeContact}>
      <button
        type="submit"
        className="ml-4 text-xs text-gray-500 hover:text-red-400 transition-colors shrink-0"
        title="Remove from list"
      >
        Remove
      </button>
    </form>
  )
}
