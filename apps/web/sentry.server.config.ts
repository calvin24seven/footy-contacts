import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  beforeSend(event) {
    if (event.user) {
      delete event.user.email
      delete event.user.username
    }
    // Drop request bodies — may contain template_props with PII
    if (event.request?.data) {
      delete event.request.data
    }
    return event
  },
})
