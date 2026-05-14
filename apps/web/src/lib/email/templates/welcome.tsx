import { Text } from "@react-email/components"
import { BaseEmail } from "./_base"

interface WelcomeEmailProps {
  firstName: string
}

export default function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <BaseEmail>
      <Text style={{ fontSize: "16px", color: "#111827", marginTop: 0 }}>
        Hi {firstName},
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Welcome to Footy Contacts! You now have access to the most comprehensive
        football contacts database — thousands of clubs, scouts, agents, and
        decision-makers across professional and semi-professional football.
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Start exploring contacts, unlock profiles, and build your network.
      </Text>
      <Text style={{ fontSize: "14px", color: "#6b7280", marginTop: "32px" }}>
        The Footy Contacts Team
      </Text>
    </BaseEmail>
  )
}
