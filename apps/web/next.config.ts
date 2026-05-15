import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const securityHeaders = [
  { key: "X-Frame-Options",        value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io",
      "frame-src https://js.stripe.com https://challenges.cloudflare.com",
      "worker-src blob:",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  transpilePackages: ["@footy/supabase", "@footy/types", "@footy/hooks"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

export default withSentryConfig(nextConfig, {
  org:                     process.env.SENTRY_ORG,
  project:                 process.env.SENTRY_PROJECT,
  silent:                  !process.env.CI,
  widenClientFileUpload:   true,
  sourcemaps:              { deleteSourcemapsAfterUpload: true },
  disableLogger:           true,
  automaticVercelMonitors: true,   // cron job health monitoring in Sentry Crons
})
