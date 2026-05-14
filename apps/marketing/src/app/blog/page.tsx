import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { client } from "@/sanity/lib/client"
import { allPostsQuery } from "@/sanity/lib/queries"
import { urlFor } from "@/sanity/lib/image"

export const revalidate = 3600 // re-fetch from Sanity at most once per hour

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

export default async function BlogPage() {
  const posts: PostSummary[] = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    ? await client.fetch(allPostsQuery)
    : []

  return (
    <main className="min-h-screen bg-[#161E2E] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-[#2E3A52]">
        <Link href="/" className="text-[#F9D783] font-bold text-xl tracking-tight">
          Footy Contacts
        </Link>
        <Link
          href="https://app.footycontacts.com/signup"
          className="px-4 py-2 text-sm bg-[#F9D783] text-[#222C41] rounded-md font-semibold hover:bg-[#E8C355] transition-colors"
        >
          Get started
        </Link>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-8">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-gray-400">
          Insights for football agents, scouts and club professionals.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 grid gap-8 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug.current}`}
            className="group block bg-[#2E3A52] rounded-xl overflow-hidden border border-[#3a4a66] hover:border-[#F9D783] transition-colors"
          >
            {post.mainImage?.asset && (
              <div className="relative h-48 w-full">
                <Image
                  src={urlFor(post.mainImage).width(800).height(400).url()}
                  alt={post.mainImage.alt ?? post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-2">
                {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h2 className="text-lg font-semibold mb-2 group-hover:text-[#F9D783] transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-400 text-sm line-clamp-3">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
