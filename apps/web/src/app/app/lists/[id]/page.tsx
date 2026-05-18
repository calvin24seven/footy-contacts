import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import ExportListButton from "./ExportListButton"
import EditListButton from "./EditListButton"
import ListDetailContactsClient, { type ContactWithMeta } from "./ListDetailContactsClient"

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

  // select(*) would fail — authenticated role only has column-level SELECT
  // (email/phone/linkedin_url were revoked in the phase-5 security migration).
  // Enumerate the columns the role is actually granted.
  const CONTACT_COLS =
    "id, name, organisation, role, category, role_category, country, city," +
    " verified_status, has_email, has_phone, has_linkedin," +
    " visibility_status, suppression_status, created_at, updated_at, organisation_id"

  let contacts: Record<string, unknown>[] = []
  if (contactIds.length > 0) {
    const { data, error: contactsErr } = await supabase
      .from("contacts")
      .select(CONTACT_COLS)
      .in("id", contactIds)
    if (contactsErr) console.error("[list/[id]] contacts query error:", contactsErr)
    contacts = (data ?? []) as unknown as Record<string, unknown>[]
  }

  const isSystem = (list as unknown as { is_system?: boolean }).is_system ?? false
  const listTags = (list as unknown as { tags?: string[] }).tags ?? []

  // Build a lookup: contact_id → added_at (from list_contacts.created_at)
  const addedAtMap: Record<string, string> = Object.fromEntries(
    (listContacts ?? []).map((lc) => [lc.contact_id, lc.created_at ?? new Date().toISOString()])
  )

  // Fetch which contacts the user has already unlocked
  let unlockedSet = new Set<string>()
  if (user && contactIds.length > 0) {
    const { data: unlocks } = await supabase
      .from("contact_unlocks")
      .select("contact_id")
      .eq("user_id", user.id)
      .in("contact_id", contactIds)
    unlockedSet = new Set((unlocks ?? []).map((u) => u.contact_id))
  }

  // Fetch user's other lists for bulk "add to list" action
  const { data: userLists } = await supabase
    .from("lists")
    .select("id, name")
    .eq("user_id", user!.id)
    .neq("id", id)
    .order("created_at", { ascending: false })
  const allLists = userLists ?? []

  // Merge contacts with their added_at timestamps and unlock status
  const contactsWithMeta: ContactWithMeta[] = contacts.map((c) => ({
    id: c.id as string,
    name: (c.name as string) ?? "",
    role: (c.role as string | null) ?? null,
    organisation: (c.organisation as string | null) ?? null,
    category: (c.category as string | null) ?? null,
    country: (c.country as string | null) ?? null,
    city: (c.city as string | null) ?? null,
    verified_status: (c.verified_status as string | null) ?? null,
    has_email: (c.has_email as boolean) ?? false,
    has_phone: (c.has_phone as boolean) ?? false,
    has_linkedin: (c.has_linkedin as boolean) ?? false,
    is_unlocked: unlockedSet.has(c.id as string),
    added_at: addedAtMap[c.id as string] ?? (c.created_at as string) ?? new Date().toISOString(),
  }))

  // Stats computed server-side
  const stats = {
    total: contactsWithMeta.length,
    verified: contactsWithMeta.filter((c) => c.verified_status === "verified").length,
    hasEmail: contactsWithMeta.filter((c) => c.has_email).length,
    hasPhone: contactsWithMeta.filter((c) => c.has_phone).length,
    hasLinkedin: contactsWithMeta.filter((c) => c.has_linkedin).length,
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/app/lists"
              className="text-gray-400 hover:text-white transition-colors text-sm shrink-0"
            >
              ← My Lists
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-2xl font-bold text-white truncate">{list.name}</h1>
          </div>

          {/* Description */}
          {list.description && (
            <p className="text-gray-400 text-sm mt-1">{list.description}</p>
          )}

          {/* Tags */}
          {listTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {listTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gold/10 border border-gold/25 text-gold/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSystem && (
            <EditListButton
              listId={id}
              listName={list.name}
              listDescription={list.description ?? null}
              listTags={listTags}
            />
          )}
          {contacts.length > 0 && <ExportListButton listId={id} />}
        </div>
      </div>

      {/* Stats bar */}
      {stats.total > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-xs text-gray-500">
          <span>{stats.total} contact{stats.total !== 1 ? "s" : ""}</span>
          {stats.verified > 0 && (
            <span className="text-emerald-500">{stats.verified} verified</span>
          )}
          {stats.hasEmail > 0 && <span>{stats.hasEmail} have email</span>}
          {stats.hasPhone > 0 && <span>{stats.hasPhone} have phone</span>}
          {stats.hasLinkedin > 0 && <span>{stats.hasLinkedin} have LinkedIn</span>}
        </div>
      )}

      {/* Contact list (client component handles sort, CTA, remove) */}
      <ListDetailContactsClient
        contacts={contactsWithMeta}
        listId={id}
        isSystem={isSystem}
        allLists={allLists}
      />
    </div>
  )
}

