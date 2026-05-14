import { NextRequest, NextResponse } from "next/server"
import { getSecret } from "@/lib/secrets"
import { drainEmailQueue } from "@/lib/email/drain"

export const runtime     = "nodejs"
export const maxDuration = 60  // Vercel Pro: up to 300 s; Hobby capped at 10 s

/**
 * GET /api/cron/email-drain
 *
 * Called every 2 minutes by Vercel Cron (Pro plan required).
 * Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET> header
 * via deployment-protection bypass — same pattern as /api/cron/email-verify.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  let cronSecret: string
  try {
    cronSecret = getSecret("cron_secret")
  } catch {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }

  if ((req.headers.get("authorization") ?? "") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const stats = await drainEmailQueue()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
