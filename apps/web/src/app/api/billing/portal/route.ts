import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const [supabase, stripe] = await Promise.all([createClient(), getStripe()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "no_subscription" }, { status: 404 })
  }

  const origin = req.headers.get("origin") ?? "https://footycontacts.com"

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/app/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
