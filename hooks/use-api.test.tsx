/**
 * @jest-environment jsdom
 */
import { StrictMode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { SWRConfig, useSWRConfig } from "swr"
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

function AccountSwitcher({ user }: { user: UserResponse }) {
  const { mutate } = useSWRConfig()

  return (
    <button
      type="button"
      onClick={() => void mutate(["current-user"], user, { revalidate: false })}
    >
      Switch account
    </button>
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
    getMeMock.mockResolvedValue(response(authenticatedUser))
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

  it("fetches a separate My Tournaments cache entry after the principal changes", async () => {
    const secondUser = {
      ...authenticatedUser,
      id: 8,
      username: "second-user",
    }
    getMyTournamentsMock
      .mockResolvedValueOnce(response({
        content: [{ id: 42, name: "First Member Cup" }],
        totalElements: 1,
        totalPages: 1,
      }))
      .mockResolvedValueOnce(response({
        content: [{ id: 43, name: "Second Member Cup" }],
        totalElements: 1,
        totalPages: 1,
      }))

    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 5 * 60 * 1000 }}>
        <MyTournamentsConsumer />
        <AccountSwitcher user={secondUser} />
      </SWRConfig>,
    )

    expect(await screen.findByText("First Member Cup")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Switch account" }))

    expect(await screen.findByText("Second Member Cup")).toBeInTheDocument()
    expect(screen.queryByText("First Member Cup")).not.toBeInTheDocument()
    expect(getMyTournamentsMock).toHaveBeenCalledTimes(2)
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
