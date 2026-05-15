import { Text, Button, Hr } from "@react-email/components"
import { BaseEmail } from "./_base"

interface Reactivation2Props {
  firstName: string
  unsubscribeUrl: string
}

export default function Reactivation2Email({ firstName, unsubscribeUrl }: Reactivation2Props) {
  return (
    <BaseEmail unsubscribeUrl={unsubscribeUrl}>
      <Text style={body}>Hi {firstName},</Text>

      <Text style={body}>
        Footy Contacts is built around one simple action:
      </Text>

      <Text style={{ ...body, fontWeight: "600" }}>
        Search for the type of football person you need to reach.
      </Text>

      <Text style={{ ...body, marginBottom: "8px" }}>
        A few searches you can try right now:
      </Text>

      <Text style={list}>
        — scout + England
        {"\n"}— chief scout + Championship
        {"\n"}— academy director + League One
        {"\n"}— agent + Spain
        {"\n"}— head of recruitment + Premier League
        {"\n"}— sporting director + Belgium
        {"\n"}— journalist + Nigeria
        {"\n"}— sports science + Germany
        {"\n"}— player representative + France
      </Text>

      <Text style={body}>
        You do not need to know the person&apos;s name.
      </Text>

      <Text style={body}>
        Search by role, club, country, organisation, or keyword — then unlock
        the contact details if the result is useful.
      </Text>

      <Text style={body}>You have 3 free unlocks on your account.</Text>

      <Button href="https://footycontacts.com/app" style={cta}>
        Try a search →
      </Button>

      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />

      <Text style={body}>
        If you want, reply with the type of contact you&apos;re looking for and
        I&apos;ll tell you what to search.
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
