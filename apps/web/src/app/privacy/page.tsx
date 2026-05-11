export const metadata = { title: "Privacy Policy – Footy Contacts" }

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-gray-200">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: May 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">1. Who we are</h2>
          <p>
            Footy Contacts (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the
            platform available at footycontacts.com. We are the data controller for the personal
            data described in this policy.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">2. Data we collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Account information: name, email address, password (hashed).</li>
            <li>Profile information you choose to provide (city, country, role, etc.).</li>
            <li>Usage data: contacts viewed or unlocked, searches performed.</li>
            <li>Billing information: processed securely by Stripe. We do not store card details.</li>
            <li>Log data: IP address, browser type, pages visited.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">3. How we use your data</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To provide and improve the Footy Contacts service.</li>
            <li>To process payments and manage subscriptions.</li>
            <li>To detect and prevent fraud and abuse.</li>
            <li>To send transactional emails (password reset, invoice receipts).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">4. Data sharing</h2>
          <p>
            We do not sell your personal data. We share data only with trusted sub-processors
            necessary to operate the service (Supabase for database hosting, Stripe for payments,
            Vercel for hosting) and as required by law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">5. Data retention</h2>
          <p>
            We retain your account data while your account is active. You may request deletion at
            any time by contacting support. We retain billing records for 7 years as required by
            applicable law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">6. Your rights</h2>
          <p>
            Depending on your jurisdiction you may have rights including: access, rectification,
            erasure, restriction of processing, data portability, and objection. Contact us at{" "}
            <a href="mailto:privacy@footycontacts.com" className="text-gold hover:underline">
              privacy@footycontacts.com
            </a>{" "}
            to exercise your rights.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">7. Cookies</h2>
          <p>
            We use essential session cookies to keep you logged in. No third-party tracking or
            advertising cookies are used.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">8. Changes</h2>
          <p>
            We may update this policy from time to time. We will notify you of significant changes
            via email or an in-app notice.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
          <p>
            Questions?{" "}
            <a href="mailto:privacy@footycontacts.com" className="text-gold hover:underline">
              privacy@footycontacts.com
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
