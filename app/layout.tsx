import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import StagewiseToolbarClient from '../components/StagewiseToolbarClient'
import SWRProvider from '../components/providers/swr-provider'
import HeaderWrapper from '../components/HeaderWrapper'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Color Palette Showcase",
  description: "A showcase of color palettes and schemes",
  generator: 'v0.dev',
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
    <html lang="en">
      <body className={`${inter.className} font-hikasami`}>
        <SWRProvider>
          <HeaderWrapper />
          {children}
        </SWRProvider>
        {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY !== '1' && (
          <StagewiseToolbarClient config={stagewiseConfig} />
        )}
      </body>
    </html>
  )
}
