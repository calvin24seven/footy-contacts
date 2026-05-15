import { Text, Hr } from "@react-email/components"
import { BaseEmail } from "./_base"

interface Reactivation4Props {
  firstName: string
  unsubscribeUrl: string
}

export default function Reactivation4Email({ firstName, unsubscribeUrl }: Reactivation4Props) {
  return (
    <BaseEmail unsubscribeUrl={unsubscribeUrl}>
      <Text style={body}>Hi {firstName},</Text>

      <Text style={body}>Quick question.</Text>

      <Text style={{ ...body, fontWeight: "600" }}>
        What type of football contact are you actually trying to find?
      </Text>

      <Text style={{ ...body, marginBottom: "8px" }}>
        You can reply with one word:
      </Text>

      <Text style={list}>
        — scouts
        {"\n"}— agents
        {"\n"}— academy staff
        {"\n"}— club directors
        {"\n"}— coaches
        {"\n"}— media
        {"\n"}— recruiters
        {"\n"}— player reps
        {"\n"}— something else
      </Text>

      <Text style={body}>
        I&apos;m asking because I&apos;m rebuilding Footy Contacts around what users are
        actually searching for — not what I think they need.
      </Text>

      <Text style={body}>
        Reply with the contact type, club, country, or role you care about.
      </Text>

      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />

      <Text style={body}>I&apos;ll read every reply personally.</Text>

      <Text style={signature}>
        — Calvin
        {"\n"}Founder, Footy Contacts
      </Text>
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
  whiteSpace: "pre-line" as const,
}
