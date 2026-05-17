import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"

/**
 * POST /api/team/seats
 * Body: { additionalSeats: number }
 * Creates a Stripe checkout session for extra team seats.
 * Each additional seat costs £19/mo (separate Stripe price).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body = await req.json() as { additionalSeats?: number }
  const additionalSeats = Number(body.additionalSeats ?? 1)
  if (!Number.isInteger(additionalSeats) || additionalSeats < 1 || additionalSeats > 20) {
    return NextResponse.json({ error: "invalid_seat_count" }, { status: 400 })
  }

  // Must have Agency subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, stripe_customer_id, stripe_subscription_id, plan:plans(code)")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const planCode = (sub?.plan as { code?: string } | null)?.code
  if (planCode !== "agency") {
    return NextResponse.json({ error: "agency_plan_required" }, { status: 403 })
  }

  const stripe = await getStripe()

  // NEXT_PUBLIC_EXTRA_SEAT_PRICE_ID must be set in env to a Stripe price for
  // one seat (unit_amount £1900/month recurring). Quantity = additionalSeats.
  const seatPriceId = process.env.STRIPE_EXTRA_SEAT_PRICE_ID
  if (!seatPriceId) {
    // Fallback: no extra seat price configured — direct to support
    return NextResponse.json({ error: "seats_contact_support" }, { status: 501 })
  }

  const adminSupabase = createAdminClient()
  const { data: team } = await adminSupabase
    .from("teams")
    .select("id, seat_limit")
    .eq("owner_user_id", user.id)
    .maybeSingle()

  if (!team) {
    return NextResponse.json({ error: "team_not_found" }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.footycontacts.com"

  const session = await stripe.checkout.sessions.create({
    mode:       "subscription",
    customer:   sub?.stripe_customer_id ?? undefined,
    line_items: [{ price: seatPriceId, quantity: additionalSeats }],
    metadata:   {
      user_id:           user.id,
      team_id:           team.id,
      additional_seats:  String(additionalSeats),
      action:            "add_team_seats",
    },
    success_url: `${baseUrl}/app/team?seats_added=true`,
    cancel_url:  `${baseUrl}/app/team`,
  })

  return NextResponse.json({ url: session.url })
}
