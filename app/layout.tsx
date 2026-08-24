import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import StagewiseToolbarClient from '../components/StagewiseToolbarClient'
import SWRProvider from '../components/providers/swr-provider'
import HeaderWrapper from '../components/HeaderWrapper'
import { Toaster } from '../components/ui/toaster'
import { LocaleProvider } from '../lib/i18n'

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "DeBetter",
  description: "A platform for debate tournaments",
  generator: "DeBetter",
  icons: {
    icon: "/the-talking-logo.png",
    shortcut: "/the-talking-logo.png",
  },
}

const stagewiseConfig = {
  plugins: []
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-hikasami`}>
        <LocaleProvider>
          <SWRProvider>
            <HeaderWrapper />
            {children}
          </SWRProvider>
          <Toaster />
          {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY !== '1' && (
            <StagewiseToolbarClient config={stagewiseConfig} />
          )}
        </LocaleProvider>
      </body>
    </html>
  )
}
