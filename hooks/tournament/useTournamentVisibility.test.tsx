/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { useTournamentVisibility } from "./useTournamentVisibility"
import { api } from "@/lib/api"
import { LocaleProvider, useLocale } from "@/lib/i18n"
import type { TournamentResponse } from "@/types/tournament/tournament"

jest.mock("@/lib/api", () => ({
  api: {
    enableTournament: jest.fn(),
    disableTournament: jest.fn(),
  },
}))

const apiMock = api as jest.Mocked<typeof api>
const toast = jest.fn()

const tournament = {
  id: 53,
  name: "Climate Cup",
  disabled: false,
} as TournamentResponse

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response
}

function Harness() {
  const { isTournamentEnabled, toggleTournamentLoading, handleTournamentToggle } = useTournamentVisibility({
    tournament,
    toast,
  })
  const { locale } = useLocale()

  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span>{isTournamentEnabled ? "enabled" : "disabled"}</span>
      <span>{toggleTournamentLoading ? "loading" : "idle"}</span>
      <button type="button" onClick={() => handleTournamentToggle(false)}>Disable</button>
      <button type="button" onClick={() => handleTournamentToggle(true)}>Enable</button>
    </div>
  )
}

describe("useTournamentVisibility", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("disables a tournament and shows a success toast", async () => {
    apiMock.disableTournament.mockResolvedValue(response({}))

    render(<Harness />)
    await waitFor(() => expect(screen.getByText("enabled")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Disable"))

    await waitFor(() => {
      expect(apiMock.disableTournament).toHaveBeenCalledWith(53)
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Tournament hidden",
      }))
    })
    expect(screen.getByText("disabled")).toBeInTheDocument()
    expect(screen.getByText("idle")).toBeInTheDocument()
  })

  it("rolls back optimistic state and shows the backend error on failure", async () => {
    apiMock.disableTournament.mockResolvedValue(response({ message: "Only organizers can edit this tournament" }, 403))

    render(<Harness />)
    await waitFor(() => expect(screen.getByText("enabled")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Disable"))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Failed to update tournament",
        description: "Only organizers can edit this tournament",
        variant: "destructive",
      }))
    })
    expect(screen.getByText("enabled")).toBeInTheDocument()
    expect(screen.getByText("idle")).toBeInTheDocument()
  })

  it("translates a successful visibility toast into Russian while preserving the tournament name", async () => {
    window.localStorage.setItem("debetter-locale", "ru")
    apiMock.enableTournament.mockResolvedValue(response({}))

    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    )
    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("ru"))
    fireEvent.click(screen.getByText("Enable"))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Турнир виден",
        description: "Турнир «Climate Cup» теперь виден участникам.",
      }))
    })
  })

  it("translates a visibility permission error into Kazakh", async () => {
    window.localStorage.setItem("debetter-locale", "kk")
    apiMock.disableTournament.mockResolvedValue(response({}, 403))

    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    )
    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("kk"))
    fireEvent.click(screen.getByText("Disable"))

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Турнирді жаңарту мүмкін болмады",
        description: "Бұл әрекетті орындауға рұқсатыңыз жоқ.",
        variant: "destructive",
      }))
    })
  })
})
