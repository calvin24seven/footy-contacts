import { Text, Button, Section } from "@react-email/components"
import { BaseEmail } from "./_base"

interface TeamInviteEmailProps {
  inviterName: string
  teamName: string
  acceptUrl: string
}

export default function TeamInviteEmail({
  inviterName,
  teamName,
  acceptUrl,
}: TeamInviteEmailProps) {
  return (
    <BaseEmail>
      <Text style={{ fontSize: "16px", color: "#111827", marginTop: 0 }}>
        You&apos;ve been invited to join a team on Footy Contacts.
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        <strong>{inviterName}</strong> has invited you to join{" "}
        <strong>{teamName}</strong> on Footy Contacts — giving you shared access
        to their Agency plan, including unlimited contact unlocks and 500 CSV
        exports per month.
      </Text>
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <Button
          href={acceptUrl}
          style={{
            backgroundColor: "#F9D783",
            color: "#161E2E",
            padding: "14px 32px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "15px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Accept invitation →
        </Button>
      </Section>
      <Text style={{ fontSize: "13px", color: "#9ca3af", lineHeight: "1.5" }}>
        This invitation expires in 7 days. If you don&apos;t have a Footy
        Contacts account yet, you&apos;ll be prompted to create one when you
        click the link above.
      </Text>
      <Text style={{ fontSize: "13px", color: "#9ca3af" }}>
        If you weren&apos;t expecting this invitation, you can safely ignore this
        email.
      </Text>
      <Text style={{ fontSize: "14px", color: "#6b7280", marginTop: "32px" }}>
        The Footy Contacts Team
      </Text>
    </BaseEmail>
  )
}
