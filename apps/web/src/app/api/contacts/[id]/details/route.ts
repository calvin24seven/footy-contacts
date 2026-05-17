import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/contacts/[id]/details
 *
 * Returns the unlocked contact details (email, phone, linkedin_url) for a
 * contact the authenticated user has already unlocked.
 *
 * The `get_contact_for_user` RPC enforces row-level security: it only returns
 * sensitive fields when the calling user has an entry in contact_unlocks for
 * this contact. If not unlocked, those fields come back as null.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  // Verify the user has actually unlocked this contact before returning anything
  const { data: unlock } = await supabase
    .from("contact_unlocks")
    .select("id")
    .eq("user_id", user.id)
    .eq("contact_id", id)
    .maybeSingle()

  if (!unlock) {
    return NextResponse.json({ error: "not_unlocked" }, { status: 403 })
  }

  // get_contact_for_user returns sensitive fields only when unlocked
  const { data, error } = await supabase.rpc("get_contact_for_user", {
    p_contact_id: id,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const contact = data as {
    email: string | null
    phone: string | null
    linkedin_url: string | null
  }

  return NextResponse.json({
    email: contact.email,
    phone: contact.phone,
    linkedin_url: contact.linkedin_url,
  })
}
