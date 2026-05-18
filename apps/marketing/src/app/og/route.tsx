import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get("title") ?? "Footy Contacts"
  const subtitle = searchParams.get("subtitle") ?? null
  const countParam = searchParams.get("count")
  const count = countParam ? parseInt(countParam, 10) : null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#161E2E",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: "#F9D783",
              fontWeight: 900,
              fontSize: "28px",
              letterSpacing: "-0.5px",
            }}
          >
            FC
          </span>
          <span style={{ color: "#9CA3AF", fontSize: "20px", fontWeight: 600 }}>
            Footy Contacts
          </span>
        </div>

        {/* Middle: Title + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: title.length > 30 ? "52px" : "64px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ color: "#9CA3AF", fontSize: "28px", fontWeight: 500 }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom: count badge + tagline */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {count !== null && !isNaN(count) ? (
            <div
              style={{
                backgroundColor: "#F9D783",
                color: "#161E2E",
                fontWeight: 700,
                fontSize: "20px",
                padding: "8px 20px",
                borderRadius: "8px",
              }}
            >
              {count.toLocaleString()} contacts
            </div>
          ) : (
            <div />
          )}
          <div style={{ color: "#6B7280", fontSize: "18px" }}>
            footycontacts.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  )
}
