import type React from "react"
import type { Metadata } from "next"
import { Fira_Code } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { GlassNav } from "@/components/glass-nav"

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira-code",
})

export const metadata: Metadata = {
  title: "Reelevate.AI",
  description: "Generate reels with privacy-first, completely local AI.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(
      "min-h-screen bg-background font-sans antialiased",
      firaCode.variable
    )}>
      <head>
        <link
          crossOrigin="anonymous"
          href="https://db.onlinewebfonts.com/c/1b3f9cb78376a36884f3908f37a42c91?family=Tiempos+Text+Regular"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-title" content="Reelevate.AI" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        firaCode.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full flex justify-center px-4">
            <GlassNav />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}