import { Text, Link, Button, Hr } from "@react-email/components"
import { BaseEmail } from "./_base"

interface Reactivation1Props {
  firstName: string
  unsubscribeUrl: string
}

export default function Reactivation1Email({ firstName, unsubscribeUrl }: Reactivation1Props) {
  return (
    <BaseEmail unsubscribeUrl={unsubscribeUrl}>
      <Text style={body}>Hi {firstName},</Text>

      <Text style={body}>
        You signed up to Footy Contacts at some point over the last year.
      </Text>

      <Text style={body}>
        If you tried it and the experience felt broken, confusing, or unfinished
        — you were not imagining it.
      </Text>

      <Text style={body}>
        I built the product, but I didn&apos;t give it the attention it needed after
        launch. Some of the core flows were not good enough, and that is on me.
      </Text>

      <Text style={body}>
        I&apos;ve now come back to it properly, fixed the main user flows, and reopened
        the database.
      </Text>

      <Text style={{ ...body, marginBottom: "8px" }}>
        Here is what is inside Footy Contacts today:
      </Text>

      <Text style={list}>
        — 55,016 football industry contacts in the database
        {"\n"}— 12,422 currently published and searchable
        {"\n"}— 42,614 contacts with email fields
        {"\n"}— 47,154 contacts with phone fields
        {"\n"}— 54,996 LinkedIn profiles
        {"\n"}— 114 countries covered
      </Text>

      <Text style={body}>
        You can search for scouts, agents, academy staff, club directors,
        coaches, recruiters, player reps, media contacts, and more.
      </Text>

      <Text style={body}>
        You also have 3 free unlocks on your account. No card needed.
      </Text>

      <Text style={body}>Search for one person you have been meaning to reach:</Text>

      <Button
        href="https://footycontacts.com/app"
        style={cta}
      >
        Search Footy Contacts →
      </Button>

      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />

      <Text style={body}>
        If anything feels broken or you cannot find what you need, reply to
        this email. I&apos;ll read it personally.
      </Text>

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
