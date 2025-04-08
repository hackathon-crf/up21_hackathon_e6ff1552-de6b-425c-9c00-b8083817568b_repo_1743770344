"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { usePathname } from "next/navigation"
import "./globals.css"
import { AppSidebar } from "~/components/app-sidebar"
import { ThemeProvider } from "~/components/theme-provider"
import { Toaster } from "~/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  
  // Don't show sidebar for auth pages
  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/'

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {isAuthPage ? (
            <main className="w-full">{children}</main>
          ) : (
            <div className="flex h-screen">
              <AppSidebar />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
