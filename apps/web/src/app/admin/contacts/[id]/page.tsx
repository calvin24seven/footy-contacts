import { createAdminClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import ContactEditForm from "./ContactEditForm"
import type { JSX } from "react"

export default async function AdminContactEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<JSX.Element> {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single()

  if (!contact) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/contacts" className="text-gray-400 hover:text-white text-sm">
          ← Contacts
        </Link>
        <span className="text-gray-600">/</span>
        <h1 className="text-xl font-bold text-white">{contact.name}</h1>
      </div>
      <div className="text-xs text-gray-500">
        ID: {contact.id} · Created {new Date(contact.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </div>
      <ContactEditForm contact={contact} />
    </div>
  )
}
