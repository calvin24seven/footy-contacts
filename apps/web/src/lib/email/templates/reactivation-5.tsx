import { Text, Button, Hr } from "@react-email/components"
import { BaseEmail } from "./_base"

interface Reactivation5Props {
  firstName: string
  unsubscribeUrl: string
  offerEndDate: string
}

export default function Reactivation5Email({
  firstName,
  unsubscribeUrl,
  offerEndDate,
}: Reactivation5Props) {
  return (
    <BaseEmail unsubscribeUrl={unsubscribeUrl}>
      <Text style={body}>Hi {firstName},</Text>

      <Text style={body}>
        If Footy Contacts is useful for the kind of people you&apos;re trying to
        reach, Pro is the next step.
      </Text>

      <Text style={body}>Free gives you 3 unlocks per month.</Text>

      <Text style={{ ...body, marginBottom: "8px" }}>Pro gives you:</Text>

      <Text style={list}>
        — 150 contact unlocks per month
        {"\n"}— 75 CSV exports per month
        {"\n"}— email, phone, and LinkedIn access
        {"\n"}— full search across available contact categories
        {"\n"}— cancel anytime
      </Text>

      <Text style={body}>Normal price: £39/month.</Text>

      <Text style={body}>
        Because you signed up before Footy Contacts was where it needed to be,
        I&apos;ve added a comeback offer for existing users:
      </Text>

      <Text style={{ ...body, fontWeight: "700", fontSize: "18px" }}>
        Your first month of Pro is £19.
      </Text>

      <Text style={body}>
        No long contract. No annual commitment. Just a cheaper first month to
        properly test the database.
      </Text>

      <Button href="https://footycontacts.com/upgrade" style={cta}>
        Upgrade to Pro for £19 →
      </Button>

      <Text style={{ ...body, color: "#6b7280", fontSize: "14px" }}>
        This offer ends on {offerEndDate}.
      </Text>

      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />

      <Text style={body}>
        If Footy Contacts saves you even a few hours of manual LinkedIn
        research, Pro should justify itself.
      </Text>

      <Text style={body}>
        If you&apos;re an agency, club, scout, or recruiter who needs bulk access,
        reply with &ldquo;Agency&rdquo; and I&apos;ll point you to the right plan.
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
