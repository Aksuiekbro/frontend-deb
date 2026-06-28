/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Dashboard from "./page"

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
    render(<Dashboard />)

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
})
