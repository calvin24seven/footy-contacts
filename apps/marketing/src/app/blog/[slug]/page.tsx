import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PortableText, type PortableTextBlock } from "@portabletext/react"
import { client } from "@/sanity/lib/client"
import { postBySlugQuery, allSlugsQuery } from "@/sanity/lib/queries"
import { urlFor } from "@/sanity/lib/image"
import { buildArticleSchema, buildBreadcrumbSchema, buildCanonicalUrl } from "@footy/seo"

export const revalidate = 3600

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt: string
  mainImage?: { asset: { _ref: string; _type: string }; alt?: string }
  body: PortableTextBlock[]
  seoTitle?: string
  seoDescription?: string
}

function readingTime(blocks: PortableTextBlock[] | null | undefined) {
  if (!blocks?.length) return 1
  const words = blocks.reduce((acc, block) => {
    if (block._type !== "block") return acc
    const text = (block.children as Array<{ text?: string }> | undefined)
      ?.map((c) => c.text ?? "")
      .join(" ") ?? ""
    return acc + text.trim().split(/\s+/).filter(Boolean).length
  }, 0)
  return Math.max(1, Math.round(words / 220))
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return []
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

  const mins = readingTime(post.body)

  return (
    <main className="min-h-screen bg-[#0f1623] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0f1623]/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="text-[#F9D783] font-bold text-xl tracking-tight">
            Footy Contacts
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← All posts
            </Link>
            <Link
              href="https://app.footycontacts.com/signup"
              className="px-4 py-2 text-sm bg-[#F9D783] text-[#1a2235] rounded-lg font-semibold hover:bg-[#f0c940] transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticleSchema({
              headline: post.title,
              description: post.excerpt,
              url: buildCanonicalUrl(`/blog/${post.slug.current}`),
              publishedAt: post.publishedAt,
              ...(post.mainImage?.asset && {
                imageUrl: urlFor(post.mainImage).width(1200).height(630).url(),
              }),
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbSchema([
              { name: "Home", url: "https://footycontacts.com" },
              { name: "Blog", url: "https://footycontacts.com/blog" },
              { name: post.title, url: buildCanonicalUrl(`/blog/${post.slug.current}`) },
            ]),
          ),
        }}
      />

      <article className="max-w-3xl mx-auto px-6 pt-14 pb-20">
        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-6">
          <span>
            {new Date(post.publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span>{mins} min read</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
          {post.title}
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-10 border-l-2 border-[#F9D783]/40 pl-4">
          {post.excerpt}
        </p>

        {post.mainImage?.asset && (
          <div className="relative h-72 sm:h-[26rem] w-full rounded-2xl overflow-hidden mb-12">
            <Image
              src={urlFor(post.mainImage).width(1200).height(600).url()}
              alt={post.mainImage.alt ?? post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose prose-invert max-w-none
          prose-p:text-gray-300 prose-p:leading-[1.85] prose-p:text-[1.0625rem]
          prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-a:text-[#F9D783] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white
          prose-blockquote:border-l-[3px] prose-blockquote:border-[#F9D783]/50
          prose-blockquote:text-gray-400 prose-blockquote:not-italic prose-blockquote:pl-5
          prose-li:text-gray-300 prose-li:marker:text-[#F9D783]
          prose-hr:border-white/10">
          {post.body && <PortableText value={post.body} />}
        </div>
      </article>

      {/* CTA banner */}
      <section className="border-t border-white/5 bg-gradient-to-b from-[#0f1623] to-[#1a2438]">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-[#F9D783] text-xs font-semibold tracking-widest uppercase mb-4">
            Footy Contacts
          </p>
          <h2 className="text-3xl font-bold mb-4">
            Find the right football contacts
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            50,000+ verified agents, scouts and club professionals across 114 countries.
          </p>
          <Link
            href="https://app.footycontacts.com/signup"
            className="inline-block px-8 py-4 bg-[#F9D783] text-[#1a2235] rounded-xl font-bold text-base hover:bg-[#f0c940] transition-colors"
          >
            Start for free — 3 unlocks included
          </Link>
        </div>
      </section>
    </main>
  )
}
