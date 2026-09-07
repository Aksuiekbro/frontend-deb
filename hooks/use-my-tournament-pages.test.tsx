/** @jest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import type { ReactNode } from "react"

import { api } from "@/lib/api"
import { useMyTournamentPages } from "./use-my-tournament-pages"

let mockUser: { id: number } | undefined = { id: 7 }
jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: () => ({ user: mockUser, isLoading: false }),
}))
jest.mock("@/lib/api", () => ({ api: { getMyTournaments: jest.fn() } }))
const getMyTournaments = api.getMyTournaments as jest.MockedFunction<typeof api.getMyTournaments>

const page = (ids: number[], totalPages = 2): Response => ({
  ok: true,
  json: async () => ({ content: ids.map((id) => ({ id, name: `Cup ${id}` })), totalPages, totalElements: 3 }),
} as Response)

function Wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, dedupingInterval: 0 }}>{children}</SWRConfig>
}

beforeEach(() => {
  mockUser = { id: 7 }
  jest.resetAllMocks()
  getMyTournaments.mockImplementation(async (_params, pageable) => pageable?.page === 0 ? page([1, 2]) : page([2, 3]))
})

it("loads later pages and deduplicates overlapping memberships", async () => {
  const { result } = renderHook(() => useMyTournamentPages(undefined, { size: 2 }), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([1, 2]))
  expect(result.current.hasMore).toBe(true)

  act(() => result.current.loadMore())
  expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([1, 2])
  await waitFor(() => expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([1, 2, 3]))
  expect(getMyTournaments).toHaveBeenCalledWith(undefined, { page: 1, size: 2 })
  expect(result.current.hasMore).toBe(false)
})

it("loads every membership page for the ongoing view", async () => {
  getMyTournaments.mockImplementation(async (_params, pageable) =>
    pageable?.page === 0 ? page(Array.from({ length: 50 }, (_, index) => index + 1)) : page([51]),
  )
  const { result } = renderHook(() => useMyTournamentPages(undefined, { size: 50 }, true), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.tournaments?.content).toHaveLength(51))
  expect(result.current.tournaments?.content[50].id).toBe(51)
  expect(getMyTournaments).toHaveBeenCalledTimes(2)
  expect(getMyTournaments).toHaveBeenLastCalledWith(undefined, { page: 1, size: 50 })
  expect(result.current.hasMore).toBe(false)
})

it("preserves earlier pages after a load failure and retries the same window", async () => {
  const { result } = renderHook(() => useMyTournamentPages(undefined, { size: 2 }), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.tournaments?.content).toHaveLength(2))
  getMyTournaments.mockImplementationOnce(async () => page([1, 2])).mockRejectedValueOnce(new Error("offline"))
  act(() => result.current.loadMore())
  await waitFor(() => expect(result.current.error?.message).toBe("offline"))
  expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([1, 2])

  await act(async () => { await result.current.mutate() })
  expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([1, 2, 3])
})

it("resets pagination and hides old memberships immediately when the principal changes", async () => {
  const { result, rerender } = renderHook(() => useMyTournamentPages(undefined, { size: 2 }), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.tournaments?.content).toHaveLength(2))
  act(() => result.current.loadMore())
  await waitFor(() => expect(result.current.tournaments?.content).toHaveLength(3))

  let resolveNewUser!: (value: Response) => void
  getMyTournaments.mockReturnValueOnce(new Promise((resolve) => { resolveNewUser = resolve }))
  mockUser = { id: 8 }
  rerender()
  expect(result.current.tournaments).toBeUndefined()
  expect(result.current.isLoading).toBe(true)
  await act(async () => { resolveNewUser(page([8], 1)) })
  expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([8])
  expect(getMyTournaments).toHaveBeenLastCalledWith(undefined, { page: 0, size: 2 })

  mockUser = undefined
  rerender()
  expect(result.current.tournaments).toBeUndefined()
})

it("resets pagination and hides previous filter data while the new filter loads", async () => {
  const { result, rerender } = renderHook(({ searchName }) => useMyTournamentPages({ searchName }, { size: 2 }), {
    initialProps: { searchName: "old" }, wrapper: Wrapper,
  })
  await waitFor(() => expect(result.current.tournaments?.content).toHaveLength(2))
  act(() => result.current.loadMore())
  await waitFor(() => expect(result.current.tournaments?.content).toHaveLength(3))

  let resolveNewFilter!: (value: Response) => void
  getMyTournaments.mockReturnValueOnce(new Promise((resolve) => { resolveNewFilter = resolve }))
  rerender({ searchName: "new" })
  expect(result.current.tournaments).toBeUndefined()
  await act(async () => { resolveNewFilter(page([9], 1)) })
  expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([9])
  expect(getMyTournaments).toHaveBeenLastCalledWith({ searchName: "new" }, { page: 0, size: 2 })
})

it("stops an old account's multi-page request before it can fetch with the new account's session", async () => {
  let resolveOldPage!: (value: Response) => void
  getMyTournaments.mockReturnValueOnce(new Promise((resolve) => { resolveOldPage = resolve }))
  const { result, rerender } = renderHook(() => useMyTournamentPages(undefined, { size: 50 }, true), { wrapper: Wrapper })
  expect(getMyTournaments).toHaveBeenCalledTimes(1)

  mockUser = { id: 8 }
  getMyTournaments.mockResolvedValueOnce(page([8], 1))
  rerender()
  await waitFor(() => expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([8]))

  await act(async () => { resolveOldPage(page([1, 2])) })
  expect(getMyTournaments).toHaveBeenCalledTimes(2)
  expect(getMyTournaments.mock.calls.every(([, pageable]) => pageable?.page === 0)).toBe(true)
  expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([8])

  mockUser = { id: 7 }
  getMyTournaments.mockResolvedValueOnce(page([7], 1))
  rerender()
  expect(result.current.tournaments).toBeUndefined()
  await waitFor(() => expect(result.current.tournaments?.content.map(({ id }) => id)).toEqual([7]))
})
