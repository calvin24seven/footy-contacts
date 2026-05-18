import "server-only"

export { buildMetadata, type SeoPageInput } from "./metadata"
export {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqSchema,
  buildOrgSchema,
  buildArticleSchema,
  type BreadcrumbItem,
  type FaqItem,
} from "./schema"
export { countryFlag } from "./countries"
export {
  buildOrgFaqs,
  buildCategoryFaqs,
  buildCountryFaqs,
  buildCategoryCountryFaqs,
} from "./faq"
export {
  toSlug,
  fromSlug,
  getCategoryLabel,
  CATEGORY_LABELS,
  type CategorySlug,
} from "./dimensions"
export { buildCanonicalUrl } from "./canonical"
export { buildOgImageUrl } from "./opengraph"
export { MIN_CONTACTS_TO_INDEX, shouldIndexPage } from "./thresholds"
