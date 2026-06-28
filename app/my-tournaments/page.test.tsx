/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import MyTournamentsPage from "./page"

const mockUseTournaments = jest.fn()

jest.mock("../../components/Header", () => function Header() {
  return <div data-testid="header" />
})

jest.mock("next/image", () => function Image() {
  return null
})

jest.mock("../../hooks/use-api", () => ({
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

describe("MyTournamentsPage", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-06-19T12:00:00.000Z"))
    mockUseTournaments.mockImplementation((params?: { startDateTo?: string; startDateFrom?: string }) => {
      if (params?.startDateTo) {
        return {
          tournaments: { content: [tournament({ id: 11, name: "Past Cup", startDate: "2026-06-10T10:00:00", endDate: "2026-06-11T18:00:00", status: "COMPLETED" })] },
          isLoading: false,
          error: undefined,
        }
      }

      if (params?.startDateFrom) {
        return {
          tournaments: { content: [tournament({ id: 13, name: "Upcoming Cup", startDate: "2026-06-25T10:00:00", endDate: "2026-06-26T18:00:00", status: "UPCOMING" })] },
          isLoading: false,
          error: undefined,
        }
      }

      return {
        tournaments: {
          content: [
            tournament({ id: 12, name: "Ongoing Cup" }),
            tournament({ id: 14, name: "Future Cup", startDate: "2026-07-01T10:00:00", endDate: "2026-07-02T18:00:00", status: "UPCOMING" }),
          ],
        },
        isLoading: false,
        error: undefined,
      }
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it("requests date-filtered tournament lists and switches between past, ongoing, and upcoming tabs", () => {
    render(<MyTournamentsPage />)

    expect(mockUseTournaments).toHaveBeenNthCalledWith(
      1,
      { startDateTo: "2026-06-19T00:00:00" },
      { page: 0, size: 20, sort: ["startDate,desc"] },
    )
    expect(mockUseTournaments).toHaveBeenNthCalledWith(
      2,
      { startDateFrom: "2026-06-19T00:00:00" },
      { page: 0, size: 20, sort: ["startDate,asc"] },
    )

    expect(screen.getByText("Past Cup")).toBeInTheDocument()
    expect(screen.getByText("school")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Ongoing" }))
    expect(screen.getByText("Ongoing Cup")).toBeInTheDocument()
    expect(screen.queryByText("Future Cup")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Upcoming" }))
    expect(screen.getByText("Upcoming Cup")).toBeInTheDocument()
  })
})
