import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Footy Contacts collects, uses, and protects your personal data.",
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "40px", lineHeight: "1.75" }}>
          This policy explains what personal information we collect, how and why we use it, and the rights you have in relation to your personal data.
        </p>

        <Section title="1. Introduction">
          <P>
            Footy Contacts is committed to protecting your privacy and handling personal data in an open and transparent manner. This Privacy Policy applies to all users of our platform, as well as individuals whose personal data may be included in our database of football contacts.
          </P>
          <P>
            Footy Contacts ("we", "us", "our") is operated by Goalspace LTD, based in the United Kingdom. For the purposes of applicable data protection law, we act as the "data controller" for the personal data we collect and process. We comply with the UK General Data Protection Regulation ("UK GDPR"), the Data Protection Act 2018, and other applicable privacy laws.
          </P>
          <P>
            By using Footy Contacts or providing personal data to us, you acknowledge that you have read and understood this Privacy Policy.
          </P>
        </Section>

        <Section title="2. Personal Data We Collect">
          <SubHeading>Information You Provide to Us (Account Data)</SubHeading>
          <P>When you register for an account or interact with our services, you may provide personal information including your name, email address, password, billing address, and payment details. Payment information is processed by Stripe on our behalf.</P>

          <SubHeading>Publicly Sourced Football Contact Data</SubHeading>
          <P>The core of our platform is information about individuals in the football industry obtained from public directories and third-party data providers. This may include personal data about players, coaches, scouts, agents, club officials, and other professionals. The types of personal data we collect for these contacts include:</P>
          <Ul items={[
            "Name and surname",
            "Job title and role",
            "Organisation or club",
            "Work email address",
            "Phone number (where published)",
            "LinkedIn profile URL (where published)",
            "City and country",
            "Club or company website",
          ]} />
          <P>
            We do not collect sensitive personal data (such as health information, race, or religion). The data is limited to contact and professional details relevant to networking in football, obtained from sources such as club websites, league directories, sports publications, or licensed data providers.
          </P>

          <SubHeading>Automatically Collected Data</SubHeading>
          <P>When you visit our website or use the platform, we automatically collect technical information including your IP address, browser type, device type, operating system, pages viewed, and access times. We use cookies and analytics tools (including Google Analytics) to understand how users interact with Footy Contacts.</P>

          <SubHeading>Data from Correspondence and Support</SubHeading>
          <P>If you contact us via email or support, we will collect the information you provide including your contact details and the content of your message, in order to assist you and maintain records of support interactions.</P>
        </Section>

        <Section title="3. Purposes and Lawful Bases for Processing">
          <Dl items={[
            [
              "Providing and Operating the Service",
              "We use personal data to allow you to use Footy Contacts and to deliver the features of our platform. For registered users, this is generally performance of a contract (UK GDPR Article 6(1)(b)). For football contacts in our database who are not direct users, we rely on legitimate interests (Article 6(1)(f)) — specifically, our legitimate interest in compiling and providing a professional directory that helps connect the football community.",
            ],
            [
              "Managing Subscriptions and Payments",
              "We process personal data to manage billing and payments for paid subscribers, including transmitting payment details to Stripe. Lawful basis: performance of a contract and compliance with legal obligations (for financial record-keeping).",
            ],
            [
              "Communication and Customer Support",
              "We use your email to send service-related communications such as subscription confirmations, renewal notices, and security alerts. Lawful basis: legitimate interests.",
            ],
            [
              "Marketing and Advertising",
              "With your permission, we may send newsletters or promotional offers. Lawful basis: consent (Article 6(1)(a)). You may opt out at any time.",
            ],
            [
              "Analytics and Product Improvement",
              "We process usage data to analyse trends and improve our service. Wherever feasible, we use aggregated or pseudonymised data. Lawful basis: legitimate interests.",
            ],
            [
              "Prevention of Fraud and Legal Compliance",
              "We may process data to enforce our Terms, prevent fraudulent activities, detect misuse, and comply with legal obligations. Lawful basis: legitimate interests and compliance with legal obligations.",
            ],
          ]} />
        </Section>

        <Section title="4. How We Collect Data and Sources">
          <SubHeading>Direct Collection</SubHeading>
          <P>When you sign up or interact with our site, you directly provide personal data such as your login and contact details.</P>

          <SubHeading>Indirect Collection (Third-Party Sources)</SubHeading>
          <P>We obtain contact information from publicly accessible sources and third-party data suppliers, including:</P>
          <Ul items={[
            "Official club and league websites that publish staff directories or contact lists",
            "Sports industry publications and directories",
            "Official league and federation websites",
            "Public records such as company registries",
            "Licensed data providers who aggregate publicly available professional information",
          ]} />
          <P>
            Because the data subjects have not directly provided their data to us, we fulfill transparency requirements through this Privacy Policy (see Section 9). When providing information directly to each individual would involve disproportionate effort, applicable law permits making the information publicly available — which we do by publishing this policy.
          </P>
        </Section>

        <Section title="5. How We Share Personal Data">
          <P>We share personal data with third parties only in certain circumstances and with appropriate safeguards:</P>
          <Ul items={[
            "Service Providers (Processors): Trusted third-party companies including Stripe (payment processing), hosting providers, and analytics tools. These providers process data on our behalf under strict data protection agreements.",
            "Legal Compliance: We may disclose data where required by law, court order, or to protect the rights and safety of Footy Contacts or others.",
            "Business Transfers: In the event of a merger, acquisition, or sale of assets, personal data may be transferred as part of that transaction, subject to appropriate confidentiality protections.",
          ]} />
          <P>We do not sell your personal data to third parties.</P>
        </Section>

        <Section title="6. Data Retention">
          <P>We retain personal data only for as long as necessary to fulfil the purposes for which it was collected or as required by law:</P>
          <Ul items={[
            "Account data is retained for the duration of your account and for a reasonable period after closure (typically 12 months) for legal and business purposes.",
            "Payment records are retained for 7 years to comply with UK financial regulations.",
            "Football contact data in our database is regularly reviewed for accuracy. Individuals may request removal at any time (see Section 9).",
            "Support correspondence is retained for up to 3 years.",
          ]} />
        </Section>

        <Section title="7. Cookies">
          <P>We use essential cookies to operate our platform and non-essential cookies for analytics and advertising. Non-essential cookies are only set with your consent, which you can manage through our cookie consent banner or your browser settings. For more information about the cookies we use, please contact us.</P>
        </Section>

        <Section title="8. Data Security">
          <P>We take appropriate technical and organisational measures to safeguard personal data against unauthorised access, disclosure, alteration, or destruction. These include encrypted connections (HTTPS), access controls, and regular security reviews. While we strive to protect your data, no system is completely secure, and we cannot guarantee absolute security.</P>
        </Section>

        <Section title="9. Your Rights">
          <P>Under UK GDPR and applicable data protection law, you have the following rights regarding your personal data:</P>
          <Dl items={[
            ["Right to Access", "You may request a copy of the personal data we hold about you."],
            ["Right to Rectification", "You may request that we correct inaccurate or incomplete data."],
            ["Right to Erasure", "You may request that we delete your personal data where it is no longer necessary, or where you withdraw consent. See our Data Removal page for how to submit a request."],
            ["Right to Restrict Processing", "You may request that we restrict the processing of your data in certain circumstances."],
            ["Right to Data Portability", "You may request a copy of your personal data in a structured, machine-readable format."],
            ["Right to Object", "You may object to processing based on legitimate interests, including where your data appears in our contact directory."],
            ["Right to Withdraw Consent", "Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing."],
          ]} />
          <P>
            To exercise any of these rights, please email us at <a href="mailto:privacy@footycontacts.com" style={{ color: "#16a34a" }}>privacy@footycontacts.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk" style={{ color: "#16a34a" }}>ico.org.uk</a>.
          </P>
        </Section>

        <Section title="10. International Data Transfers">
          <P>We are based in the United Kingdom and primarily process data within the UK and EEA. Where data is transferred outside these regions (for example, to third-party service providers), we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions.</P>
        </Section>

        <Section title="11. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. Where changes are significant, we will notify users by email or through the platform before the changes take effect. The date at the top of this page reflects when the policy was last updated.</P>
        </Section>

        <Section title="12. Contact Us">
          <P>For questions, concerns, or to exercise your data rights, please contact:</P>
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

function Dl({ items }: { items: [string, string][] }) {
  return (
    <dl style={{ marginBottom: "12px" }}>
      {items.map(([term, desc]) => (
        <div key={term} style={{ marginBottom: "14px", paddingLeft: "0" }}>
          <dt style={{ fontSize: "15px", fontWeight: 600, color: "#374151", marginBottom: "2px" }}>{term}</dt>
          <dd style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.75", marginLeft: "0" }}>{desc}</dd>
        </div>
      ))}
    </dl>
  )
}
