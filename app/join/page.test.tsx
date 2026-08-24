/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { StrictMode, type ComponentPropsWithoutRef } from "react"
import JoinDebatesPage from "./page"
import { api } from "@/lib/api"
import { DebateFormat, TournamentLeague } from "@/types/tournament/tournament"
import { Role } from "@/types/user/user"

type MockLinkProps = ComponentPropsWithoutRef<"a"> & { prefetch?: boolean }

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ prefetch, ...props }: MockLinkProps) => (
    <a {...props} data-prefetch={prefetch === undefined ? "default" : String(prefetch)} />
  ),
}))

jest.mock("../../components/Header", () => function Header() {
  return <div data-testid="header" />
})

let mockCurrentUser: {
  id: number
  username: string
  role: Role
  profileId?: number
} | null

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: () => ({
    user: mockCurrentUser,
    isLoading: false,
  }),
}))

jest.mock("@/lib/api", () => ({
  api: {
    getTournaments: jest.fn(),
    registerTeam: jest.fn(),
  },
}))

const apiMock = api as jest.Mocked<typeof api>

const tournament = {
  id: 53,
  name: "Climate Cup",
  description: "A tournament about climate innovation.",
  imageUrl: undefined,
  league: TournamentLeague.SCHOOL,
  preliminaryFormat: DebateFormat.APF,
  teamEliminationFormat: DebateFormat.APF,
  tags: [],
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

function tournamentsPage(content = [tournament], totalPages = 1) {
  return {
    content,
    totalElements: content.length,
    totalPages,
  }
}

function deferredResponse() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

async function openRegistrationModal() {
  expect(await screen.findByText("Climate Cup")).toBeInTheDocument()
  fireEvent.click(screen.getByText("Join Debates"))
  expect(screen.getByText("Tournament Registration")).toBeInTheDocument()
}

function fillRegistrationForm() {
  fireEvent.change(screen.getByPlaceholderText("Enter team name"), { target: { value: "kaprichoza" } })
  fireEvent.change(screen.getByPlaceholderText("Enter club/institution name"), { target: { value: "KTL" } })
  fireEvent.change(screen.getByPlaceholderText("Username (optional)"), { target: { value: "Aisha" } })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => undefined)
  mockCurrentUser = {
    id: 1,
    username: "debater",
    role: Role.PARTICIPANT,
    profileId: 42,
  }
  apiMock.getTournaments.mockResolvedValue(response(tournamentsPage()))
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("JoinDebatesPage tournament pagination", () => {
  it("loads page zero once in Strict Mode", async () => {
    render(
      <StrictMode>
        <JoinDebatesPage />
      </StrictMode>,
    )

    expect(await screen.findByText("Climate Cup")).toBeInTheDocument()
    expect(apiMock.getTournaments).toHaveBeenCalledTimes(1)
  })

  it("loads page zero once on initial render", async () => {
    render(<JoinDebatesPage />)

    expect(await screen.findByText("Climate Cup")).toBeInTheDocument()
    expect(apiMock.getTournaments).toHaveBeenCalledTimes(1)
    expect(apiMock.getTournaments).toHaveBeenCalledWith(
      expect.objectContaining({
        searchName: undefined,
        searchLocation: undefined,
      }),
      { page: 0, size: 10, sort: "startDate,desc" },
    )
  })

  it("resets to page zero once when a filter changes", async () => {
    const filteredTournament = { ...tournament, id: 54, name: "Astana Open" }

    render(<JoinDebatesPage />)
    expect(await screen.findByText("Climate Cup")).toBeInTheDocument()

    apiMock.getTournaments.mockClear()
    apiMock.getTournaments.mockResolvedValue(response(tournamentsPage([filteredTournament])))
    fireEvent.change(screen.getByPlaceholderText("Place/City"), { target: { value: "Astana" } })

    expect(await screen.findByText("Astana Open")).toBeInTheDocument()
    expect(apiMock.getTournaments).toHaveBeenCalledTimes(1)
    expect(apiMock.getTournaments).toHaveBeenCalledWith(
      expect.objectContaining({ searchLocation: "Astana" }),
      { page: 0, size: 10, sort: "startDate,desc" },
    )
  })

  it("appends each next page once and removes overlapping tournament ids", async () => {
    const secondTournament = { ...tournament, id: 55, name: "Justice Open" }
    apiMock.getTournaments
      .mockResolvedValueOnce(response(tournamentsPage([tournament], 2)))
      .mockResolvedValueOnce(response(tournamentsPage([tournament, secondTournament], 2)))

    render(<JoinDebatesPage />)
    expect(await screen.findByText("Climate Cup")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Load More Debates" }))
    fireEvent.click(screen.getByRole("button", { name: "Load More Debates" }))

    expect(await screen.findByText("Justice Open")).toBeInTheDocument()
    expect(screen.getAllByText("Climate Cup")).toHaveLength(1)
    expect(apiMock.getTournaments).toHaveBeenCalledTimes(2)
    expect(apiMock.getTournaments).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      { page: 1, size: 10, sort: "startDate,desc" },
    )
    expect(screen.queryByRole("button", { name: "Load More Debates" })).not.toBeInTheDocument()
  })

  it("ignores a late response from filters that are no longer active", async () => {
    const initialRequest = deferredResponse()
    const filteredRequest = deferredResponse()
    const filteredTournament = { ...tournament, id: 56, name: "Almaty Invitational" }
    apiMock.getTournaments
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(filteredRequest.promise)

    render(<JoinDebatesPage />)
    await waitFor(() => expect(apiMock.getTournaments).toHaveBeenCalledTimes(1))

    fireEvent.change(screen.getByPlaceholderText("Place/City"), { target: { value: "Almaty" } })
    await waitFor(() => expect(apiMock.getTournaments).toHaveBeenCalledTimes(2))

    await act(async () => {
      filteredRequest.resolve(response(tournamentsPage([filteredTournament])))
      await filteredRequest.promise
    })
    expect(await screen.findByText("Almaty Invitational")).toBeInTheDocument()

    await act(async () => {
      initialRequest.resolve(response(tournamentsPage()))
      await initialRequest.promise
    })
    expect(screen.getByText("Almaty Invitational")).toBeInTheDocument()
    expect(screen.queryByText("Climate Cup")).not.toBeInTheDocument()
  })

  it("ignores a late response from a page load after a filter reset", async () => {
    const pageOneRequest = deferredResponse()
    const filteredRequest = deferredResponse()
    const filteredTournament = { ...tournament, id: 57, name: "Shymkent Open" }
    const staleTournament = { ...tournament, id: 58, name: "Stale Page Tournament" }
    apiMock.getTournaments
      .mockResolvedValueOnce(response(tournamentsPage([tournament], 2)))
      .mockReturnValueOnce(pageOneRequest.promise)
      .mockReturnValueOnce(filteredRequest.promise)

    render(<JoinDebatesPage />)
    expect(await screen.findByText("Climate Cup")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Load More Debates" }))
    await waitFor(() => expect(apiMock.getTournaments).toHaveBeenCalledTimes(2))

    fireEvent.change(screen.getByPlaceholderText("Place/City"), { target: { value: "Shymkent" } })
    await waitFor(() => expect(apiMock.getTournaments).toHaveBeenCalledTimes(3))

    await act(async () => {
      filteredRequest.resolve(response(tournamentsPage([filteredTournament])))
      await filteredRequest.promise
    })
    expect(await screen.findByText("Shymkent Open")).toBeInTheDocument()

    await act(async () => {
      pageOneRequest.resolve(response(tournamentsPage([staleTournament], 2)))
      await pageOneRequest.promise
    })
    expect(screen.getByText("Shymkent Open")).toBeInTheDocument()
    expect(screen.queryByText("Stale Page Tournament")).not.toBeInTheDocument()
  })
})

describe("JoinDebatesPage team registration", () => {
  it("shows backend tournament loading errors instead of silently rendering an empty list", async () => {
    apiMock.getTournaments.mockResolvedValue(response({ message: "Backend is temporarily unavailable" }, 503))

    render(<JoinDebatesPage />)

    expect(await screen.findByText("Backend is temporarily unavailable")).toBeInTheDocument()
  })

  it("registers a participant team with the participant profile id and teammate usernames", async () => {
    apiMock.registerTeam.mockResolvedValue(response({}))

    render(<JoinDebatesPage />)
    await openRegistrationModal()
    fillRegistrationForm()
    fireEvent.click(screen.getByText("Register Team"))

    await waitFor(() => {
      expect(apiMock.registerTeam).toHaveBeenCalledWith(53, {
        name: "kaprichoza",
        club: "KTL",
        creatorId: 42,
        invitedParticipants: ["Aisha"],
      })
    })
  })

  it("shows the backend registration error and keeps the modal open", async () => {
    apiMock.registerTeam.mockResolvedValue(response({ message: "You are already registered for this tournament." }, 400))

    render(<JoinDebatesPage />)
    await openRegistrationModal()
    fillRegistrationForm()
    fireEvent.click(screen.getByText("Register Team"))

    expect(await screen.findByText("You are already registered for this tournament.")).toBeInTheDocument()
    expect(screen.getByText("Tournament Registration")).toBeInTheDocument()
  })

  it("blocks organizer accounts before submitting to the backend", async () => {
    mockCurrentUser = {
      id: 1,
      username: "organizer",
      role: Role.ORGANIZER,
      profileId: 99,
    }

    render(<JoinDebatesPage />)
    await openRegistrationModal()
    fillRegistrationForm()
    fireEvent.click(screen.getByText("Register Team"))

    expect(await screen.findByText("Only participant accounts can register a team")).toBeInTheDocument()
    expect(apiMock.registerTeam).not.toHaveBeenCalled()
  })

  it("prompts guests to sign in before team registration", async () => {
    mockCurrentUser = null

    render(<JoinDebatesPage />)
    await openRegistrationModal()

    expect(screen.getAllByText("Please sign in before registering a team.").length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute("href", "/auth?mode=login")
    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute("data-prefetch", "false")
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/auth?mode=register")
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("data-prefetch", "false")
    expect(screen.getByRole("link", { name: "More..." })).toHaveAttribute("data-prefetch", "default")
    expect(screen.getByRole("button", { name: "Register Team" })).toBeDisabled()
  })
})
