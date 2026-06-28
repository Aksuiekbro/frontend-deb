import type { UserResponse } from '@/types/user/user'

type FetchUserOptions = {
  baseUrl?: string
  cookie?: string
}

export async function fetchUserById(
  id: string | number,
  opts: FetchUserOptions = {},
): Promise<UserResponse | null> {
  const baseUrl = opts.baseUrl ?? process.env.NEXT_PUBLIC_API_URL
  const res = await fetch(`${baseUrl}/users/${id}`, {
    cache: 'no-store',
    headers: opts.cookie ? { Cookie: opts.cookie } : {},
  })
  if (!res.ok) return null
  return res.json()
}

export function fetchCurrentUser(opts: FetchUserOptions = {}): Promise<UserResponse | null> {
  return fetchUserById('me', opts)
}
