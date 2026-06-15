"use client"

import { SWRConfig, unstable_serialize } from 'swr'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import type { PageResult } from '@/types/page'
import type { SimpleTournamentResponse } from '@/types/tournament/tournament'
import type { UserResponse } from '@/types/user/user'

// SWR base configuration with optimized caching strategies
const baseConfig = {
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
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  // Provide lightweight placeholder data when demo mode is enabled so pages render without a backend.
  const fallback = useMemo(() => {
    if (!isDemoMode) return undefined

    const upcomingKey = unstable_serialize(['upcoming-tournaments', 6])
    const leaderboardKey = unstable_serialize(['leaderboard', 3])

    const placeholderImage = { id: 0, url: '/placeholder.jpg' }

    const upcomingFallback: PageResult<SimpleTournamentResponse> = {
      content: [
        {
          id: 1,
          name: 'Demo Invitational',
          description: 'An example tournament for demo mode',
          imageUrl: placeholderImage,
          league: 'UNIVERSITY',
          preliminaryFormat: 'BPF',
          teamElimintationFormat: 'BPF',
          tags: []
        },
        {
          id: 2,
          name: 'Sample Open',
          description: 'Preview of an upcoming event',
          imageUrl: placeholderImage,
          league: 'SCHOOL',
          preliminaryFormat: 'APF',
          teamElimintationFormat: 'APF',
          tags: []
        }
      ],
      totalElements: 2,
      totalPages: 1
    }

    const leaderboardFallback: PageResult<UserResponse> = {
      content: [
        { id: 101, username: 'alice', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', profileId: 1, socialProfiles: [], createdAt: new Date().toISOString(), role: 'PARTICIPANT', imageUrl: undefined },
        { id: 102, username: 'bob', firstName: 'Bob', lastName: 'Lee', email: 'bob@example.com', profileId: 2, socialProfiles: [], createdAt: new Date().toISOString(), role: 'PARTICIPANT', imageUrl: undefined },
        { id: 103, username: 'carol', lastName: 'Ng', firstName: 'Carol', email: 'carol@example.com', profileId: 3, socialProfiles: [], createdAt: new Date().toISOString(), role: 'PARTICIPANT', imageUrl: undefined },
      ],
      totalElements: 3,
      totalPages: 1
    }

    return {
      [upcomingKey]: upcomingFallback,
      [leaderboardKey]: leaderboardFallback,
    }
  }, [isDemoMode])

  const swrConfig = useMemo(() => ({
    ...baseConfig,
    // Pause all fetching in demo mode
    isPaused: () => isDemoMode,
    // Supply placeholder data so UI renders cleanly
    fallback
  }), [isDemoMode, fallback])

  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}
