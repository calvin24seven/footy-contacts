import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const [supabase, stripe] = await Promise.all([createClient(), getStripe()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body = await req.json() as { planId?: string; planCode?: string; billingPeriod?: "monthly" | "yearly" }
  const { planId, planCode, billingPeriod = "monthly" } = body

  if (!planId && !planCode) {
    return NextResponse.json({ error: "plan_id or plan_code required" }, { status: 400 })
  }

  // Fetch plan by id or code
  const planQuery = supabase.from("plans").select("*")
  const { data: plan } = await (
    planId
      ? planQuery.eq("id", planId).single()
      : planQuery.eq("code", planCode!).eq("is_active", true).single()
  )

  if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 })

  const priceId = billingPeriod === "yearly" ? plan.stripe_yearly_price_id : plan.stripe_monthly_price_id

  if (!priceId) {
    return NextResponse.json(
      { error: "This plan is not yet available for purchase. Please try again soon." },
      { status: 422 }
    )
  }

  const adminClient = createAdminClient()

  // Fetch or create Stripe customer
  const { data: existingSub } = await adminClient
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let customerId = existingSub?.stripe_customer_id

  if (!customerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
  }

  const origin = req.headers.get("origin") ?? "https://footycontacts.com"

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/app/billing?success=true`,
    cancel_url: `${origin}/app/billing`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
    },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
