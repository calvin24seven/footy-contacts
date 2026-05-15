import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

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
