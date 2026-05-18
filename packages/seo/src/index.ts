export { buildMetadata, type SeoPageInput } from "./metadata"
export {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildOrgSchema,
  buildArticleSchema,
  type BreadcrumbItem,
  type FaqItem,
} from "./schema"
export { buildOrgFaqs } from "./faq"
export {
  toSlug,
  fromSlug,
  getCategoryLabel,
  CATEGORY_LABELS,
  type CategorySlug,
} from "./dimensions"
export { buildCanonicalUrl } from "./canonical"
export { buildOgImageUrl } from "./opengraph"
export { MIN_CONTACTS_TO_INDEX } from "./thresholds"
