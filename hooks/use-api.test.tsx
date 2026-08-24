/**
 * @jest-environment jsdom
 */
import { StrictMode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { SWRConfig } from "swr"
import { api } from "@/lib/api"
import type { UserResponse } from "@/types/user/user"
import { useCurrentUser, useMyTournaments, useTournamentMainOrganizer } from "./use-api"

jest.mock("@/lib/api", () => ({
  api: {
    getMe: jest.fn(),
    getMyTournaments: jest.fn(),
    getMainOrganizer: jest.fn(),
  },
}))

const getMeMock = api.getMe as jest.MockedFunction<typeof api.getMe>
const getMyTournamentsMock = api.getMyTournaments as jest.MockedFunction<typeof api.getMyTournaments>
const getMainOrganizerMock = api.getMainOrganizer as jest.MockedFunction<typeof api.getMainOrganizer>

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function CurrentUserConsumer({ name }: { name: string }) {
  const { user, isLoading } = useCurrentUser()

  return (
    <output data-testid={name}>
      {isLoading ? "loading" : user ? user.username : "anonymous"}
    </output>
  )
}

function renderConsumers() {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <StrictMode>
        <CurrentUserConsumer name="first" />
        <CurrentUserConsumer name="second" />
      </StrictMode>
    </SWRConfig>,
  )
}

function MyTournamentsConsumer() {
  const { tournaments, isLoading } = useMyTournaments(
    { startDateFrom: "2026-06-19T00:00:00" },
    { page: 0, size: 20, sort: ["startDate,asc"] },
  )

  return (
    <output data-testid="my-tournaments">
      {isLoading ? "loading" : tournaments?.content.map((tournament) => tournament.name).join(",")}
    </output>
  )
}

function MainOrganizerConsumer({ tournamentId }: { tournamentId: number }) {
  const { mainOrganizer, isLoading } = useTournamentMainOrganizer(tournamentId)

  return (
    <output data-testid="main-organizer">
      {isLoading ? "loading" : mainOrganizer?.username}
    </output>
  )
}

function notMountedWarnings(spy: jest.SpyInstance) {
  return spy.mock.calls.filter(([message]) =>
    typeof message === "string" && message.includes("hasn't mounted yet"),
  )
}

const authenticatedUser = {
  id: 7,
  username: "authenticated-user",
  firstName: "Authenticated",
  lastName: "User",
} as UserResponse

describe("useCurrentUser", () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleError = jest.spyOn(console, "error")
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it("dedupes simultaneous StrictMode consumers and exposes the authenticated user after loading", async () => {
    getMeMock.mockResolvedValue(response(authenticatedUser))

    renderConsumers()

    expect(screen.getByTestId("first")).toHaveTextContent("loading")
    expect(screen.getByTestId("second")).toHaveTextContent("loading")

    await waitFor(() => {
      expect(getMeMock).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId("first")).toHaveTextContent("authenticated-user")
      expect(screen.getByTestId("second")).toHaveTextContent("authenticated-user")
    })
    expect(notMountedWarnings(consoleError)).toHaveLength(0)
  })

  it("dedupes simultaneous StrictMode consumers and settles an immediate 403 as anonymous", async () => {
    getMeMock.mockResolvedValue(response(null, 403))

    renderConsumers()

    expect(screen.getByTestId("first")).toHaveTextContent("loading")
    expect(screen.getByTestId("second")).toHaveTextContent("loading")

    await waitFor(() => {
      expect(getMeMock).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId("first")).toHaveTextContent("anonymous")
      expect(screen.getByTestId("second")).toHaveTextContent("anonymous")
    })
    expect(notMountedWarnings(consoleError)).toHaveLength(0)
  })

  it("does not warn when an in-flight consumer unmounts immediately", () => {
    getMeMock.mockReturnValue(new Promise(() => undefined))

    const view = renderConsumers()
    view.unmount()

    expect(notMountedWarnings(consoleError)).toHaveLength(0)
  })
})

describe("principal-scoped tournament hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("loads My Tournaments through the principal-scoped API method", async () => {
    getMyTournamentsMock.mockResolvedValue(response({
      content: [{ id: 42, name: "Member Cup" }],
      totalElements: 1,
      totalPages: 1,
    }))

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <MyTournamentsConsumer />
      </SWRConfig>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("my-tournaments")).toHaveTextContent("Member Cup")
    })
    expect(getMyTournamentsMock).toHaveBeenCalledWith(
      { startDateFrom: "2026-06-19T00:00:00" },
      { page: 0, size: 20, sort: ["startDate,asc"] },
    )
  })

  it("loads the main organizer with an isolated SWR key", async () => {
    getMainOrganizerMock.mockResolvedValue(response(authenticatedUser))

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <MainOrganizerConsumer tournamentId={42} />
      </SWRConfig>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("main-organizer")).toHaveTextContent("authenticated-user")
    })
    expect(getMainOrganizerMock).toHaveBeenCalledWith(42)
  })
})
