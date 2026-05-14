import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

// Temporary diagnostic endpoint — DELETE after confirming Sentry connection
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Capture as error level so it shows in Sentry Issues view (info is filtered by default)
  const eventId = Sentry.captureException(
    new Error("Sentry connection test — footy-contacts (ignore this)"),
    {
      tags: { component: "sentry-test", level: "diagnostic" },
    }
  )

  // Flush ensures the event is sent before the serverless function terminates
  await Sentry.flush(3000)

  return NextResponse.json({
    ok: true,
    eventId: eventId ?? null,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? `configured — starts with ${process.env.NEXT_PUBLIC_SENTRY_DSN.slice(0, 30)}…`
      : "NOT CONFIGURED — events will be dropped",
  })
}
