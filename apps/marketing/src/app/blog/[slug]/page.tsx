import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PortableText } from "@portabletext/react"
import { client } from "@/sanity/lib/client"
import { postBySlugQuery, allSlugsQuery } from "@/sanity/lib/queries"
import { urlFor } from "@/sanity/lib/image"

export const revalidate = 3600

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt: string
  mainImage?: { asset: unknown; alt?: string }
  body: unknown[]
  seoTitle?: string
  seoDescription?: string
}

export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post: Post | null = await client.fetch(postBySlugQuery, { slug })
  if (!post) return {}
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.mainImage?.asset && {
        images: [urlFor(post.mainImage).width(1200).height(630).url()],
      }),
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post: Post | null = await client.fetch(postBySlugQuery, { slug })
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-[#161E2E] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-[#2E3A52]">
        <Link href="/" className="text-[#F9D783] font-bold text-xl tracking-tight">
          Footy Contacts
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Blog
          </Link>
          <Link
            href="https://app.footycontacts.com/signup"
            className="px-4 py-2 text-sm bg-[#F9D783] text-[#222C41] rounded-md font-semibold hover:bg-[#E8C355] transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Article structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.excerpt,
              datePublished: post.publishedAt,
              publisher: {
                "@type": "Organization",
                name: "Footy Contacts",
                url: "https://footycontacts.com",
              },
            }),
          }}
        />

        <p className="text-xs text-gray-500 mb-4">
          {new Date(post.publishedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">{post.title}</h1>
        <p className="text-lg text-gray-400 mb-10 leading-relaxed">{post.excerpt}</p>

        {post.mainImage?.asset && (
          <div className="relative h-72 sm:h-96 w-full rounded-xl overflow-hidden mb-10">
            <Image
              src={urlFor(post.mainImage).width(1200).height(600).url()}
              alt={post.mainImage.alt ?? post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose prose-invert prose-gold max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-a:text-[#F9D783] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-blockquote:border-[#F9D783]">
          {post.body && <PortableText value={post.body} />}
        </div>
      </article>

      {/* CTA */}
      <section className="bg-[#222C41] border-t border-[#2E3A52] mt-16">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Find the right football contacts</h2>
          <p className="text-gray-400 mb-6">
            50,000+ verified agents, scouts and club professionals. Start searching for free.
          </p>
          <Link
            href="https://app.footycontacts.com/signup"
            className="inline-block px-8 py-4 bg-[#F9D783] text-[#222C41] rounded-lg font-bold hover:bg-[#E8C355] transition-colors"
          >
            Create your free account
          </Link>
        </div>
      </section>
    </main>
  )
}
