export const metadata = { title: "Terms of Service – Footy Contacts" }

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-gray-200">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: May 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance</h2>
          <p>
            By creating an account or using Footy Contacts you agree to these Terms of Service. If
            you do not agree, do not use the service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">2. Description of service</h2>
          <p>
            Footy Contacts provides a database of football industry contacts. Access to contact
            details is gated by a subscription plan with monthly unlock allowances.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Scrape, bulk-download, or systematically copy the contact database.</li>
            <li>Re-sell, redistribute, or sublicense contact data to third parties.</li>
            <li>Use the service for spam, harassment, or any unlawful purpose.</li>
            <li>Attempt to circumvent rate limits, access controls, or paywalls.</li>
            <li>Use automated tools to access the service without prior written consent.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">4. Subscriptions and billing</h2>
          <p>
            Paid plans are billed monthly or annually in advance. Unused unlocks do not roll over
            between billing periods. You may cancel at any time; cancellation takes effect at the
            end of the current billing period. No refunds are provided for partial periods unless
            required by applicable law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">5. Data accuracy</h2>
          <p>
            We make reasonable efforts to keep contact information accurate, but we cannot
            guarantee accuracy or completeness. Contact details are provided for informational
            purposes only.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms, engage
            in abusive behaviour, or upon reasonable suspicion of fraud, without prior notice.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Footy Contacts shall not be liable for any
            indirect, incidental, or consequential damages arising from use of the service. Our
            total liability shall not exceed the fees you paid in the three months preceding the
            claim.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">8. Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Disputes shall be resolved
            in the courts of England and Wales.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">9. Changes</h2>
          <p>
            We may update these terms. Continued use of the service after notification constitutes
            acceptance of the updated terms.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">10. Contact</h2>
          <p>
            Questions?{" "}
            <a href="mailto:legal@footycontacts.com" className="text-gold hover:underline">
              legal@footycontacts.com
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
