import { Text, Button } from "@react-email/components"
import { BaseEmail } from "./_base"

interface ExportReadyEmailProps {
  fileName: string
  downloadUrl: string
  rowCount: number
}

export default function ExportReadyEmail({
  fileName,
  downloadUrl,
  rowCount,
}: ExportReadyEmailProps) {
  return (
    <BaseEmail>
      <Text style={{ fontSize: "22px", fontWeight: "600", color: "#111827", marginTop: 0 }}>
        Your export is ready
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        <strong>{fileName}</strong> has finished exporting with{" "}
        {rowCount.toLocaleString()} row{rowCount !== 1 ? "s" : ""}.
      </Text>
      <Button
        href={downloadUrl}
        style={{
          backgroundColor: "#16a34a",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "15px",
          fontWeight: "600",
          display: "inline-block",
          marginTop: "8px",
          marginBottom: "8px",
        }}
      >
        Download Export
      </Button>
      <Text style={{ fontSize: "14px", color: "#6b7280", marginTop: "16px" }}>
        This download link is valid for 24 hours. If you need to re-download,
        visit your account exports page.
      </Text>
      <Text style={{ fontSize: "14px", color: "#6b7280", marginTop: "32px" }}>
        The Footy Contacts Team
      </Text>
    </BaseEmail>
  )
}
