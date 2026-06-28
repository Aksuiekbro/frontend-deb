/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import ProfileIndexPage from "./page"
import { useCurrentUser } from "@/hooks/use-api"
import { Role } from "@/types/user/user"

const replace = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}))

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: jest.fn(),
}))

const useCurrentUserMock = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>
type CurrentUserHookResult = ReturnType<typeof useCurrentUser>

describe("ProfileIndexPage", () => {
  beforeEach(() => {
    replace.mockClear()
  })

  it("redirects to the current user's profile from the client so backend cookies are available", async () => {
    useCurrentUserMock.mockReturnValue({
      user: {
        id: 17,
        username: "debater",
        firstName: "Deb",
        lastName: "Ater",
        email: "debater@example.com",
        role: Role.PARTICIPANT,
        profileId: 42,
        socialProfiles: [],
        createdAt: "2026-06-18T00:00:00",
      },
      isLoading: false,
      error: undefined,
      mutate: jest.fn(),
    } as CurrentUserHookResult)

    render(<ProfileIndexPage />)

    expect(screen.getByText("Loading profile...")).toBeInTheDocument()
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/profile/17"))
  })

  it("redirects guests to login", async () => {
    useCurrentUserMock.mockReturnValue({
      user: undefined,
      isLoading: false,
      error: new Error("unauthorized"),
      mutate: jest.fn(),
    } as CurrentUserHookResult)

    render(<ProfileIndexPage />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth?mode=login"))
  })
})
