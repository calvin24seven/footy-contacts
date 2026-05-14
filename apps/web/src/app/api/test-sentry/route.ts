import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

// Temporary diagnostic endpoint — DELETE after confirming Sentry connection
export async function GET(req: NextRequest): Promise<NextResponse> {
  const eventId = Sentry.captureException(
    new Error("Sentry connection test — footy-contacts (ignore this)"),
    { tags: { component: "sentry-test", level: "diagnostic" } }
  )

  await Sentry.flush(3000)

  return NextResponse.json({
    ok: true,
    eventId: eventId ?? null,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? `configured — starts with ${process.env.NEXT_PUBLIC_SENTRY_DSN.slice(0, 30)}…`
      : "NOT CONFIGURED",
  })
}
