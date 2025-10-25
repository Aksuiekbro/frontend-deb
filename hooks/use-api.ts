"use client"

import useSWR from 'swr'
import { api } from '@/lib/api'
import {
  SimpleTournamentResponse,
  TournamentResponse,
  TournamentGetParams,
  TournamentParticipantGetParams,
  SimpleTournamentParticipantResponse,
  TournamentParticipantResponse
} from '@/types/tournament/tournament'
import { UserResponse, UserGetParams, SimpleUserResponse } from '@/types/user/user'
import { NewsResponse, NewsGetParams } from '@/types/news'
import { Pageable, PageResult } from '@/types/page'
import { AnnouncementResponse } from '@/types/tournament/announcement/announcement'
import { RoundGroupResponse } from '@/types/tournament/round/round-group'
import { SimpleRoundResponse } from '@/types/tournament/round/round'
import { MatchResponse } from '@/types/tournament/match'
import { TeamResponse, SimpleTeamResponse } from '@/types/tournament/team'

// Fetcher function for SWR
async function fetcher<T>(fetchFn: () => Promise<Response>): Promise<T> {
  const response = await fetchFn()
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  return response.json()
}

// Tournament hooks
export function useTournaments(params?: TournamentGetParams, pageable?: Pageable) {
  const { data, error, isLoading, mutate } = useSWR(
    ['tournaments', params, pageable],
    () => fetcher<PageResult<SimpleTournamentResponse>>(() => api.getTournaments(params, pageable)),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    tournaments: data,
    isLoading,
    error,
    mutate
  }
}

export function useTournament(id: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ['tournament', id],
    () => fetcher<TournamentResponse>(() => api.getTournament(id)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    tournament: data,
    isLoading,
    error,
    mutate
  }
}

// User hooks
export function useUsers(params?: UserGetParams, pageable?: Pageable) {
  const { data, error, isLoading, mutate } = useSWR(
    ['users', params, pageable],
    () => fetcher<PageResult<UserResponse>>(() => api.getUsers(params, pageable)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    users: data,
    isLoading,
    error,
    mutate
  }
}

export function useUser(id: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ['user', id],
    () => fetcher<UserResponse>(() => api.getUser(id)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    user: data,
    isLoading,
    error,
    mutate
  }
}

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR(
    ['current-user'],
    () => fetcher<UserResponse>(() => api.getMe()),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    user: data,
    isLoading,
    error,
    mutate
  }
}

// News hooks
export function useNews(params?: NewsGetParams, pageable?: Pageable) {
  const { data, error, isLoading, mutate } = useSWR(
    ['news', params, pageable],
    () => fetcher<PageResult<NewsResponse>>(() => api.getNewses(params, pageable)),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    news: data,
    isLoading,
    error,
    mutate
  }
}

export function useSingleNews(id: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ['news-item', id],
    () => fetcher<NewsResponse>(() => api.getNews(id)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    newsItem: data,
    isLoading,
    error,
    mutate
  }
}

// Tournament participants hooks
export function useTournamentParticipants(
  tournamentId: number,
  params?: TournamentParticipantGetParams,
  pageable?: Pageable
) {
  const { data, error, isLoading, mutate } = useSWR(
    ['tournament-participants', tournamentId, params, pageable],
    () => fetcher<PageResult<SimpleTournamentParticipantResponse>>(() =>
      api.getTournamentParticipants(tournamentId, params, pageable)
    ),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    participants: data,
    isLoading,
    error,
    mutate
  }
}

export function useTournamentParticipant(tournamentId: number, participantId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ['tournament-participant', tournamentId, participantId],
    () => fetcher<TournamentParticipantResponse>(() =>
      api.getTournamentParticipant(tournamentId, participantId)
    ),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    participant: data,
    isLoading,
    error,
    mutate
  }
}

// Tournament teams hooks
export function useTournamentTeams(tournamentId: number, pageable?: Pageable) {
  const { data, error, isLoading, mutate } = useSWR(
    ['tournament-teams', tournamentId, pageable],
    () => fetcher<PageResult<SimpleTeamResponse>>(() =>
      api.getTeams(tournamentId, pageable)
    ),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    teams: data,
    isLoading,
    error,
    mutate
  }
}

export function useTournamentTeam(tournamentId: number, teamId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ['tournament-team', tournamentId, teamId],
    () => fetcher<TeamResponse>(() => api.getTeam(tournamentId, teamId)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    team: data,
    isLoading,
    error,
    mutate
  }
}

// Tournament announcements hooks
export function useTournamentAnnouncements(
  tournamentId: number,
  authorId?: number,
  pageable?: Pageable
) {
  const { data, error, isLoading, mutate } = useSWR(
    ['tournament-announcements', tournamentId, authorId, pageable],
    () => fetcher<PageResult<AnnouncementResponse>>(() =>
      api.getAnnouncements(tournamentId, authorId, pageable)
    ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    announcements: data,
    isLoading,
    error,
    mutate
  }
}

// Leaderboard hook disabled: backend has no rating field. Prevent any rating-based fetching/sorting.
export function useLeaderboard(_limit: number = 10) {
  // Passing a null key disables SWR fetching entirely.
  const { data, error, isLoading, mutate } = useSWR<PageResult<UserResponse>>(null, null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  return {
    leaderboard: data,
    isLoading,
    error,
    mutate,
  }
}

// Round groups
export function useRoundGroups(tournamentId?: number) {
  const enabled = typeof tournamentId === 'number' && !Number.isNaN(tournamentId)
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? ['round-groups', tournamentId] : null,
    () => fetcher<RoundGroupResponse[]>(() => api.getRoundGroups(tournamentId!)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    roundGroups: data,
    isLoading,
    error,
    mutate,
  }
}

// Rounds within a round group
export function useRounds(tournamentId?: number, roundGroupId?: number) {
  const enabled =
    typeof tournamentId === 'number' && !Number.isNaN(tournamentId) &&
    typeof roundGroupId === 'number' && !Number.isNaN(roundGroupId)

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? ['rounds', tournamentId, roundGroupId] : null,
    () => fetcher<SimpleRoundResponse[]>(() => api.getRounds(tournamentId!, roundGroupId!)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    rounds: data,
    isLoading,
    error,
    mutate,
  }
}

// Matches within a round
export function useMatches(
  tournamentId?: number,
  roundGroupId?: number,
  roundId?: number,
  pageable?: Pageable
) {
  const enabled =
    typeof tournamentId === 'number' && !Number.isNaN(tournamentId) &&
    typeof roundGroupId === 'number' && !Number.isNaN(roundGroupId) &&
    typeof roundId === 'number' && !Number.isNaN(roundId)

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? ['matches', tournamentId, roundGroupId, roundId, pageable] : null,
    () => fetcher<PageResult<MatchResponse>>(() => api.getMatches(tournamentId!, roundGroupId!, roundId!, pageable)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    matches: data,
    isLoading,
    error,
    mutate,
  }
}

// Featured/upcoming tournaments hook
export function useUpcomingTournaments(limit: number = 6) {
  const currentDate = new Date().toISOString().split('T')[0]

  const { data, error, isLoading, mutate } = useSWR(
    ['upcoming-tournaments', limit],
    () => fetcher<PageResult<SimpleTournamentResponse>>(() =>
      api.getTournaments(
        {
          startDateFrom: currentDate,
          nonFull: true
        },
        { page: 0, size: limit, sort: ['startDate,asc'] }
      )
    ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    upcomingTournaments: data,
    isLoading,
    error,
    mutate
  }
}