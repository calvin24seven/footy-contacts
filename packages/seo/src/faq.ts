import { getCategoryLabel } from "./dimensions"
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

export function buildCategoryFaqs(params: {
  category: string
  totalContacts: number
  emailCount: number
  topCountries: Array<[string, number]>
}): FaqItem[] {
  const { category, totalContacts, emailCount, topCountries } = params
  const label = getCategoryLabel(category)
  const countryList =
    topCountries
      .slice(0, 3)
      .map(([c]) => c)
      .join(", ") || "England, Spain, Germany"

  return [
    {
      question: `How many ${label.toLowerCase()} are in the Footy Contacts database?`,
      answer: `There are currently ${totalContacts.toLocaleString()} ${label.toLowerCase()} listed on Footy Contacts, spanning clubs and organisations across ${countryList} and more.`,
    },
    {
      question: `Can I find email addresses for football ${label.toLowerCase()}?`,
      answer:
        emailCount > 0
          ? `Yes — ${emailCount.toLocaleString()} ${label.toLowerCase()} in the database have email addresses available. Unlock them with a Pro subscription.`
          : `Email availability varies by contact. Sign up for free to browse what's available.`,
    },
    {
      question: `Which countries have the most ${label.toLowerCase()}?`,
      answer: `The highest concentrations of ${label.toLowerCase()} in the database are from ${topCountries
        .slice(0, 3)
        .map(([c, n]) => `${c} (${n.toLocaleString()})`)
        .join(", ")}.`,
    },
    {
      question: `How do I contact a football ${label.toLowerCase().replace(/s$/, "")}?`,
      answer: `Search the Footy Contacts database for the specific ${label.toLowerCase().replace(/s$/, "")} you need, then unlock their contact details with a Pro plan. You'll get verified email addresses, phone numbers, and LinkedIn profiles.`,
    },
  ]
}

export function buildCountryFaqs(params: {
  country: string
  totalContacts: number
  emailCount: number
  orgCount: number
  topCategories: Array<[string, number]>
}): FaqItem[] {
  const { country, totalContacts, emailCount, orgCount, topCategories } = params
  const categoryList =
    topCategories
      .slice(0, 3)
      .map(([cat]) => getCategoryLabel(cat).toLowerCase())
      .join(", ") || "coaches, scouts, and club officials"

  return [
    {
      question: `How many football contacts from ${country} are on Footy Contacts?`,
      answer: `Footy Contacts lists ${totalContacts.toLocaleString()} football industry contacts from ${country}, spread across ${orgCount.toLocaleString()} clubs and organisations.`,
    },
    {
      question: `What types of football contacts are available in ${country}?`,
      answer: `The ${country} database covers a wide range of roles including ${categoryList} — across professional clubs, academies, and national organisations.`,
    },
    {
      question: `Can I find email addresses for ${country} football contacts?`,
      answer:
        emailCount > 0
          ? `Yes — ${emailCount.toLocaleString()} contacts from ${country} have email addresses in the database. Unlock them with a Pro subscription.`
          : `Email availability varies. Sign up for free to see what's available for ${country} contacts.`,
    },
    {
      question: `How do I network with football professionals in ${country}?`,
      answer: `Use Footy Contacts to search for ${country} football industry professionals by role, club, or league. Unlock verified contact details to reach out directly.`,
    },
  ]
}

export function buildCategoryCountryFaqs(params: {
  category: string
  country: string
  totalContacts: number
  emailCount: number
  orgCount: number
}): FaqItem[] {
  const { category, country, totalContacts, emailCount, orgCount } = params
  const label = getCategoryLabel(category)
  const singular = label.toLowerCase().replace(/s$/, "")

  return [
    {
      question: `How many ${label.toLowerCase()} are based in ${country}?`,
      answer: `There are ${totalContacts.toLocaleString()} ${label.toLowerCase()} from ${country} currently listed on Footy Contacts, working across ${orgCount.toLocaleString()} clubs and organisations.`,
    },
    {
      question: `Can I get email addresses for ${label.toLowerCase()} in ${country}?`,
      answer:
        emailCount > 0
          ? `Yes — ${emailCount.toLocaleString()} ${label.toLowerCase()} in ${country} have email addresses available. Unlock them with a Pro plan.`
          : `Email availability varies. Sign up free to see what's listed for ${label.toLowerCase()} in ${country}.`,
    },
    {
      question: `Which clubs in ${country} have the most ${label.toLowerCase()}?`,
      answer: `Browse the full list of ${country} ${label.toLowerCase()} on Footy Contacts, filtered by club, to find organisations with the highest concentration of ${singular} contacts.`,
    },
    {
      question: `How do I reach a ${singular} in ${country}?`,
      answer: `Search Footy Contacts for ${label.toLowerCase()} in ${country}, then unlock their verified email, phone, or LinkedIn with a Pro subscription.`,
    },
  ]
}
