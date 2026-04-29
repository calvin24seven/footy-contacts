import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { getSecret } from "@/lib/secrets"
import { createAdminClient } from "@/lib/supabase/admin"

// Must read raw body for Stripe signature verification
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 })
  }

  let webhookSecret: string
  let stripe: Stripe
  try {
    ;[webhookSecret, stripe] = await Promise.all([
      getSecret("stripe_webhook_secret"),
      getStripe(),
    ])
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    console.error("Failed to load secrets from Vault:", message)
    return NextResponse.json({ error: "secrets unavailable" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    console.error("Webhook signature verification failed:", message, {
      signatureHeader: signature?.slice(0, 30) + "…",
      secretPrefix: webhookSecret?.slice(0, 10) + "…",
      bodyLength: body.length,
    })
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription" || !session.subscription) break

        const sub = await stripe.subscriptions.retrieve(session.subscription as string, {
          expand: ["items"],
        })
        const userId = sub.metadata?.supabase_user_id ?? session.client_reference_id
        const planId = sub.metadata?.plan_id

        if (!userId) {
          console.error("No supabase_user_id in subscription metadata", sub.id)
          break
        }

        await upsertSubscription(admin, {
          userId,
          planId: planId ?? null,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: session.customer as string,
          status: sub.status,
          ...getPeriodDates(sub),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id
        const planId = sub.metadata?.plan_id

        let resolvedUserId = userId
        if (!resolvedUserId) {
          const { data: existingSub } = await admin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", sub.customer as string)
            .limit(1)
            .maybeSingle()

          if (!existingSub) {
            console.warn("No user found for Stripe customer", sub.customer)
            break
          }
          resolvedUserId = existingSub.user_id
        }

        await upsertSubscription(admin, {
          userId: resolvedUserId,
          planId: planId ?? null,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          status: sub.status,
          ...getPeriodDates(sub),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        await admin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionId = getInvoiceSubscriptionId(invoice as any)
        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items"] })
        const periods = getPeriodDates(sub)
        await admin
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: periods.currentPeriodStart,
            current_period_end: periods.currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionId = getInvoiceSubscriptionId(invoice as any)
        if (!subscriptionId) break

        await admin
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/**
 * In Stripe API v22, current_period_start/end moved from Subscription to SubscriptionItem.
 */
function getPeriodDates(sub: Stripe.Subscription): {
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
} {
  const item = sub.items?.data?.[0]
  if (item?.current_period_start && item?.current_period_end) {
    return {
      currentPeriodStart: new Date(item.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(item.current_period_end * 1000).toISOString(),
    }
  }
  return { currentPeriodStart: null, currentPeriodEnd: null }
}

/**
 * In Stripe v22, Invoice.subscription moved to Invoice.parent.subscription_details.subscription.
 * Support both shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getInvoiceSubscriptionId(invoice: any): string | null {
  const fromParent = invoice?.parent?.subscription_details?.subscription
  if (typeof fromParent === "string") return fromParent
  if (typeof fromParent === "object" && fromParent?.id) return fromParent.id

  const legacy = invoice?.subscription
  if (typeof legacy === "string") return legacy
  if (typeof legacy === "object" && legacy?.id) return legacy.id

  return null
}

async function upsertSubscription(
  admin: ReturnType<typeof createAdminClient>,
  data: {
    userId: string
    planId: string | null
    stripeSubscriptionId: string
    stripeCustomerId: string
    status: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  }
) {
  // Delete any manually-inserted placeholder rows (null stripe_subscription_id) for this user
  // so we don't end up with two active rows after the webhook starts working.
  await admin
    .from("subscriptions")
    .delete()
    .eq("user_id", data.userId)
    .is("stripe_subscription_id", null)

  await admin.from("subscriptions").upsert(
    {
      user_id: data.userId,
      plan_id: data.planId,
      stripe_subscription_id: data.stripeSubscriptionId,
      stripe_customer_id: data.stripeCustomerId,
      status: data.status,
      current_period_start: data.currentPeriodStart,
      current_period_end: data.currentPeriodEnd,
      cancel_at_period_end: data.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_subscription_id",
    }
  )
}
