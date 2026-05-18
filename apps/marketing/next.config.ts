import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@footy/types", "@footy/seo"],
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
