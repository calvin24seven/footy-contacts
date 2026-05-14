import { Html, Head, Body, Container, Text, Link, Hr } from "@react-email/components"
import type { ReactNode } from "react"

interface BaseEmailProps {
  children: ReactNode
  unsubscribeUrl?: string
}

export function BaseEmail({ children, unsubscribeUrl }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#f9fafb",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            padding: "40px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <Text
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#16a34a",
              marginBottom: "32px",
              marginTop: 0,
            }}
          >
            Footy Contacts
          </Text>

          {children}

          {unsubscribeUrl && (
            <>
              <Hr style={{ borderColor: "#e5e7eb", marginTop: "32px", marginBottom: "16px" }} />
              <Text
                style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: 0 }}
              >
                <Link href={unsubscribeUrl} style={{ color: "#9ca3af" }}>
                  Unsubscribe
                </Link>
              </Text>
            </>
          )}
        </Container>
      </Body>
    </Html>
  )
}
