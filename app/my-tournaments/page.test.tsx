/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import MyTournamentsPage from "./page"
import { LocaleProvider } from "../../lib/i18n"

const mockUseMyTournaments = jest.fn()

jest.mock("../../components/Header", () => function Header() {
  return <div data-testid="header" />
})

jest.mock("next/image", () => function Image() {
  return null
})

jest.mock("../../hooks/use-api", () => ({
  useMyTournaments: (...args: unknown[]) => mockUseMyTournaments(...args),
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

const renderPage = () => render(
  <LocaleProvider>
    <MyTournamentsPage />
  </LocaleProvider>,
)

describe("MyTournamentsPage", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-06-19T12:00:00.000Z"))
    window.localStorage.setItem("debetter-locale", "en")
    mockUseMyTournaments.mockImplementation((params?: { startDateTo?: string; startDateFrom?: string }) => {
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
    renderPage()

    expect(mockUseMyTournaments).toHaveBeenNthCalledWith(
      1,
      { startDateTo: "2026-06-19T00:00:00" },
      { page: 0, size: 20, sort: ["startDate,desc"] },
    )
    expect(mockUseMyTournaments).toHaveBeenNthCalledWith(
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

    expect(mockUseMyTournaments).toHaveBeenNthCalledWith(
      3,
      undefined,
      { page: 0, size: 50, sort: ["startDate,desc"] },
    )
  })

  it.each([
    ["ru", "Мои турниры", "Прошедшие", "Идёт", "Подробнее"],
    ["kk", "Менің турнирлерім", "Өткен", "Өтіп жатыр", "Толығырақ көру"],
  ])("renders localized tournament labels and dates for %s", (locale, title, pastTab, activeStatus, details) => {
    window.localStorage.setItem("debetter-locale", locale)

    renderPage()

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: pastTab })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: locale === "ru" ? "Текущие" : "Өтіп жатқан" }))
    expect(screen.getByText(`${activeStatus}`)).toBeInTheDocument()
    expect(screen.getByText(details)).toBeInTheDocument()
    expect(screen.getByText("19.06.2026")).toBeInTheDocument()
  })
})
