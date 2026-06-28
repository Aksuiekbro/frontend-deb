/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import JoinDebatesPage from "./page"
import { api } from "@/lib/api"
import { DebateFormat, TournamentLeague } from "@/types/tournament/tournament"
import { Role } from "@/types/user/user"

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

function tournamentsPage() {
  return {
    content: [tournament],
    totalElements: 1,
    totalPages: 1,
  }
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
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/auth?mode=register")
    expect(screen.getByRole("button", { name: "Register Team" })).toBeDisabled()
  })
})
