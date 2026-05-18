/** Minimum published contacts required to index a programmatic page. */
export const MIN_CONTACTS_TO_INDEX = 5

/**
 * Returns true when a programmatic page has enough contacts to be worth indexing.
 * Use in both `generateMetadata` (noindex guard) and sitemap builders (URL exclusion).
 */
export function shouldIndexPage(contactCount: number): boolean {
  return contactCount >= MIN_CONTACTS_TO_INDEX
}
