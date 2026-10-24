import type { Metadata } from "next"
import "./globals.css"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import Navbar from "@/components/navbar"
import { ThemeProvider } from "@/components/theme"
import Footer from "@/components/footer"
import { constructMetadata } from "@/lib/utils"
import AdBanner from "@/components/ad-banner"
import BuyMeCoffee from "@/components/buy-me-coffee"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"

export const metadata: Metadata = constructMetadata({
  canonical: "/",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans">
        {/* Light by default. enableSystem stays on so the switcher can still
            offer System, but a first visit is not left to the OS setting. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="sticky top-0 z-50">
            <AdBanner />
            <Navbar />
          </div>
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
        <BuyMeCoffee />
        {/* Production deployment only, so local dev and preview traffic
            stay out of the numbers. DataBull is our self-hosted analytics
            (analytics.shrix1.com): traffic sources and route changes. */}
        {process.env.VERCEL_ENV === "production" && (
          <>
            <Analytics />
            <Script
              src="https://analytics.shrix1.com/js/script.js"
              data-website-id="dc_v234qksm86cdi6"
              data-domain="seocheckup.shrix1.com"
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  )
}
