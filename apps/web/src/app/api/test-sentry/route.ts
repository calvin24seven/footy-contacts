import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

// Temporary diagnostic endpoint — DELETE after confirming Sentry connection
export async function GET(req: NextRequest): Promise<NextResponse> {
  const eventId = Sentry.captureMessage("Sentry connection test — footy-contacts", {
    level: "info",
    tags: { component: "sentry-test" },
  })

  return NextResponse.json({
    ok: true,
    eventId: eventId ?? null,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? "configured (value hidden)"
      : "NOT CONFIGURED — events will be dropped",
  })
}
