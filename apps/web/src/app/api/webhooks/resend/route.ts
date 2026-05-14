import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSecret } from "@/lib/secrets"
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

// Defensive typing — Resend may send different shapes per event type.
// Use optional fields and validate before use rather than asserting a rigid structure.
type ResendWebhookEvent = {
  type: string
  created_at: string
  data: {
    email_id?: string
    from?: string
    to?: string[]
    subject?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Raw body must be read before any parsing — signature covers exact bytes
  const rawBody = await req.text()
  const svixId  = req.headers.get("svix-id") ?? ""

  // Svix verification — Resend's prescribed approach
  const wh = new Webhook(getSecret("resend_webhook_secret"))
  let event: ResendWebhookEvent

  try {
    event = wh.verify(rawBody, {
      "svix-id":        svixId,
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as ResendWebhookEvent
  } catch {
    Sentry.captureMessage("Invalid Resend webhook signature", {
      level: "warning",
      tags:  { component: "email-webhook" },
    })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Defensive guard — email_id required for all status-updating events
  const emailId = event.data?.email_id
  if (!emailId) {
    Sentry.captureMessage("Resend webhook missing email_id", {
      level: "warning",
      tags:  { component: "email-webhook" },
      extra: { eventType: event.type },
    })
    return NextResponse.json({ received: true, ignored: true })
  }

  const supabase = createAdminClient()

  // ── 1. Store event idempotently ─────────────────────────────────────────
  // KEY: provider_event_id = svix-id header (unique per webhook delivery).
  // Do NOT use event.data.email_id — one email sends many events and using
  // email_id would cause events 2+ to be treated as duplicates and dropped.
  const { data: stored } = await supabase
    .from("email_events")
    .upsert(
      {
        provider:          "resend",
        provider_event_id: svixId,          // ← svix-id header, not email_id
        event_type:        event.type,
        resend_message_id: emailId,
        payload:           event as unknown as import("@/database.types").Json,
      },
      { onConflict: "provider,provider_event_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle()

  if (!stored) {
    // Duplicate webhook delivery — Resend retried; already processed
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Link event to job for admin queries
  const { data: job } = await supabase
    .from("email_jobs")
    .select("id")
    .eq("resend_message_id", emailId)
    .maybeSingle()

  if (job) {
    await supabase
      .from("email_events")
      .update({ email_job_id: job.id })
      .eq("id", stored.id)
  } else {
    // Rare: webhook arrived before sender.ts saved resend_message_id, or job was deleted.
    Sentry.captureMessage("Resend webhook could not link to email job", {
      level: "warning",
      tags:  { component: "email-webhook" },
      extra: { emailId, eventType: event.type },
    })
  }

  // ── 2. Apply event state (guarded transitions) ──────────────────────────
  // .in("status", [...]) prevents out-of-order webhooks from regressing terminal states.
  switch (event.type) {
    case "email.sent": {
      // Already marked sent by sender.ts after Resend accepted.
      // Store event only — no state transition needed.
      break
    }
    case "email.delivered": {
      // Non-terminal predecessor states only
      const { error: deliveredErr } = await supabase
        .from("email_jobs")
        .update({ status: "delivered", delivered_at: event.created_at })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivery_delayed"])
      if (deliveredErr)
        Sentry.captureException(deliveredErr, {
          tags:  { component: "email-webhook", eventType: event.type },
          extra: { emailId },
        })
      break
    }
    case "email.delivery_delayed": {
      // Non-terminal — can still move to delivered, bounced, complained
      const { error: delayedErr } = await supabase
        .from("email_jobs")
        .update({ status: "delivery_delayed" })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivery_delayed"])
      if (delayedErr)
        Sentry.captureException(delayedErr, {
          tags:  { component: "email-webhook", eventType: event.type },
          extra: { emailId },
        })
      break
    }
    case "email.bounced": {
      const { error: bouncedErr } = await supabase
        .from("email_jobs")
        .update({ status: "bounced" })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivered", "delivery_delayed"])
      if (bouncedErr)
        Sentry.captureException(bouncedErr, {
          tags:  { component: "email-webhook", eventType: event.type },
          extra: { emailId },
        })
      // Hard bounce — suppress all mail to this address (category: all)
      const toEmailBounce = (event.data.to as string[] | undefined)?.[0]?.toLowerCase()
      if (toEmailBounce) {
        const { error: suppressErr } = await supabase
          .from("email_suppressions")
          .upsert(
            { email: toEmailBounce, reason: "bounce", category: "all", source: "resend-webhook" },
            { onConflict: "email,category,reason" }
          )
        if (suppressErr)
          Sentry.captureException(suppressErr, {
            tags:  { component: "email-webhook", eventType: event.type },
            extra: { emailId },
          })
      }
      break
    }
    case "email.complained": {
      const { error: complainedErr } = await supabase
        .from("email_jobs")
        .update({ status: "complained" })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivered", "delivery_delayed"])
      if (complainedErr)
        Sentry.captureException(complainedErr, {
          tags:  { component: "email-webhook", eventType: event.type },
          extra: { emailId },
        })
      const toEmailComplaint = (event.data.to as string[] | undefined)?.[0]?.toLowerCase()
      if (toEmailComplaint) {
        const { error: suppressErr } = await supabase
          .from("email_suppressions")
          .upsert(
            {
              email:    toEmailComplaint,
              reason:   "complaint",
              category: "all",
              source:   "resend-webhook",
            },
            { onConflict: "email,category,reason" }
          )
        if (suppressErr)
          Sentry.captureException(suppressErr, {
            tags:  { component: "email-webhook", eventType: event.type },
            extra: { emailId },
          })
      }
      break
    }
    default: {
      // opened, clicked, etc. — stored in email_events above; no state transition needed
      break
    }
  }

  return NextResponse.json({ received: true })
}
