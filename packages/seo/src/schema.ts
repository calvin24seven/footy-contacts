export interface BreadcrumbItem {
  name: string
  url: string
}

export interface FaqItem {
  question: string
  answer: string
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function buildOrgSchema(org: {
  name: string
  url: string
  country?: string | null
  league?: string | null
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    ...(org.country && { areaServed: org.country }),
    ...(org.league && { description: `${org.name} — ${org.league}` }),
  }
}

export function buildArticleSchema(article: {
  headline: string
  description: string
  url: string
  publishedAt: string
  modifiedAt?: string
  imageUrl?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    url: article.url,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt ?? article.publishedAt,
    author: {
      "@type": "Person",
      name: "Calvin",
    },
    publisher: {
      "@type": "Organization",
      name: "Footy Contacts",
      url: "https://footycontacts.com",
    },
    ...(article.imageUrl && { image: article.imageUrl }),
  }
}
