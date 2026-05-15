import type { NextConfig } from "next"

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

// Sentry build instrumentation disabled on all environments for now.
// Runtime error capture still works via sentry.client/server/edge.config.ts.
export default nextConfig
