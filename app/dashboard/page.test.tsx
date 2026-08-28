/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import type { ComponentPropsWithoutRef } from "react"

import Dashboard from "./page"
import { LocaleProvider } from "../../lib/i18n"

type MockLinkProps = ComponentPropsWithoutRef<"a"> & { prefetch?: boolean }

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ prefetch, ...props }: MockLinkProps) => (
    <a {...props} data-prefetch={prefetch === undefined ? "default" : String(prefetch)} />
  ),
}))

const mockUseCurrentUser = jest.fn()
const mockUseUpcomingTournaments = jest.fn()
const mockUseTournaments = jest.fn()

jest.mock("../../components/Header", () => function Header() {
  return <div data-testid="header" />
})

jest.mock("../../hooks/use-api", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  useUpcomingTournaments: (...args: unknown[]) => mockUseUpcomingTournaments(...args),
  useTournaments: (...args: unknown[]) => mockUseTournaments(...args),
}))

const tournament = (overrides: Record<string, unknown>) => ({
  id: 1,
  name: "Tournament",
  description: "A tournament description",
  imageUrl: { id: 1, url: "/poster.png" },
  league: "SCHOOL",
  preliminaryFormat: "APF",
  teamEliminationFormat: "APF",
  tags: [{ name: "school" }],
  startDate: "2026-06-19T10:00:00",
  endDate: "2026-06-19T18:00:00",
  location: "Almaty",
  currentTeamCount: 2,
  maxTeamCount: 32,
  status: "ACTIVE",
  debateFormat: "APF",
  ...overrides,
})

const renderDashboard = () => render(
  <LocaleProvider>
    <Dashboard />
  </LocaleProvider>,
)

describe("Dashboard", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-06-19T12:34:56.000Z"))
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: 1,
        firstName: "Dauren",
        lastName: "Zhunussov",
        imageUrl: undefined,
        tournamentsParticipated: 4,
        rating: 1200,
      },
      isLoading: false,
      error: undefined,
    })
    mockUseUpcomingTournaments.mockReturnValue({
      upcomingTournaments: { content: [tournament({ id: 21, name: "Upcoming Open", status: "UPCOMING" })] },
      isLoading: false,
      error: undefined,
    })
    mockUseTournaments.mockReturnValue({
      tournaments: { content: [tournament({ id: 31, name: "Past Open", startDate: "2026-06-01T10:00:00", status: "COMPLETED" })] },
      isLoading: false,
      error: undefined,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it("loads dashboard tournament sections with backend-shaped filters and tag names", () => {
    renderDashboard()

    expect(mockUseUpcomingTournaments).toHaveBeenCalledWith(6)
    expect(mockUseTournaments).toHaveBeenCalledWith(
      { startDateTo: "2026-06-19T12:34:56" },
      { page: 0, size: 6, sort: ["startDate,desc"] },
    )
    expect(screen.getByText("Welcome back, Dauren!")).toBeInTheDocument()
    expect(screen.getByText("Upcoming Open")).toBeInTheDocument()
    expect(screen.getByText("Past Open")).toBeInTheDocument()
    expect(screen.getByText("school")).toBeInTheDocument()
  })

  it("uses the login auth destination without prefetching and leaves other links unchanged", () => {
    mockUseCurrentUser.mockReturnValue({
      user: null,
      isLoading: false,
      error: undefined,
    })

    renderDashboard()

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/auth?mode=login")
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("data-prefetch", "false")
    expect(screen.getByRole("link", { name: "Host Debate" })).toHaveAttribute("data-prefetch", "default")
    for (const link of screen.getAllByRole("link", { name: "Join Debates" })) {
      expect(link).toHaveAttribute("data-prefetch", "default")
    }
  })

  it("shows role-appropriate tournament actions", () => {
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: 1,
        firstName: "Dauren",
        lastName: "Zhunussov",
        role: "PARTICIPANT",
      },
      isLoading: false,
      error: undefined,
    })

    const participantDashboard = renderDashboard()

    expect(screen.getAllByRole("link", { name: "Join Debates" })).not.toHaveLength(0)
    expect(screen.queryByRole("link", { name: "Host Debate" })).not.toBeInTheDocument()

    participantDashboard.unmount()
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: 2,
        firstName: "Olivia",
        lastName: "Organizer",
        role: "ORGANIZER",
      },
      isLoading: false,
      error: undefined,
    })
    renderDashboard()

    expect(screen.getAllByRole("link", { name: "Browse Debates" })).not.toHaveLength(0)
    expect(screen.getByRole("link", { name: "Host Debate" })).toHaveAttribute("href", "/create-tournament")
  })

  it("waits for the user role before rendering tournament actions", () => {
    mockUseCurrentUser.mockReturnValue({
      user: null,
      isLoading: true,
      error: undefined,
    })

    renderDashboard()

    expect(screen.queryByRole("link", { name: "Join Debates" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Host Debate" })).not.toBeInTheDocument()
  })
})
