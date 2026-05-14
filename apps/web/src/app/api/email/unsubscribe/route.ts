import { NextRequest, NextResponse } from "next/server"
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe"
import { createAdminClient } from "@/lib/supabase/admin"
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

function parseUnsubParams(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  return {
    email:    searchParams.get("email")?.toLowerCase().trim() ?? null,
    category: searchParams.get("category") ?? "marketing",
    token:    searchParams.get("token") ?? null,
  }
}

/**
 * POST: perform the unsubscribe.
 * Called by RFC 8058 one-click from email clients, or by the confirmation page button.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { email, category, token } = parseUnsubParams(req)

  if (!email || !token) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  if (!verifyUnsubscribeToken(email, category, token)) {
    Sentry.captureMessage("Invalid unsubscribe token on POST", {
      level: "warning",
      tags:  { component: "unsubscribe" },
    })
    return NextResponse.json({ error: "Invalid token" }, { status: 403 })
  }

  const supabase = createAdminClient()
  await supabase
    .from("email_suppressions")
    .upsert(
      { email, reason: "unsubscribe", category, source: "user-unsubscribe" },
      { onConflict: "email,category,reason" }
    )

  return NextResponse.json({ unsubscribed: true })
}

/**
 * GET: verify token, then redirect to confirmation page.
 * Does NOT perform the unsubscribe — avoids link-scanner / email-prefetch side effects.
 * The /unsubscribed page renders a "Confirm unsubscribe" button that submits POST back here.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { email, category, token } = parseUnsubParams(req)

  if (!email || !token || !verifyUnsubscribeToken(email, category, token)) {
    if (email && token) {
      Sentry.captureMessage("Invalid unsubscribe token on GET", {
        level: "warning",
        tags:  { component: "unsubscribe" },
      })
    }
    return NextResponse.redirect(new URL("/unsubscribed?error=invalid", req.url))
  }

  // Pass all params to the confirmation page so its form can POST back here
  const confirmUrl = new URL("/unsubscribed", req.url)
  confirmUrl.searchParams.set("email",    email)
  confirmUrl.searchParams.set("category", category)
  confirmUrl.searchParams.set("token",    token)
  return NextResponse.redirect(confirmUrl)
}
