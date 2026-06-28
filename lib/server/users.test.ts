import { fetchUserById, fetchCurrentUser } from './users'
import type { UserResponse } from '@/types/user/user'
import { Role } from '@/types/user/user'

const sampleUser: UserResponse = {
  id: 1,
  username: 'testadmin',
  firstName: 'Test',
  lastName: 'Admin',
  role: Role.ORGANIZER,
  email: 'test@debetter.local',
  profileId: 0,
  socialProfiles: [],
  createdAt: '2026-05-30T11:39:13',
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('fetchUserById', () => {
  it('returns the parsed user on a 200 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleUser,
    }) as unknown as typeof fetch

    const result = await fetchUserById(1, { baseUrl: 'http://backend/api' })

    expect(result).toEqual(sampleUser)
  })

  it('requests /users/:id forwarding the session cookie without caching', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleUser,
    })
    global.fetch = fetchMock as unknown as typeof fetch

    await fetchUserById(7, { baseUrl: 'http://backend/api', cookie: 'JSESSIONID=abc123' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend/api/users/7',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({ Cookie: 'JSESSIONID=abc123' }),
      }),
    )
  })

  it('returns null when the backend responds non-OK (e.g. 403/404)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Forbidden' }),
    }) as unknown as typeof fetch

    const result = await fetchUserById(1, { baseUrl: 'http://backend/api' })

    expect(result).toBeNull()
  })
})

describe('fetchCurrentUser', () => {
  it('returns the current user from /users/me, forwarding the cookie without caching', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleUser,
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await fetchCurrentUser({ baseUrl: 'http://backend/api', cookie: 'JSESSIONID=zzz' })

    expect(result).toEqual(sampleUser)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend/api/users/me',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({ Cookie: 'JSESSIONID=zzz' }),
      }),
    )
  })
})
