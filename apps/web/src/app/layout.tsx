import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Providers } from "./providers"
import CookieConsent from "@/components/CookieConsent"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Footy Contacts — Search the Football Network",
  description:
    "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Search 50,000+ published football industry contacts. Start with 3 free unlocks.",
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TRK6C7K8');`}</Script>
      </head>
      <body className={inter.className}>
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TRK6C7K8" height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
        </noscript>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  )
}
