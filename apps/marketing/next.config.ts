import type { NextConfig } from "next"

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
}

export default nextConfig
