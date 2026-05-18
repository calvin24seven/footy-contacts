import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { client } from "@/sanity/lib/client"
import { allPostsQuery } from "@/sanity/lib/queries"
import { urlFor } from "@/sanity/lib/image"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights, news and guides for football agents, scouts and club professionals.",
}

interface PostSummary {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt: string
  mainImage?: { asset: { _ref: string; _type: string }; alt?: string }
}

function readingTime(excerpt: string) {
  const words = excerpt.trim().split(/\s+/).length
  // excerpt is ~1/8 of a post; estimate full post word count
  const estimated = words * 8
  return Math.max(1, Math.round(estimated / 220))
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function BlogPage() {
  const posts: PostSummary[] = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    ? await client.fetch(allPostsQuery)
    : []

  const [featured, ...rest] = posts

  return (
    <main className="min-h-screen bg-[#0f1623] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0f1623]/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="text-[#F9D783] font-bold text-xl tracking-tight">
            Footy Contacts
          </Link>
          <Link
            href="https://app.footycontacts.com/signup"
            className="px-4 py-2 text-sm bg-[#F9D783] text-[#1a2235] rounded-lg font-semibold hover:bg-[#f0c940] transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <p className="text-[#F9D783] text-sm font-medium tracking-widest uppercase mb-3">
          The Blog
        </p>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Football industry insights
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          Guides and analysis for scouts, agents, recruiters and club professionals.
        </p>
      </section>

      {posts.length === 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-32 text-center text-gray-500 pt-16">
          No posts yet — check back soon.
        </section>
      )}

      {/* Featured post */}
      {featured && (
        <section className="max-w-6xl mx-auto px-6 mb-12">
          <Link
            href={`/blog/${featured.slug.current}`}
            className="group relative flex flex-col sm:flex-row gap-8 bg-[#1a2438] rounded-2xl overflow-hidden border border-white/5 hover:border-[#F9D783]/30 transition-all duration-300"
          >
            {featured.mainImage?.asset ? (
              <div className="relative sm:w-1/2 h-64 sm:h-auto shrink-0">
                <Image
                  src={urlFor(featured.mainImage).width(900).height(500).url()}
                  alt={featured.mainImage.alt ?? featured.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="sm:w-1/2 h-64 sm:h-auto shrink-0 bg-gradient-to-br from-[#1e2d45] to-[#2a3d5a] flex items-center justify-center">
                <span className="text-6xl opacity-20">⚽</span>
              </div>
            )}
            <div className="flex flex-col justify-center p-8">
              <span className="inline-flex items-center gap-1.5 text-[#F9D783] text-xs font-semibold tracking-widest uppercase mb-4">
                Featured
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold leading-snug mb-4 group-hover:text-[#F9D783] transition-colors">
                {featured.title}
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6 line-clamp-3">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatDate(featured.publishedAt)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span>{readingTime(featured.excerpt)} min read</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Post grid */}
      {rest.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-6">
            More articles
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group flex flex-col bg-[#1a2438] rounded-xl overflow-hidden border border-white/5 hover:border-[#F9D783]/30 transition-all duration-300"
              >
                {post.mainImage?.asset ? (
                  <div className="relative h-44 w-full shrink-0">
                    <Image
                      src={urlFor(post.mainImage).width(600).height(300).url()}
                      alt={post.mainImage.alt ?? post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="h-2 w-full bg-gradient-to-r from-[#F9D783]/40 to-[#F9D783]/10" />
                )}
                <div className="flex flex-col flex-1 p-6">
                  <h3 className="text-base font-semibold leading-snug mb-3 group-hover:text-[#F9D783] transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{readingTime(post.excerpt)} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
