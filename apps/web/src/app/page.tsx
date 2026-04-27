import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-navy text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-gold">Footy Contacts</span>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white hover:text-gold transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-gold text-navy rounded-md font-semibold hover:bg-gold-dark transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Football contact intelligence{" "}
          <span className="text-gold">at your fingertips</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
          Search and connect with agents, scouts, clubs, coaches and media professionals
          across world football. Trusted by thousands of football industry professionals.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-gold text-navy rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors"
        >
          Start for free
        </Link>
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
          <div key={f.title} className="bg-navy-light rounded-xl p-6">
            <h3 className="text-gold font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
