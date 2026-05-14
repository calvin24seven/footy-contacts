import { groq } from "next-sanity"

export const allPostsQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage { asset, alt }
  }
`

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage { asset, alt },
    body,
    seoTitle,
    seoDescription
  }
`

export const allSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)] { "slug": slug.current }
`
