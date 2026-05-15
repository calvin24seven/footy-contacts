import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Frame-Options",        value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://cdn.sanity.io",
      "worker-src blob:",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  transpilePackages: ["@footy/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  // Exclude /studio — Sanity Studio requires broad script permissions
  async headers() {
    return [{ source: "/((?!studio).*)", headers: securityHeaders }]
  },
}

export default nextConfig
