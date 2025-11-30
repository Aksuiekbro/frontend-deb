"use client"

import useSWR from 'swr'
import { api } from '@/lib/api'
import {
  SimpleTournamentResponse,
  TournamentResponse,
  TournamentGetParams,
  TournamentLeague,
  DebateFormat,
} from '@/types/tournament/tournament'
import {
  TournamentParticipantGetParams,
  SimpleTournamentParticipantResponse,
  TournamentParticipantResponse
} from '@/types/tournament/tournament-participant'
import { UserResponse, UserGetParams, SimpleUserResponse, Role } from '@/types/user/user'
import { NewsResponse, NewsGetParams } from '@/types/news'
import { Pageable, PageResult } from '@/types/page'
import { AnnouncementResponse } from '@/types/tournament/announcement/announcement'
import { RoundGroupResponse, RoundGroupType } from '@/types/tournament/round/round-group'
import { SimpleRoundResponse } from '@/types/tournament/round/round'
import { MatchResponse } from '@/types/tournament/match'
import { TeamResponse, SimpleTeamResponse } from '@/types/tournament/team'
import { JudgeGetParams, JudgeResponse } from '@/types/tournament/judge'
import { FeedbackGetParams, FeedbackResponse } from '@/types/tournament/feedback'
import { UrlResponse } from '@/types/util/url'
import { TagResponse } from '@/types/tag'
import { OrganizerProfileResponse, ParticipantProfileResponse, CityResponse, InstitutionResponse } from '@/types/user/profile'

const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'
const previewRoleEnv = (process.env.NEXT_PUBLIC_PREVIEW_ROLE ?? '').toUpperCase()
const PREVIEW_ROLE: Role = previewRoleEnv === Role.PARTICIPANT ? Role.PARTICIPANT : Role.ORGANIZER

const PREVIEW_IMAGE: UrlResponse = { id: 1, url: '/preview/placeholder.jpg' }
const PREVIEW_TAGS: TagResponse[] = [{ name: 'preview' }, { name: 'beta' }]

const PREVIEW_CITY: CityResponse = { id: 1, name: 'Preview City' }
const PREVIEW_INSTITUTION: InstitutionResponse = { id: 1, name: 'Preview University' }

const PREVIEW_SIMPLE_TOURNAMENT: SimpleTournamentResponse = {
  id: 1,
  name: 'Debetter Preview Invitational',
  description: 'Static data shown when preview mode is enabled.',
  imageUrl: PREVIEW_IMAGE,
  league: TournamentLeague.UNIVERSITY,
  preliminaryFormat: DebateFormat.BPF,
  teamElimintationFormat: DebateFormat.APF,
  tags: PREVIEW_TAGS,
}

const PREVIEW_TOURNAMENT: TournamentResponse = {
  ...PREVIEW_SIMPLE_TOURNAMENT,
  startDate: '2024-08-01T09:00:00.000Z',
  endDate: '2024-08-03T18:00:00.000Z',
  registrationDeadline: '2024-07-25T23:59:59.000Z',
  location: 'Preview Convention Center, Preview City',
  teamLimit: 32,
  enabled: true,
}

const PREVIEW_ORGANIZER_ACCOUNT: UserResponse = {
  id: 101,
  username: 'preview.organizer',
  firstName: 'Preview',
  lastName: 'Organizer',
  email: 'organizer@example.com',
  role: Role.ORGANIZER,
  profileId: 1,
  socialProfiles: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  imageUrl: PREVIEW_IMAGE,
}

const PREVIEW_PARTICIPANT_ACCOUNT: UserResponse = {
  id: 102,
  username: 'preview.debater',
  firstName: 'Preview',
  lastName: 'Debater',
  email: 'debater@example.com',
  role: Role.PARTICIPANT,
  profileId: 2,
  socialProfiles: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  imageUrl: PREVIEW_IMAGE,
}

const PREVIEW_USERS_BY_ROLE: Record<Role, UserResponse> = {
  [Role.ORGANIZER]: PREVIEW_ORGANIZER_ACCOUNT,
  [Role.PARTICIPANT]: PREVIEW_PARTICIPANT_ACCOUNT,
}

const PREVIEW_ORGANIZER_PROFILE: OrganizerProfileResponse = {
  organizedTournaments: [PREVIEW_SIMPLE_TOURNAMENT],
  coOrganizedTournaments: [],
}

const PREVIEW_PARTICIPANT_PROFILE: ParticipantProfileResponse = {
  city: PREVIEW_CITY,
  institution: PREVIEW_INSTITUTION,
  rating: 4.7,
}

const PREVIEW_PARTICIPANTS: SimpleTournamentParticipantResponse[] = [
  {
    id: 201,
    speakerScore: 75.3,
    participantProfile: PREVIEW_PARTICIPANT_PROFILE,
    user: {
      id: 1001,
      username: 'debater.one',
      firstName: 'Debater',
      lastName: 'One',
      role: Role.PARTICIPANT,
      imageUrl: PREVIEW_IMAGE,
    },
  },
  {
    id: 202,
    speakerScore: 73.8,
    participantProfile: PREVIEW_PARTICIPANT_PROFILE,
    user: {
      id: 1002,
      username: 'debater.two',
      firstName: 'Debater',
      lastName: 'Two',
      role: Role.PARTICIPANT,
      imageUrl: PREVIEW_IMAGE,
    },
  },
  {
    id: 203,
    speakerScore: 71.5,
    participantProfile: PREVIEW_PARTICIPANT_PROFILE,
    user: {
      id: 1003,
      username: 'debater.three',
      firstName: 'Debater',
      lastName: 'Three',
      role: Role.PARTICIPANT,
      imageUrl: PREVIEW_IMAGE,
    },
  },
]

const PREVIEW_TEAMS: SimpleTeamResponse[] = [
  { id: 301, name: 'Preview A', club: { id: 1, name: 'Preview Debate Society' } },
  { id: 302, name: 'Preview B', club: { id: 1, name: 'Preview Debate Society' } },
  { id: 303, name: 'Guest C', club: { id: 2, name: 'Guest Institute' } },
  { id: 304, name: 'Guest D', club: { id: 2, name: 'Guest Institute' } },
]

const PREVIEW_TEAM_DETAILS: TeamResponse[] = PREVIEW_TEAMS.map((team, index) => ({
  ...team,
  preliminaryScore: 70 - index * 1.5,
  active: true,
  checkedIn: true,
  disqualified: false,
  members: PREVIEW_PARTICIPANTS,
}))

const PREVIEW_ROUNDS: SimpleRoundResponse[] = [
  { id: 401, name: '1/16', customFormat: DebateFormat.BPF, roundNumber: 1 },
  { id: 402, name: 'Quarterfinal', customFormat: DebateFormat.APF, roundNumber: 2 },
  { id: 403, name: 'Semifinal', customFormat: DebateFormat.APF, roundNumber: 3 },
]

const PREVIEW_ROUND_GROUPS: RoundGroupResponse[] = [
  {
    id: 501,
    type: RoundGroupType.PRELIMINARY,
    format: DebateFormat.BPF,
    rounds: PREVIEW_ROUNDS[0],
    currentRoundNumber: 1,
  },
  {
    id: 502,
    type: RoundGroupType.TEAM_ELIMINATION,
    format: DebateFormat.APF,
    rounds: PREVIEW_ROUNDS[1],
    currentRoundNumber: 2,
  },
]

const PREVIEW_MATCHES: MatchResponse[] = [
  {
    id: 601,
    team1: PREVIEW_TEAMS[0],
    team2: PREVIEW_TEAMS[1],
    team3: PREVIEW_TEAMS[2],
    team4: PREVIEW_TEAMS[3],
    debater1: PREVIEW_PARTICIPANTS[0],
    debater2: PREVIEW_PARTICIPANTS[1],
    location: 'Auditorium A',
    startTime: '2024-08-01T10:00:00.000Z',
    judge: {
      id: 701,
      fullName: 'Preview Judge',
      phoneNumber: '+1 (555) 123-4567',
      email: 'judge@example.com',
      socialProfiles: [],
      checkedIn: true,
    },
    team1Score: 75,
    team2Score: 72,
    team3Score: 68,
    team4Score: 65,
    debater1Score: 75,
    debater2Score: 73,
    completed: false,
  },
]

const PREVIEW_ANNOUNCEMENTS: AnnouncementResponse[] = [
  {
    id: 801,
    title: 'Welcome to the Preview Cup',
    content: 'Use this screen to finalize the design before backend endpoints are ready.',
    imageUrl: PREVIEW_IMAGE,
    timestamp: '2024-08-01T07:45:00.000Z',
    author: PREVIEW_ORGANIZER_PROFILE,
    user: PREVIEW_ORGANIZER_ACCOUNT,
    comments: [],
    tags: PREVIEW_TAGS,
  },
]

const PREVIEW_NEWS: NewsResponse[] = [
  {
    id: 901,
    author: PREVIEW_ORGANIZER_PROFILE,
    user: PREVIEW_ORGANIZER_ACCOUNT,
    thumbnailUrl: PREVIEW_IMAGE,
    images: [PREVIEW_IMAGE],
    title: 'Day 1 Highlights',
    content: 'The top seeds advanced to elimination rounds with strong performances.',
    tags: PREVIEW_TAGS,
    timestamp: '2024-08-01T18:00:00.000Z',
  },
]

const PREVIEW_JUDGES: JudgeResponse[] = [
  {
    id: 1001,
    fullName: 'Preview Judge One',
    phoneNumber: '+1 (555) 000-0001',
    email: 'judge.one@example.com',
    socialProfiles: [],
    checkedIn: true,
  },
  {
    id: 1002,
    fullName: 'Preview Judge Two',
    phoneNumber: '+1 (555) 000-0002',
    email: 'judge.two@example.com',
    socialProfiles: [],
    checkedIn: false,
  },
]

const PREVIEW_FEEDBACKS: FeedbackResponse[] = [
  {
    id: 1101,
    title: 'Loving the schedule clarity',
    content: 'Rounds are running on time and the announcements help a ton. Keep it up!',
    timestamp: '2024-08-01T19:10:00.000Z',
    edited: false,
    author: PREVIEW_PARTICIPANT_PROFILE,
    user: PREVIEW_PARTICIPANT_ACCOUNT,
    tags: PREVIEW_TAGS,
  },
  {
    id: 1102,
    title: 'Please add more maps',
    content: 'Would be great to include room directions for the next rounds.',
    timestamp: '2024-08-01T20:25:00.000Z',
    edited: true,
    author: PREVIEW_PARTICIPANT_PROFILE,
    user: PREVIEW_PARTICIPANT_ACCOUNT,
    tags: PREVIEW_TAGS,
  },
]

const previewPage = <T,>(items: T[]): PageResult<T> => ({
  content: items,
  totalElements: items.length,
  totalPages: 1,
})

const PREVIEW_PARTICIPANTS_PAGE = previewPage(PREVIEW_PARTICIPANTS)
const PREVIEW_TEAMS_PAGE = previewPage(PREVIEW_TEAMS)
const PREVIEW_MATCHES_PAGE = previewPage(PREVIEW_MATCHES)
const PREVIEW_NEWS_PAGE = previewPage(PREVIEW_NEWS)
const PREVIEW_ANNOUNCEMENTS_PAGE = previewPage(PREVIEW_ANNOUNCEMENTS)
const PREVIEW_JUDGES_PAGE = previewPage(PREVIEW_JUDGES)
const PREVIEW_FEEDBACKS_PAGE = previewPage(PREVIEW_FEEDBACKS)

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
  if (IS_PREVIEW) {
    const data = { ...PREVIEW_TOURNAMENT, id }
    return {
      tournament: data,
      isLoading: false,
      error: undefined,
      mutate: async () => data,
    }
  }

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
  if (IS_PREVIEW) {
    const previewUser = PREVIEW_USERS_BY_ROLE[PREVIEW_ROLE]
    return {
      user: previewUser,
      isLoading: false,
      error: undefined,
      mutate: async () => previewUser,
    }
  }

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
  if (IS_PREVIEW) {
    return {
      news: PREVIEW_NEWS_PAGE,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_NEWS_PAGE,
    }
  }

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
  if (IS_PREVIEW) {
    return {
      participants: PREVIEW_PARTICIPANTS_PAGE,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_PARTICIPANTS_PAGE,
    }
  }

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
  if (IS_PREVIEW) {
    return {
      teams: PREVIEW_TEAMS_PAGE,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_TEAMS_PAGE,
    }
  }

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
  if (IS_PREVIEW) {
    const team = PREVIEW_TEAM_DETAILS.find((t) => t.id === teamId) ?? PREVIEW_TEAM_DETAILS[0]
    return {
      team,
      isLoading: false,
      error: undefined,
      mutate: async () => team,
    }
  }

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

export function useTournamentJudges(tournamentId: number, params?: JudgeGetParams, pageable?: Pageable) {
  if (IS_PREVIEW) {
    return {
      judges: PREVIEW_JUDGES_PAGE,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_JUDGES_PAGE,
    }
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['tournament-judges', tournamentId, params, pageable],
    () => fetcher<PageResult<JudgeResponse>>(() => api.getJudges(tournamentId, params, pageable)),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    judges: data,
    isLoading,
    error,
    mutate,
  }
}

// Tournament announcements hooks
export function useTournamentAnnouncements(
  tournamentId: number,
  authorId?: number,
  pageable?: Pageable
) {
  if (IS_PREVIEW) {
    return {
      announcements: PREVIEW_ANNOUNCEMENTS_PAGE,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_ANNOUNCEMENTS_PAGE,
    }
  }

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

export function useTournamentFeedbacks(
  tournamentId: number,
  params?: FeedbackGetParams,
  pageable?: Pageable
) {
  if (IS_PREVIEW) {
    return {
      feedbacks: PREVIEW_FEEDBACKS_PAGE,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_FEEDBACKS_PAGE,
    }
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['tournament-feedbacks', tournamentId, params, pageable],
    () => fetcher<PageResult<FeedbackResponse>>(() => api.getFeedbacks(tournamentId, params, pageable)),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    feedbacks: data,
    isLoading,
    error,
    mutate,
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

  if (IS_PREVIEW) {
    return {
      roundGroups: PREVIEW_ROUND_GROUPS,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_ROUND_GROUPS,
    }
  }

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

  if (IS_PREVIEW) {
    return {
      rounds: PREVIEW_ROUNDS,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_ROUNDS,
    }
  }

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

  if (IS_PREVIEW) {
    return {
      matches: PREVIEW_MATCHES_PAGE,
      isLoading: false,
      error: undefined,
      mutate: async () => PREVIEW_MATCHES_PAGE,
    }
  }

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
