import { Text, Button, Hr } from "@react-email/components"
import { BaseEmail } from "./_base"

interface Reactivation3Props {
  firstName: string
  unsubscribeUrl: string
}

export default function Reactivation3Email({ firstName, unsubscribeUrl }: Reactivation3Props) {
  return (
    <BaseEmail unsubscribeUrl={unsubscribeUrl}>
      <Text style={body}>Hi {firstName},</Text>

      <Text style={body}>
        Your Footy Contacts account includes 3 free contact unlocks.
      </Text>

      <Text style={{ ...body, marginBottom: "8px" }}>
        An unlock reveals the full available contact record:
      </Text>

      <Text style={list}>
        — email
        {"\n"}— phone
        {"\n"}— LinkedIn
        {"\n"}— role
        {"\n"}— organisation
        {"\n"}— country
      </Text>

      <Text style={body}>The best way to judge the product is simple:</Text>

      <Text style={{ ...body, fontWeight: "600" }}>
        Search for one person you would genuinely want to reach, then use one
        free unlock.
      </Text>

      <Text style={body}>No card needed.</Text>

      <Button href="https://footycontacts.com/app" style={cta}>
        Use a free unlock →
      </Button>

      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />

      <Text style={body}>
        If the contact you need is missing, reply with their role or club and
        I&apos;ll check the database manually.
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
  margin: "8px 0 24px 0",
}
