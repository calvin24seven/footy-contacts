import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Footy Contacts — Football Contact Intelligence",
    template: "%s | Footy Contacts",
  },
  description:
    "Find and connect with football agents, scouts, clubs, coaches and media professionals worldwide.",
  metadataBase: new URL("https://footycontacts.com"),
  openGraph: {
    siteName: "Footy Contacts",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
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
