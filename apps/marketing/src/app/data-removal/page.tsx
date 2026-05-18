import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Data Removal",
  description: "Request removal of your personal data from the Footy Contacts database.",
}

export default function DataRemovalPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: "15px", color: "#0D111C", textDecoration: "none" }}>
            ← Footy Contacts
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px 96px" }}>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>Last updated: May 18, 2026</p>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "8px", lineHeight: 1.2 }}>
          Data Removal &amp; GDPR Rights
        </h1>
        <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "40px", lineHeight: "1.75" }}>
          If your data appears in our database and you want it removed, the process is simple and handled automatically.
        </p>

        {/* Primary request box */}
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "12px",
          padding: "28px",
          marginBottom: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px", background: "#dcfce7",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px",
            }}>
              <svg width="20" height="20" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#15803d", marginBottom: "10px" }}>
                Email us from your work address
              </h2>
              <p style={{ fontSize: "15px", color: "#166534", lineHeight: "1.75", marginBottom: "12px" }}>
                Send an email to{" "}
                <a href="mailto:privacy@footycontacts.com" style={{ color: "#16a34a", fontWeight: 700 }}>
                  privacy@footycontacts.com
                </a>{" "}
                <strong>from the work email address listed in our database</strong>. The subject line can be anything — we process all requests automatically.
              </p>
              <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.75", margin: "0 0 4px 0" }}>
                ✓ &nbsp;You&apos;ll receive a confirmation within 24 hours once your record is removed.
              </p>
              <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.75", margin: 0 }}>
                ✓ &nbsp;Your email is added to a permanent suppression list — it won&apos;t be re-imported in future updates.
              </p>
            </div>
          </div>
        </div>

        {/* Why from work email */}
        <div style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "48px",
        }}>
          <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.75", margin: 0 }}>
            <strong style={{ color: "#374151" }}>Why must it come from the work email?</strong>{" "}
            This verifies you are the person the data belongs to. Anyone can claim to be someone else in a web form — but only you can send an email from your own inbox. This protects contacts in our database from having their data removed by third parties without their knowledge.
          </p>
        </div>

        {/* Manual fallback */}
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "48px",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
            Can&apos;t access that email address?
          </h3>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.75", margin: 0 }}>
            If you no longer have access to the work email in our database, email{" "}
            <a href="mailto:privacy@footycontacts.com" style={{ color: "#16a34a" }}>privacy@footycontacts.com</a>{" "}
            from any address and include your LinkedIn profile URL showing your name and current role. We&apos;ll verify and process manually within 5 business days.
          </p>
        </div>

        <Section title="What data do we hold?">
          <P>
            Footy Contacts is a professional directory of individuals working in the football industry. The data we hold about contacts typically includes:
          </P>
          <Ul items={[
            "Full name and job title",
            "Organisation or club",
            "Work email address (where publicly available)",
            "Phone number (where publicly available)",
            "LinkedIn profile URL (where publicly available)",
            "City and country",
            "Club or company website",
          ]} />
          <P>
            We do not collect sensitive personal data such as health information, race, religion, or financial data about individuals listed in our directory. All data is sourced from publicly available information — club websites, league directories, sports publications, and licensed data providers.
          </P>
          <P>
            We are not a credit bureau or background check service. We do not hold private correspondence, social media activity, or employment history.
          </P>
        </Section>

        <Section title="Your rights under UK GDPR">
          <P>
            If you are based in the United Kingdom or European Union, you have the following rights regarding your personal data:
          </P>
          <Dl items={[
            ["Right to Erasure (Right to be Forgotten)", "You can request that we delete your personal data from our database. Once confirmed, your record will be permanently removed and suppressed so it cannot be re-added in future data updates."],
            ["Right to Rectification", "If any information we hold about you is inaccurate or out of date, you can request a correction."],
            ["Right to Access", "You can request a copy of all personal data we hold about you."],
            ["Right to Object", "You can object to us processing your personal data based on legitimate interests. We will assess your objection and cease processing where appropriate."],
            ["Right to Restrict Processing", "In certain circumstances you can ask us to limit how we use your data while a dispute or request is being resolved."],
          ]} />
        </Section>

        <Section title="Why does Footy Contacts hold this data?">
          <P>
            Footy Contacts operates a professional directory to help people in the football industry — players, agents, coaches, scouts, and club staff — connect and find relevant contacts. The data we hold is professional in nature and is sourced from publicly available sources.
          </P>
          <P>
            Our legal basis for holding and processing this data is <strong>legitimate interests</strong> under UK GDPR Article 6(1)(f). We have determined that providing a professional football industry directory serves a legitimate purpose that is proportionate to the privacy impact, given that:
          </P>
          <Ul items={[
            "The data is professional (not personal/private) in nature",
            "The data was made publicly available by the individuals or their employers",
            "We provide a straightforward mechanism for removal at any time",
            "We do not sell or share this data with third parties for their own marketing",
          ]} />
          <P>
            If you object to this use, you have the right to ask us to remove your data and we will do so promptly.
          </P>
        </Section>

        <Section title="Email marketing and PECR compliance">
          <P>
            Users of Footy Contacts access contact data for professional outreach. Email marketing within the football industry is subject to the Privacy and Electronic Communications Regulations (PECR) as well as the UK GDPR.
          </P>
          <SubHeading>Corporate entities</SubHeading>
          <P>
            Work email addresses belonging to employees of limited companies, PLCs, LLPs, and government departments may be used for B2B marketing under legitimate interests, provided:
          </P>
          <Ul items={[
            "The recipient has an easy way to unsubscribe from marketing",
            "The promoted product or service can be purchased in a professional capacity",
            "The sender clearly identifies themselves and provides contact details",
          ]} />
          <SubHeading>Sole traders and partnerships</SubHeading>
          <P>
            Sole traders and partnerships are treated similarly to consumers under PECR. Marketing to these individuals requires either a prior relationship (soft opt-in) or explicit consent.
          </P>
          <P>
            Users of Footy Contacts are responsible for ensuring their own email marketing activities comply with applicable regulations. We recommend maintaining a suppression list of anyone who has opted out.
          </P>
        </Section>

        <Section title="How we handle removal requests">
          <Ol items={[
            "You email privacy@footycontacts.com from the work email address in our database.",
            "Our system automatically matches the From address against our contact records.",
            "If found: your record is suppressed and removed from search results within 24 hours.",
            "We send a confirmation email to you once the removal is complete.",
            "Your address is added to a permanent suppression list — it cannot be re-imported in future data updates.",
          ]} />
          <P>
            If your address is not found in our database, we will reply within 5 business days to let you know, or to request additional verification if you submitted via the manual path.
          </P>
        </Section>

        <Section title="Complaints">
          <P>
            If you are not satisfied with our response to a data request, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO):
          </P>
          <P>
            <a href="https://ico.org.uk/make-a-complaint" style={{ color: "#16a34a" }}>ico.org.uk/make-a-complaint</a>
            <br />
            Helpline: 0303 123 1113
          </P>
        </Section>

        <Section title="Contact">
          <P>
            For all data-related requests or questions:
          </P>
          <P>
            Footy Contacts / Goalspace LTD<br />
            202 Freston Rd, London W10 6TT, United Kingdom<br />
            <a href="mailto:privacy@footycontacts.com" style={{ color: "#16a34a" }}>privacy@footycontacts.com</a>
          </P>
        </Section>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>
          © 2026 Footy Contacts Ltd. &nbsp;·&nbsp;{" "}
          <Link href="/privacy" style={{ color: "#6b7280" }}>Privacy</Link>
          {" "}·{" "}
          <Link href="/terms" style={{ color: "#6b7280" }}>Terms</Link>
          {" "}·{" "}
          <Link href="/data-removal" style={{ color: "#6b7280" }}>Data Removal</Link>
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #f3f4f6" }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#374151", marginTop: "16px", marginBottom: "6px" }}>
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.75", marginBottom: "12px" }}>
      {children}
    </p>
  )
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.75", marginBottom: "6px", listStyleType: "disc" }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Ol({ items }: { items: string[] }) {
  return (
    <ol style={{ paddingLeft: "20px", marginBottom: "12px" }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.75", marginBottom: "6px", listStyleType: "decimal" }}>
          {item}
        </li>
      ))}
    </ol>
  )
}

function Dl({ items }: { items: [string, string][] }) {
  return (
    <dl style={{ marginBottom: "12px" }}>
      {items.map(([term, desc]) => (
        <div key={term} style={{ marginBottom: "14px" }}>
          <dt style={{ fontSize: "15px", fontWeight: 600, color: "#374151", marginBottom: "2px" }}>{term}</dt>
          <dd style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.75", marginLeft: "0" }}>{desc}</dd>
        </div>
      ))}
    </dl>
  )
}
