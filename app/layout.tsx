import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import StagewiseToolbarClient from '../components/StagewiseToolbarClient'
import { SWRConfig } from 'swr'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Color Palette Showcase",
  description: "A showcase of color palettes and schemes",
    generator: 'v0.dev'
}

const stagewiseConfig = {
  plugins: []
};

// SWR configuration with optimized caching strategies
const swrConfig = {
  // Cache data for 5 minutes by default
  dedupingInterval: 5 * 60 * 1000,

  // Revalidate on focus for important data
  revalidateOnFocus: false,

  // Revalidate on network reconnect
  revalidateOnReconnect: true,

  // Retry on error with exponential backoff
  errorRetryCount: 3,
  errorRetryInterval: 1000,

  // Global error handler
  onError: (error: any, key: string) => {
    console.error(`SWR Error for ${key}:`, error)

    // You can add error tracking here (e.g., Sentry)
    // if (error.status !== 403 && error.status !== 404) {
    //   sentry.captureException(error)
    // }
  },

  // Global success handler for debugging
  onSuccess: (data: any, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`SWR Success for ${key}:`, data)
    }
  },

  // Loading timeout
  loadingTimeout: 10000,

  // Cache provider for better performance
  provider: () => new Map(),
}

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
        <SWRConfig value={swrConfig}>
          {children}
        </SWRConfig>
        {process.env.NODE_ENV === 'development' && (
          <StagewiseToolbarClient config={stagewiseConfig} />
        )}
      </body>
    </html>
  )
}
