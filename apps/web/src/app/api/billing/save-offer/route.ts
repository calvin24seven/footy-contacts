import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"

export type SaveOfferType = "half_off" | "pause"

const COUPON_CONFIGS: Record<SaveOfferType, {
  id: string
  name: string
  percent_off: number
}> = {
  half_off: {
    id:          "STAY_HALF_OFF",
    name:        "Stay — 50% off next month",
    percent_off: 50,
  },
  pause: {
    id:          "PAUSE_1_MONTH",
    name:        "Pause — 1 month free",
    percent_off: 100,
  },
}

/**
 * POST /api/billing/save-offer
 *
 * Applies a retention discount to the caller's active Stripe subscription.
 * Called when a subscriber chooses a save offer in the cancel retention modal.
 *
 * Body: { offerType: "half_off" | "pause" }
 * Returns: { ok: true } or { error: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body = await req.json() as { offerType?: SaveOfferType }
  const { offerType } = body

  if (!offerType || !COUPON_CONFIGS[offerType]) {
    return NextResponse.json({ error: "invalid_offer_type" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch active subscription
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: "no_active_subscription" }, { status: 404 })
  }

  const stripe = await getStripe()
  const config = COUPON_CONFIGS[offerType]

  // Ensure the coupon exists in Stripe (idempotent create)
  let couponId: string
  try {
    const existing = await stripe.coupons.retrieve(config.id)
    couponId = existing.id
  } catch {
    const created = await stripe.coupons.create({
      id:          config.id,
      name:        config.name,
      percent_off: config.percent_off,
      duration:    "once",
      currency:    "gbp",
    })
    couponId = created.id
  }

  // Apply the coupon to the subscription
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    discounts: [{ coupon: couponId }],
  })

  return NextResponse.json({ ok: true })
}
