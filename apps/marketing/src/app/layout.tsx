import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Footy Contacts — Search the Football Network",
    template: "%s | Footy Contacts",
  },
  description:
    "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Search 12,400+ published football industry contacts. Start with 3 free unlocks.",
  metadataBase: new URL("https://footycontacts.com"),
  openGraph: {
    siteName: "Footy Contacts",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
