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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="sticky top-0 z-50">
            <AdBanner />
            <div className="p-3 w-full bg-background">
              <Navbar />
            </div>
          </div>
          {children}
          <Footer />
        </ThemeProvider>
        <BuyMeCoffee />
      </body>
    </html>
  )
}
