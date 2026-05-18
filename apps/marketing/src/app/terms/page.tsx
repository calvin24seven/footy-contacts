import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions governing use of the Footy Contacts platform.",
}

export default function TermsPage() {
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
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "32px", lineHeight: 1.2 }}>
          Terms and Conditions
        </h1>

        <Section title="1. Introduction">
          <SubHeading>Company Information</SubHeading>
          <P>
            Footy Contacts is a service owned and operated by Goalspace LTD, with its registered address at 202 Freston Rd, London W10 6TT, United Kingdom.
          </P>

          <SubHeading>Purpose</SubHeading>
          <P>
            These Terms and Conditions ("Terms") govern your use of the Footy Contacts platform (the "Platform"), which provides access to football-related contact data.
          </P>

          <SubHeading>Acceptance of Terms</SubHeading>
          <P>
            By accessing or using the Platform in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must discontinue use of the Platform immediately.
          </P>

          <SubHeading>Modifications to Terms</SubHeading>
          <P>
            Footy Contacts reserves the right to modify or update these Terms at any time. Notice will be provided to users via email or through the Platform. Your continued use of the Platform after such changes become effective constitutes your acceptance of the revised Terms.
          </P>
        </Section>

        <Section title="2. Definitions">
          <Dl items={[
            ["Platform", 'The digital service provided by Footy Contacts, including its website, mobile applications, and any related software or APIs.'],
            ["User", "Any individual or entity that accesses or uses the Platform."],
            ["Account", "A registered user profile that enables access to the Platform's features and services."],
            ["Credits", "Units used to access certain contact information on the Platform, consumed each time specific data is retrieved."],
            ["Subscription", "A paid or free membership plan granting usage rights for a specified period, subject to these Terms."],
            ["Personal Information", "Any data that identifies or could identify a User, including (but not limited to) name, email address, and payment details."],
          ]} />
        </Section>

        <Section title="3. Subscription">
          <SubHeading>Subscription Tiers</SubHeading>
          <P>
            Footy Contacts offers multiple subscription tiers — Free, Pro, and Agency — each providing different levels of access and monthly credit allowances.
          </P>

          <SubHeading>Credits</SubHeading>
          <Ul items={[
            "Credits are non-refundable.",
            "Unused credits expire at the end of each billing cycle and do not roll over to subsequent periods.",
          ]} />

          <SubHeading>Automatic Renewal</SubHeading>
          <Ul items={[
            "Subscriptions automatically renew at the end of each billing period unless canceled by the User at least 24 hours prior to the next billing cycle.",
            "Users must follow the provided cancellation instructions to avoid being charged for the subsequent billing period.",
          ]} />

          <SubHeading>Billing and Payment</SubHeading>
          <Ul items={[
            "Users agree to pay all subscription fees in a timely manner, as described during the sign-up process.",
            "Footy Contacts reserves the right to modify subscription prices upon 30 days' notice to affected Users.",
            "Users may upgrade or downgrade their Subscription at any time, with any applicable prorated charges or credits applied to their Account.",
          ]} />
        </Section>

        <Section title="4. Ownership and License">
          <SubHeading>Ownership</SubHeading>
          <P>Footy Contacts retains full ownership rights to all aspects of the Platform, including any data, content, and software provided.</P>

          <SubHeading>License to Use</SubHeading>
          <P>Users are granted a limited, non-exclusive, revocable license to access and use the Platform for personal or internal business purposes in accordance with these Terms.</P>

          <SubHeading>Restrictions</SubHeading>
          <Ul items={[
            "Users may not copy, modify, reproduce, distribute, sell, rent, or lease Platform content or data without prior written consent from Footy Contacts.",
            "Any unauthorized use of the Platform's content is a breach of these Terms and may result in immediate termination of access and possible legal action.",
          ]} />
        </Section>

        <Section title="5. Privacy Policy">
          <P>
            Users should review the separate <Link href="/privacy" style={{ color: "#16a34a" }}>Privacy Policy</Link> for detailed information on how Footy Contacts collects, processes, and protects Personal Information. Footy Contacts complies with all applicable data protection regulations, including the UK GDPR. Users have the right to access, correct, or delete their Personal Information, as outlined in the Privacy Policy.
          </P>
        </Section>

        <Section title="6. Prohibited Conduct">
          <P>Users must not:</P>
          <Ul items={[
            "Scrape or Resell Data: Scrape, harvest, or resell any contact data accessed through the Platform.",
            "Spam or Fraud: Use the Platform to send unsolicited communications, engage in fraudulent activities, or harass individuals listed in the database.",
            "Disruption: Interfere with or disrupt the Platform's normal operations, including denial-of-service attacks or introducing malware.",
            "Unauthorized Access: Attempt to gain access to restricted areas of the Platform or other Users' Accounts without permission.",
            "Impersonation: Impersonate any individual or entity or misrepresent your affiliation with any person or organization.",
            "Illegal Purpose: Use the Platform for any unlawful purpose or in violation of any applicable laws or regulations.",
            "Account Sharing: Share Account credentials with unauthorized parties or allow multiple individuals to use a single Account.",
            "Infringing Content: Upload or distribute content that is defamatory, obscene, or infringes upon intellectual property or other rights.",
          ]} />
        </Section>

        <Section title="7. Linked Websites and Services">
          <P>The Platform may contain links to external websites or services. Footy Contacts does not endorse or assume any responsibility for the content, security, or privacy practices of those external sites. Users access third-party websites at their own risk and should review the terms and privacy policies of those sites before using them. Footy Contacts is not liable for any loss or damage arising from User interaction with third-party websites or services linked within the Platform.</P>
        </Section>

        <Section title="8. Credits and Billing Practices">
          <SubHeading>Non-Refundable Credits</SubHeading>
          <P>All purchased or allocated Credits are non-refundable and expire at the end of each subscription period.</P>

          <SubHeading>Payment Responsibility</SubHeading>
          <P>Users are responsible for providing valid payment information and ensuring it remains current. Billing is processed automatically on the renewal date; cancellation must be completed prior to renewal to avoid charges for the next period.</P>

          <SubHeading>Failed Payments</SubHeading>
          <P>If a payment fails, Footy Contacts may suspend or terminate access until the issue is resolved. Any applicable taxes will be added to the subscription fee where required by law.</P>

          <SubHeading>Promotions and Refunds</SubHeading>
          <P>
            Promotional offers may be available occasionally and cannot be combined with other discounts unless explicitly stated. All payments are nonrefundable. You have no right to refunds or credits for partially used services. However, at any time and for any reason, we may provide you with a refund, discount, or other consideration at our sole and absolute discretion.
          </P>
        </Section>

        <Section title="9. Platform Updates and Service Interruptions">
          <P>Footy Contacts does not guarantee the Platform will be available without interruption and may occasionally perform maintenance or updates. Platform features, content, and functionality may change over time. While Footy Contacts strives to maintain accurate and current data, it does not warrant that all contact information will be up-to-date or free from errors. Temporary service disruptions do not entitle Users to refunds or compensation unless otherwise specified in these Terms.</P>
        </Section>

        <Section title="10. No Warranty">
          <P>The Platform, including all content, data, and services, is provided on an "as is" and "as available" basis, without warranties of any kind. Footy Contacts disclaims all implied warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. Users acknowledge that they use the Platform at their own risk.</P>
        </Section>

        <Section title="11. Limitation of Liability">
          <P>In no event shall Footy Contacts be liable for any indirect, incidental, special, exemplary, or consequential damages arising out of the use or inability to use the Platform. Footy Contacts' total liability for direct damages is limited to the subscription fees paid by the User in the 12 months preceding any claim. These limitations apply whether the claim is based on contract, tort, negligence, strict liability, or any other legal theory.</P>
        </Section>

        <Section title="12. Governing Law">
          <P>These Terms are governed by and construed in accordance with the laws of England and Wales. Users agree to attempt informal resolution of any disputes before pursuing legal action. Any unresolved legal disputes shall be brought exclusively in the courts of England and Wales.</P>
        </Section>

        <Section title="13. General Provisions">
          <P>If any provision of these Terms is deemed unenforceable or invalid, the remaining provisions shall remain in full force and effect. Users may not assign any rights or obligations under these Terms without the prior written consent of Footy Contacts. These Terms constitute the entire agreement between the User and Footy Contacts concerning the Platform and supersede any prior agreements or understandings.</P>
        </Section>

        <Section title="14. Electronic Communications">
          <P>By creating an Account, you agree to receive electronic communications from Footy Contacts, including service updates, billing notices, and promotional materials. You may opt out of promotional emails at any time; however, you will continue to receive transactional or account-related emails such as billing notices and service updates.</P>
        </Section>

        <Section title="15. Feedback">
          <P>By submitting feedback, you grant Footy Contacts a perpetual, irrevocable, worldwide license to use and commercialize that feedback in any form without compensation or acknowledgment. Feedback submissions are considered voluntary and non-confidential.</P>
        </Section>

        <Section title="16. Contact Information">
          <P>For questions or concerns regarding these Terms, please contact:</P>
          <P>
            Footy Contacts<br />
            202 Freston Rd, London W10 6TT, United Kingdom<br />
            <a href="mailto:hello@footycontacts.com" style={{ color: "#16a34a" }}>hello@footycontacts.com</a>
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
        <div key={term} style={{ marginBottom: "10px" }}>
          <dt style={{ fontSize: "15px", fontWeight: 600, color: "#374151" }}>{term}</dt>
          <dd style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.75", marginLeft: "0" }}>{desc}</dd>
        </div>
      ))}
    </dl>
  )
}
