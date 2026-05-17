import type { NextConfig } from "next"

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.vercel-insights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://vitals.vercel-insights.com wss://*.supabase.co",
  "frame-src https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ")

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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",   value: csp },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

// Sentry build instrumentation disabled on all environments for now.
// Runtime error capture still works via sentry.client/server/edge.config.ts.
export default nextConfig
