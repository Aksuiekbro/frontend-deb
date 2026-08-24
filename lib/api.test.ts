import { DebateFormat, TournamentLeague } from '@/types/tournament/tournament'
import { RoundGroupType } from '@/types/tournament/round/round-group'
import { SocialPlatform } from '@/types/util/socials/social-profile'

describe('api client configuration', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    }
    jest.resetModules()
    jest.restoreAllMocks()
  })

  it('does not fall back to the frontend origin when NEXT_PUBLIC_API_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    jest.resetModules()
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const res = await api.register({} as Parameters<typeof api.register>[0])

    expect(fetchMock).not.toHaveBeenCalled()
    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toEqual({
      message: 'API endpoint is not configured for this deployment.',
    })
  })

  it('treats a blank NEXT_PUBLIC_API_URL as missing after trimming', async () => {
    process.env.NEXT_PUBLIC_API_URL = '   '
    jest.resetModules()
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const res = await api.login({ username: 'nurassyl', password: 'Test12345!', rememberMe: false })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(res.status).toBe(503)
  })

  it('normalizes a configured API URL (trims and strips trailing slashes) into one clean backend URL', async () => {
    process.env.NEXT_PUBLIC_API_URL = '  https://api.example.com///  '
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    await api.register({} as Parameters<typeof api.register>[0])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/auth/register')
  })

  it('sends tournament creation as multipart data with the image file', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 201 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const image = new File(['poster'], 'poster.png', { type: 'image/png' })
    const body: Parameters<typeof api.createTournament>[0] = {
      name: 'Debate test',
      description: 'A useful description for the tournament.',
      startDate: '2026-06-27T00:00:00',
      endDate: '2026-06-28T00:00:00',
      registrationDeadline: '2026-06-26T00:00:00',
      location: 'Almaty',
      league: TournamentLeague.SCHOOL,
      teamLimit: 32,
      preliminaryFormat: DebateFormat.APF,
      teamEliminationFormat: DebateFormat.APF,
      preliminaryRoundCount: 5,
      eliminationRoundCount: 3,
    }

    await api.createTournament(body, image)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/tournaments',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.any(FormData),
      }),
    )

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit
    expect(requestInit.headers).not.toHaveProperty('Content-Type')

    const formData = requestInit.body as FormData
    expect(formData.get('image')).toBe(image)

    const data = formData.get('data') as Blob
    await expect(data.text().then(JSON.parse)).resolves.toEqual(body)
    expect(data.type).toBe('application/json')
  })

  it('loads the signed-in user tournaments with filters and pageable parameters', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    await api.getMyTournaments(
      { searchName: 'Open', league: TournamentLeague.SCHOOL },
      { page: 1, size: 20, sort: ['startDate,asc', 'name,asc'] },
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/tournaments/mine?searchName=Open&league=SCHOOL&page=1&size=20&sort=startDate%2Casc&sort=name%2Casc',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('uploads my profile picture as POST multipart image data', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const image = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await api.updateMyProfilePicture(image)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users/me/profile-picture',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.any(FormData),
      }),
    )

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit
    expect(requestInit.headers).not.toHaveProperty('Content-Type')
    const formData = requestInit.body as FormData
    expect(formData.get('image')).toBe(image)
    expect(formData.has('data')).toBe(false)
  })

  it('updates my social profiles with the backend socialProfiles payload shape', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')

    await api.updateMySocialProfiles([
      { platform: SocialPlatform.TELEGRAM, handle: '@debetter', isPublic: true },
    ])

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users/me/social-profiles',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          socialProfiles: [
            { socialPlatform: SocialPlatform.TELEGRAM, handle: '@debetter', isPublic: true },
          ],
        }),
      }),
    )
  })

  it('removes selected social profiles with repeated platform query params', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')

    await api.removeMySocialProfiles([SocialPlatform.TELEGRAM, SocialPlatform.INSTAGRAM])

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users/me/social-profiles?platforms=TELEGRAM&platforms=INSTAGRAM',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    )
  })

  it('creates and resolves organizer invitations through backend endpoints', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')

    await api.createOrganizerInvitation({ inviteeUsername: 'cohost', tournamentId: 53 })
    await api.acceptOrganizerInvitation(8)
    await api.rejectOrganizerInvitation(9)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/organizer-invitations',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ inviteeUsername: 'cohost', tournamentId: 53 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/organizer-invitations/8/accept',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.example.com/organizer-invitations/9/reject',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
  })

  it('creates and resolves participant invitations through backend endpoints', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')

    await api.createParticipantInvitation({ inviteeUsername: 'teammate', teamId: 7 })
    await api.acceptParticipantInvitation(11)
    await api.rejectParticipantInvitation(12)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/participant-invitations',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ inviteeUsername: 'teammate', teamId: 7 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/participant-invitations/11/accept',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.example.com/participant-invitations/12/reject',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
  })

  it('updates round group workflow through backend endpoints', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')

    await api.changeRoundGroupFormat(53, { format: DebateFormat.LD }, { roundGroupType: RoundGroupType.PRELIMINARY })
    await api.proceedToNextRound(53, 101)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/tournaments/53/round-groups?roundGroupType=PRELIMINARY',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ format: DebateFormat.LD }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/tournaments/53/round-groups/101/proceed',
      expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
    )
  })

  it('updates and deletes rounds through backend endpoints', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')

    await api.updateRound(53, 101, 201, { name: 'Quarterfinal', customFormat: DebateFormat.APF, matchesArePublic: true })
    await api.deleteRound(53, 101, 202)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/tournaments/53/round-groups/101/rounds/201',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ name: 'Quarterfinal', customFormat: DebateFormat.APF, matchesArePublic: true }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/tournaments/53/round-groups/101/rounds/202',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    )
  })

  it('submits match results through the selected round endpoint', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const body = [
      {
        matchId: 301,
        teamResults: [
          { teamId: 7, participantScores: [{ participantId: 14, score: 76 }] },
          { teamId: 8, participantScores: [{ participantId: 15, score: 74 }] },
        ],
      },
    ]

    await api.submitMatchResults(53, 101, 201, body)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/tournaments/53/round-groups/101/rounds/201/matches/results',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify(body),
      }),
    )
  })

  it('manages pairings through the selected round match endpoints', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')

    await api.updateMatch(53, 101, 201, 301, { location: 'Room A-12' })
    await api.randomizeMatches(53, 101, 201)
    await api.publishMatches(53, 101, 201)
    await api.clearMatches(53, 101, 201)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/tournaments/53/round-groups/101/rounds/201/matches/301',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ location: 'Room A-12' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/tournaments/53/round-groups/101/rounds/201/matches/randomize',
      expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.example.com/tournaments/53/round-groups/101/rounds/201/matches/publish',
      expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://api.example.com/tournaments/53/round-groups/101/rounds/201/matches',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    )
  })

  it('loads, updates, and deletes news through backend endpoints', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const thumbnail = new File(['thumbnail'], 'thumbnail.png', { type: 'image/png' })
    const gallery = new File(['gallery'], 'gallery.png', { type: 'image/png' })
    const body = { title: 'Updated news', content: 'Updated content', tags: ['important'] }

    await api.getNews(42)
    await api.updateNews(42, body, thumbnail, [gallery])
    await api.deleteNews(42)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/news/42',
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/news/42',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: expect.any(FormData),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.example.com/news/42',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    )

    const requestInit = fetchMock.mock.calls[1][1] as RequestInit
    expect(requestInit.headers).not.toHaveProperty('Content-Type')

    const formData = requestInit.body as FormData
    expect(formData.get('thumbnail')).toBe(thumbnail)
    expect(formData.get('images')).toBe(gallery)
    const data = formData.get('data') as Blob
    await expect(data.text().then(JSON.parse)).resolves.toEqual(body)
  })
})
