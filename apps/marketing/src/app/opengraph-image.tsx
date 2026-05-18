import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Footy Contacts — Search the Football Network"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// ── OG Image (§14 / §18) ──────────────────────────────────────────────────────
// Generates the social preview image for the marketing homepage.
// Displayed when the site is shared on Twitter, LinkedIn, Slack, iMessage, etc.
// Design: navy-dark background, gold accent line top, centred wordmark + headline,
// data strip row, clean sans-serif typography.

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#161E2E",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold ambient glow behind content */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 500,
            background:
              "radial-gradient(ellipse, rgba(249,215,131,0.14) 0%, transparent 65%)",
            borderRadius: "50%",
          }}
        />

        {/* Gold top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #F9D783 0%, #E8C355 100%)",
          }}
        />

        {/* Dot-grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            padding: "0 60px",
          }}
        >
          {/* Wordmark */}
          <div style={{ display: "flex", marginBottom: 36, alignItems: "center" }}>
            <span
              style={{
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Footy
            </span>
            <span
              style={{
                color: "#F9D783",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Contacts
            </span>
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 900,
              marginBottom: 22,
            }}
          >
            Search the Football Network
          </div>

          {/* Sub-headline */}
          <div
            style={{
              fontSize: 26,
              color: "#9CA3AF",
              textAlign: "center",
              maxWidth: 720,
              marginBottom: 52,
              lineHeight: 1.4,
            }}
          >
            50,000+ contacts · 114 countries · scouts, agents, coaches, club staff
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: "flex",
              gap: 0,
              background: "rgba(34, 44, 65, 0.80)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {[
              { val: "55,016", lbl: "contacts" },
              { val: "42,614", lbl: "email fields" },
              { val: "47,154", lbl: "phone fields" },
              { val: "114", lbl: "countries" },
              { val: "3 free", lbl: "unlocks" },
            ].map((s, i) => (
              <div
                key={s.lbl}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "18px 36px",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <span
                  style={{ color: "#F9D783", fontSize: 22, fontWeight: 700 }}
                >
                  {s.val}
                </span>
                <span
                  style={{
                    color: "#6B7280",
                    fontSize: 13,
                    marginTop: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
