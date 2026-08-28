/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import HomeTop from "./HomeTop"
import { LocaleProvider } from "@/lib/i18n"
import { Role } from "@/types/user/user"

jest.mock("embla-carousel-react", () => () => [jest.fn(), null])

const mockUseCurrentUser = jest.fn()

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  useUpcomingTournaments: () => ({ upcomingTournaments: { content: [] }, isLoading: false }),
}))

const renderHomeTop = () => render(
  <LocaleProvider>
    <HomeTop includeTestimonials={false} />
  </LocaleProvider>,
)

describe("HomeTop role actions", () => {
  afterEach(() => jest.clearAllMocks())

  it("gives organizers browsing and hosting actions", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { role: Role.ORGANIZER },
      isLoading: false,
      error: undefined,
    })

    renderHomeTop()

    expect(screen.getByRole("link", { name: "Browse Debates" })).toHaveAttribute("href", "/join")
    expect(screen.getAllByRole("link", { name: "Create Tournament" })).not.toHaveLength(0)
    expect(screen.queryByRole("link", { name: "Join Debate" })).not.toBeInTheDocument()
  })

  it("does not offer hosting to participants", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { role: Role.PARTICIPANT },
      isLoading: false,
      error: undefined,
    })

    renderHomeTop()

    expect(screen.getByRole("link", { name: "Join Debate" })).toHaveAttribute("href", "/join")
    expect(screen.queryByRole("link", { name: "Create Tournament" })).not.toBeInTheDocument()
  })

  it("fails closed when the current role cannot be loaded", () => {
    mockUseCurrentUser.mockReturnValue({
      user: undefined,
      isLoading: false,
      error: new Error("current user request failed"),
    })

    renderHomeTop()

    expect(screen.queryByRole("link", { name: "Join Debate" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Browse Debates" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Create Tournament" })).not.toBeInTheDocument()
  })
})
