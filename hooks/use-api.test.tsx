/**
 * @jest-environment jsdom
 */
import { StrictMode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { SWRConfig, useSWRConfig } from "swr"
import { api } from "@/lib/api"
import type { UserResponse } from "@/types/user/user"
import { useCurrentUser, useMyTournaments, useTournamentJudges, useTournamentMainOrganizer } from "./use-api"

jest.mock("@/lib/api", () => ({
  api: {
    getMe: jest.fn(),
    getMyTournaments: jest.fn(),
    getMainOrganizer: jest.fn(),
    getJudges: jest.fn(),
  },
}))

const getMeMock = api.getMe as jest.MockedFunction<typeof api.getMe>
const getMyTournamentsMock = api.getMyTournaments as jest.MockedFunction<typeof api.getMyTournaments>
const getMainOrganizerMock = api.getMainOrganizer as jest.MockedFunction<typeof api.getMainOrganizer>
const getJudgesMock = api.getJudges as jest.MockedFunction<typeof api.getJudges>

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

function AccountSwitcher({ user }: { user: UserResponse | null }) {
  const { mutate } = useSWRConfig()
  return <button onClick={() => void mutate(["current-user"], user, { revalidate: false })}>Switch account</button>
}

function JudgesConsumer() {
  const { judges, isLoading } = useTournamentJudges(42)
  return <output>{isLoading ? "loading" : judges?.content[0]?.email ?? "redacted"}</output>
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
    jest.resetAllMocks()
    getMeMock.mockResolvedValue(response(authenticatedUser))
  })

  it("does not request memberships before authentication resolves or for guests", async () => {
    let resolveUser!: (value: Response) => void
    getMeMock.mockReturnValue(new Promise((resolve) => { resolveUser = resolve }))
    render(<SWRConfig value={{ provider: () => new Map() }}><MyTournamentsConsumer /></SWRConfig>)

    expect(screen.getByTestId("my-tournaments")).toHaveTextContent("loading")
    expect(getMyTournamentsMock).not.toHaveBeenCalled()
    resolveUser(response(null, 403))
    await waitFor(() => expect(screen.getByTestId("my-tournaments")).not.toHaveTextContent("loading"))
    expect(getMyTournamentsMock).not.toHaveBeenCalled()
  })

  it("isolates cached memberships when the account changes", async () => {
    getMyTournamentsMock
      .mockResolvedValueOnce(response({ content: [{ id: 1, name: "First account cup" }] }))
      .mockResolvedValueOnce(response({ content: [{ id: 2, name: "Second account cup" }] }))
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 300000 }}>
        <MyTournamentsConsumer />
        <AccountSwitcher user={{ ...authenticatedUser, id: 8 }} />
      </SWRConfig>,
    )
    expect(await screen.findByText("First account cup")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Switch account" }))
    expect(await screen.findByText("Second account cup")).toBeInTheDocument()
    expect(screen.queryByText("First account cup")).not.toBeInTheDocument()
    expect(getMyTournamentsMock).toHaveBeenCalledTimes(2)
  })

  it("clears cached memberships when the account signs out", async () => {
    getMyTournamentsMock.mockResolvedValue(response({ content: [{ id: 1, name: "Private cup" }] }))
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <MyTournamentsConsumer />
        <AccountSwitcher user={null} />
      </SWRConfig>,
    )
    expect(await screen.findByText("Private cup")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Switch account" }))
    await waitFor(() => expect(screen.queryByText("Private cup")).not.toBeInTheDocument())
    expect(getMyTournamentsMock).toHaveBeenCalledTimes(1)
  })

  it("does not reuse an organizer's private judge contacts for another viewer", async () => {
    getJudgesMock
      .mockResolvedValueOnce(response({ content: [{ id: 9, email: "judge@example.com" }] }))
      .mockResolvedValueOnce(response({ content: [{ id: 9 }] }))
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 300000 }}>
        <JudgesConsumer />
        <AccountSwitcher user={{ ...authenticatedUser, id: 8 }} />
      </SWRConfig>,
    )
    expect(await screen.findByText("judge@example.com")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Switch account" }))
    expect(await screen.findByText("redacted")).toBeInTheDocument()
    expect(screen.queryByText("judge@example.com")).not.toBeInTheDocument()
    expect(getJudgesMock).toHaveBeenCalledTimes(2)
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
