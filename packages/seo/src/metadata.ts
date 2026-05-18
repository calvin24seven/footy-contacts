import type { Metadata } from "next"
import { buildCanonicalUrl } from "./canonical"

export interface SeoPageInput {
  title: string
  description: string
  canonicalPath: string
  ogImageUrl?: string
  noIndex?: boolean
  publishedAt?: string
  modifiedAt?: string
}

const DEFAULT_OG_IMAGE = "https://footycontacts.com/og-default.png"

export function buildMetadata(input: SeoPageInput): Metadata {
  const canonicalUrl = buildCanonicalUrl(input.canonicalPath)
  const ogImage = input.ogImageUrl ?? DEFAULT_OG_IMAGE

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
    ...(input.noIndex && {
      robots: { index: false, follow: false },
    }),
  }
}
