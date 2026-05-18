import { Text, Button, Hr } from "@react-email/components"
import { BaseEmail } from "./_base"

interface WinbackCancelProps {
  firstName: string
  accessUntil: string
  reactivateUrl: string
}

export default function WinbackCancelEmail({
  firstName,
  accessUntil,
  reactivateUrl,
}: WinbackCancelProps) {
  return (
    <BaseEmail>
      <Text style={body}>Hi {firstName},</Text>

      <Text style={body}>
        Your Footy Contacts subscription is set to cancel. You&apos;ll still have
        full Pro access until {accessUntil}.
      </Text>

      <Text style={body}>
        If you cancelled because the price felt too high, or because you
        didn&apos;t get enough out of it this month — reply and let me know.
        I&apos;d rather work something out than lose you.
      </Text>

      <Text style={body}>
        Two things I can do right now:
      </Text>

      <Text style={list}>
        — 50% off your next month (£19.50 instead of £39){"\n"}
        — Skip next month entirely, completely free
      </Text>

      <Text style={body}>
        Either one is one click. No forms.
      </Text>

      <Button href={reactivateUrl} style={cta}>
        See your save options →
      </Button>

      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />

      <Text style={body}>
        If neither of those works, no problem. I&apos;d still appreciate knowing
        what didn&apos;t work for you — reply to this email and it comes straight
        to me.
      </Text>

      <Text style={signature}>— Calvin</Text>
    </BaseEmail>
  )
}

const body = {
  fontSize: "16px",
  color: "#374151",
  lineHeight: "1.7",
  margin: "0 0 16px 0",
}

const list = {
  fontSize: "16px",
  color: "#374151",
  lineHeight: "2",
  margin: "0 0 16px 0",
  whiteSpace: "pre-line" as const,
}

const signature = {
  fontSize: "16px",
  color: "#374151",
  lineHeight: "1.7",
  margin: "24px 0 0 0",
}

const cta = {
  backgroundColor: "#16a34a",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "6px",
  display: "inline-block",
  margin: "8px 0 16px 0",
}
