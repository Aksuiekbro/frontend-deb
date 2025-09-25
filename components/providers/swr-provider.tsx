"use client"

import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'

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

interface SWRProviderProps {
  children: ReactNode
}

export default function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}