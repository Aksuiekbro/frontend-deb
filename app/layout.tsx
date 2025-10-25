import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import StagewiseToolbarClient from '../components/StagewiseToolbarClient'
import SWRProvider from '../components/providers/swr-provider'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Color Palette Showcase",
  description: "A showcase of color palettes and schemes",
    generator: 'v0.dev'
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Hiragino+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} font-hikasami`}>
        <SWRProvider>
          {children}
        </SWRProvider>
        {process.env.NODE_ENV === 'development' && (
          <StagewiseToolbarClient config={stagewiseConfig} />
        )}
      </body>
    </html>
  )
}
