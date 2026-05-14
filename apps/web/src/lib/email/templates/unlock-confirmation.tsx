import { Text } from "@react-email/components"
import { BaseEmail } from "./_base"

interface UnlockConfirmationEmailProps {
  contactName: string
  contactRole?: string
}

export default function UnlockConfirmationEmail({
  contactName,
  contactRole,
}: UnlockConfirmationEmailProps) {
  return (
    <BaseEmail>
      <Text style={{ fontSize: "22px", fontWeight: "600", color: "#111827", marginTop: 0 }}>
        Contact unlocked
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        You have successfully unlocked{" "}
        <strong>{contactName}</strong>
        {contactRole ? ` — ${contactRole}` : ""}.
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        You can view their full contact details including email, phone, and
        social links in your account.
      </Text>
      <Text style={{ fontSize: "14px", color: "#6b7280", marginTop: "32px" }}>
        The Footy Contacts Team
      </Text>
    </BaseEmail>
  )
}
