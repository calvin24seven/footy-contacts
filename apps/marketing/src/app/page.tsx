import Link from "next/link"

const APP_URL = "https://app.footycontacts.com"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#161E2E] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-[#F9D783] font-bold text-xl tracking-tight">
          Footy Contacts
        </span>
        <div className="flex gap-4 items-center">
          <Link
            href="/blog"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href={`${APP_URL}/login`}
            className="text-sm text-white hover:text-[#F9D783] transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href={`${APP_URL}/signup`}
            className="px-4 py-2 text-sm bg-[#F9D783] text-[#222C41] rounded-md font-semibold hover:bg-[#E8C355] transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-[#2E3A52] text-[#F9D783] text-xs font-medium mb-6 tracking-wide uppercase">
          Trusted by football professionals worldwide
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
          Football contact intelligence{" "}
          <span className="text-[#F9D783]">at your fingertips</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Search and connect with agents, scouts, clubs, coaches and media
          professionals across world football. 50,000+ verified contacts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`${APP_URL}/signup`}
            className="inline-block px-8 py-4 bg-[#F9D783] text-[#222C41] rounded-lg font-bold text-lg hover:bg-[#E8C355] transition-colors"
          >
            Start for free
          </Link>
          <Link
            href="/blog"
            className="inline-block px-8 py-4 bg-[#2E3A52] text-white rounded-lg font-semibold text-lg hover:bg-[#3a4a66] transition-colors"
          >
            Read the blog
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-6">
        {[
          {
            title: "50,000+ contacts",
            desc: "Agents, scouts, coaches, media and club staff — verified and updated regularly.",
          },
          {
            title: "Advanced search",
            desc: "Filter by country, role, level, organisation and more to find exactly who you need.",
          },
          {
            title: "Unlock & connect",
            desc: "Unlock contact details including email, phone and social profiles instantly.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-[#2E3A52] rounded-xl p-6 border border-[#3a4a66]">
            <h3 className="text-[#F9D783] font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA strip */}
      <section className="bg-[#222C41] border-t border-[#2E3A52]">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to grow your network?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of agents, scouts and club staff already using Footy
            Contacts to find the right people faster.
          </p>
          <Link
            href={`${APP_URL}/signup`}
            className="inline-block px-8 py-4 bg-[#F9D783] text-[#222C41] rounded-lg font-bold text-lg hover:bg-[#E8C355] transition-colors"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2E3A52] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Footy Contacts. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href={`${APP_URL}/privacy`} className="hover:text-white transition-colors">Privacy</Link>
            <Link href={`${APP_URL}/terms`} className="hover:text-white transition-colors">Terms</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
