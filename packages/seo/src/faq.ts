import type { FaqItem } from "./schema"

export function buildOrgFaqs(params: {
  orgName: string
  totalContacts: number
  withEmailCount: number
  topCategories: Array<[string, number]>
}): FaqItem[] {
  const { orgName, totalContacts, withEmailCount, topCategories } = params
  const categoryList =
    topCategories
      .slice(0, 3)
      .map(([cat]) => cat)
      .join(", ") || "coaching, scouting, and club administration"

  return [
    {
      question: `How many contacts does ${orgName} have on Footy Contacts?`,
      answer: `Footy Contacts currently lists ${totalContacts} published ${orgName} staff contacts, covering roles such as ${categoryList}.`,
    },
    {
      question: `Can I get email addresses for ${orgName} staff?`,
      answer:
        withEmailCount > 0
          ? `Yes — ${withEmailCount} of the ${orgName} contacts in the database have email addresses available. Unlock them with a Pro subscription.`
          : `Email availability varies. Sign up for free to see what contact details are available for ${orgName} staff.`,
    },
    {
      question: `What roles are available in the ${orgName} contact database?`,
      answer:
        topCategories.length > 0
          ? `The ${orgName} database includes contacts across: ${topCategories.map(([cat, n]) => `${cat} (${n})`).join(", ")}.`
          : `The ${orgName} database covers a range of football industry roles including coaching staff, club officials, scouts, and academy personnel.`,
    },
    {
      question: "How is the contact data kept up to date?",
      answer:
        "Footy Contacts verifies and refreshes contact records regularly. Verified contacts are marked with a green tick. Data is sourced from public records and industry contributions.",
    },
  ]
}
