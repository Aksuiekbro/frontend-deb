/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import TournamentDetailPage from "./page"
import { api } from "@/lib/api"
import { Role } from "@/types/user/user"
import { DebateFormat } from "@/types/tournament/tournament"
import { RoundGroupType } from "@/types/tournament/round/round-group"

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "53" }),
}))

jest.mock("@/components/Header", () => function Header() {
  return <div data-testid="header" />
})

jest.mock("@/components/tournament/TournamentHeader", () => ({
  TournamentHeader: ({ onStartTournament }: { onStartTournament?: () => void }) => (
    <div data-testid="tournament-header">
      {onStartTournament ? <button type="button" onClick={onStartTournament}>Start Tournament</button> : null}
    </div>
  ),
}))

jest.mock("@/components/tournament/TournamentTabs", () => ({
  TournamentTabs: ({ onChangeTab }: { onChangeTab: (tab: string) => void }) => (
    <nav>
      {["Main Info", "Teams", "Judges", "Pairing and Matches", "Results and Statistics", "News"].map((tab) => (
        <button key={tab} type="button" onClick={() => onChangeTab(tab)}>
          {tab}
        </button>
      ))}
    </nav>
  ),
}))

jest.mock("@/components/tournament/MainInfoSection", () => ({
  MainInfoSection: ({
    onOpenModal,
    onAddAnnouncementComment,
  }: {
    onOpenModal: (context: "announcements" | "schedule" | "map" | "news") => void
    onAddAnnouncementComment?: (announcementId: number, content: string) => void
  }) => (
    <div>
      <button type="button" onClick={() => onOpenModal("announcements")}>Open Announcement</button>
      <button type="button" onClick={() => onOpenModal("schedule")}>Open Schedule</button>
      {onAddAnnouncementComment ? (
        <button type="button" onClick={() => onAddAnnouncementComment(11, "Can we register two teams?")}>
          Add Announcement Comment
        </button>
      ) : null}
    </div>
  ),
}))

jest.mock("@/components/tournament/NewsSection", () => ({
  NewsSection: ({ onAddNews }: { onAddNews: () => void }) => (
    <button type="button" onClick={onAddNews}>Open News</button>
  ),
}))

jest.mock("@/components/tournament/JudgesSection", () => ({
  JudgesSection: ({
    judges,
    onAddJudge,
    onToggleJudgeCheckIn,
    onEditJudge,
    onDeleteJudge,
  }: {
    judges?: { content: Array<{ id: number; fullName: string; email?: string; phoneNumber?: string; checkedIn: boolean }> }
    onAddJudge?: () => void
    onToggleJudgeCheckIn?: (judge: { id: number; fullName: string; email?: string; phoneNumber?: string; checkedIn: boolean }) => void
    onEditJudge?: (judge: { id: number; fullName: string; email?: string; phoneNumber?: string; checkedIn: boolean }) => void
    onDeleteJudge?: (judge: { id: number; fullName: string; email?: string; phoneNumber?: string; checkedIn: boolean }) => void
  }) => (
    <div>
      {onAddJudge ? <button type="button" onClick={onAddJudge}>Open Judge</button> : null}
      {judges?.content.map((judge) => (
        <div key={judge.id}>
          <button type="button" onClick={() => onToggleJudgeCheckIn?.(judge)}>
            {judge.checkedIn ? `Uncheck ${judge.fullName}` : `Check in ${judge.fullName}`}
          </button>
          {onEditJudge ? <button type="button" onClick={() => onEditJudge(judge)}>Edit {judge.fullName}</button> : null}
          {onDeleteJudge ? <button type="button" onClick={() => onDeleteJudge(judge)}>Delete {judge.fullName}</button> : null}
        </div>
      ))}
    </div>
  ),
}))

jest.mock("@/components/tournament/TeamsSection", () => ({
  TeamsSection: ({
    onDeleteTeam,
    onEditTeam,
    onToggleCheckIn,
    checkInStatus,
    onDisqualifyTeam,
    onRequalifyTeam,
  }: {
    onDeleteTeam?: (teamId: number) => void
    onEditTeam?: (team: { id: number; name: string; club: { name: string }; members: Array<{ user: { username: string } }> }) => void
    onToggleCheckIn?: (teamId: number) => void
    checkInStatus: Record<number, boolean>
    onDisqualifyTeam?: (teamId: number) => void
    onRequalifyTeam?: (teamId: number) => void
  }) => (
    <div>
      <button type="button" onClick={() => onToggleCheckIn?.(7)}>
        {checkInStatus[7] ? "Uncheck Team" : "Check In Team"}
      </button>
      {onDeleteTeam ? <button type="button" onClick={() => onDeleteTeam(7)}>Delete Team</button> : null}
      {onDisqualifyTeam ? <button type="button" onClick={() => onDisqualifyTeam(7)}>Disqualify Team</button> : null}
      {onRequalifyTeam ? <button type="button" onClick={() => onRequalifyTeam(7)}>Requalify Team</button> : null}
      {onEditTeam ? (
        <button type="button" onClick={() => onEditTeam({
          id: 7,
          name: "Old Team",
          club: { name: "Old Club" },
          members: [{ user: { username: "speaker1" } }, { user: { username: "speaker2" } }],
        })}>
          Edit Team
        </button>
      ) : null}
    </div>
  ),
}))

jest.mock("@/components/tournament/AddPostModal", () => ({
  AddPostModal: ({
    isOpen,
    modalContext,
    postTitle,
    postDescription,
    selectedNewsCategory,
    errorMessage,
    onSubmit,
    onTitleChange,
    onDescriptionChange,
    onCategoryChange,
  }: {
    isOpen: boolean
    modalContext: string
    postTitle: string
    postDescription: string
    selectedNewsCategory: string
    errorMessage?: string | null
    onSubmit: () => void
    onTitleChange: (value: string) => void
    onDescriptionChange: (value: string) => void
    onCategoryChange: (value: "Important" | "Update" | "Info") => void
  }) => {
    if (!isOpen) return null
    return (
      <div data-testid="add-post-modal">
        <div>{modalContext}</div>
        <input aria-label="Post title" value={postTitle} onChange={(event) => onTitleChange(event.target.value)} />
        <textarea aria-label="Post description" value={postDescription} onChange={(event) => onDescriptionChange(event.target.value)} />
        <select
          aria-label="News category"
          value={selectedNewsCategory}
          onChange={(event) => onCategoryChange(event.target.value as "Important" | "Update" | "Info")}
        >
          <option value="Important">Important</option>
          <option value="Update">Update</option>
          <option value="Info">Info</option>
        </select>
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="button" onClick={onSubmit}>Submit Post</button>
      </div>
    )
  },
}))

jest.mock("@/components/tournament/AddJudgeModal", () => ({
  AddJudgeModal: ({
    isOpen,
    form,
    onSubmit,
    onChange,
    errorMessage,
  }: {
    isOpen: boolean
    form: { fullName?: string; email?: string; phoneNumber?: string }
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    onChange: (field: "fullName" | "email" | "phoneNumber", value: string) => void
    errorMessage?: string | null
  }) => {
    if (!isOpen) return null
    return (
      <form data-testid="add-judge-modal" onSubmit={onSubmit}>
        <input aria-label="Judge name" value={form.fullName ?? ""} onChange={(event) => onChange("fullName", event.target.value)} />
        <input aria-label="Judge email" value={form.email ?? ""} onChange={(event) => onChange("email", event.target.value)} />
        <input aria-label="Judge phone" value={form.phoneNumber ?? ""} onChange={(event) => onChange("phoneNumber", event.target.value)} />
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="submit">Submit Judge</button>
      </form>
    )
  },
}))

jest.mock("@/components/tournament/EditTeamModal", () => ({
  EditTeamModal: ({
    isOpen,
    teamName,
    clubName,
    speakerUsernames,
    onSave,
  }: {
    isOpen: boolean
    teamName?: string
    clubName?: string
    speakerUsernames?: string[]
    onSave: (payload: { name: string; club: string; speakerUsernames: string[] }) => void
  }) => {
    if (!isOpen) return null
    return (
      <div data-testid="edit-team-modal">
        <button type="button" onClick={() => onSave({
          name: `${teamName} Updated`,
          club: `${clubName} Updated`,
          speakerUsernames: [speakerUsernames?.[1] ?? "", speakerUsernames?.[0] ?? ""],
        })}>
          Save Team
        </button>
      </div>
    )
  },
}))

jest.mock("@/components/tournament/FeedbackSection", () => ({
  FeedbackSection: () => <div data-testid="feedback" />,
}))
jest.mock("@/components/tournament/InviteModal", () => ({
  InviteModal: () => <div data-testid="invite-modal" />,
}))
jest.mock("@/components/tournament/PairingsSection", () => ({
  PairingsSection: ({
    selectedStage,
    selectedRound,
    onSelectStage,
    onSelectRound,
    onProceedToNextRound,
    onChangeStageFormat,
    onRandomizePairings,
    onSubmitPairings,
    onClearMatches,
    onUpdateMatchRoom,
    onUpdateMatch,
  }: {
    selectedStage: "preliminary" | "team" | "solo"
    selectedRound: string
    onSelectStage: (stage: "preliminary" | "team" | "solo") => void
    onSelectRound: (round: string) => void
    onProceedToNextRound?: () => void
    onChangeStageFormat?: (stage: "preliminary", nextFormat: "LD") => void
    onRandomizePairings?: () => void
    onSubmitPairings?: () => void
    onClearMatches?: (stage: "preliminary") => void
    onUpdateMatchRoom?: (matchId: number, location: string) => void
    onUpdateMatch?: (matchId: number, payload: { location: string; team1Id: number; team2Id: number; judgeId: number }) => void
  }) => (
    <div data-testid="pairings">
      <div data-testid="selected-pairing-state">{selectedStage}:{selectedRound}</div>
      <button type="button" onClick={() => {
        onSelectStage("team")
        onSelectRound("1/16")
      }}>
        Select Team Elim
      </button>
      <button type="button" onClick={() => onProceedToNextRound?.()}>Proceed Round</button>
      <button type="button" onClick={() => onChangeStageFormat?.("preliminary", "LD")}>Change Format</button>
      <button type="button" onClick={() => onRandomizePairings?.()}>Randomize Pairings</button>
      <button type="button" onClick={() => onSubmitPairings?.()}>Submit Pairings</button>
      <button type="button" onClick={() => onClearMatches?.("preliminary")}>Clear Matches</button>
      <button type="button" onClick={() => onUpdateMatchRoom?.(301, "Room B-12")}>Save Room</button>
      <button type="button" onClick={() => onUpdateMatch?.(301, {
        location: "Room C-15",
        team1Id: 8,
        team2Id: 7,
        judgeId: 12,
      })}>Save Match</button>
    </div>
  ),
}))
jest.mock("@/components/tournament/ResultsSection", () => ({
  ResultsSection: ({
    onSubmitResults,
  }: {
    onSubmitResults?: (results: Array<{
      matchId: number
      teamResults: Array<{ teamId: number; won: boolean; participantScores: Array<{ participantId: number; score: number }> }>
    }>) => void
  }) => (
    <div data-testid="results">
      <button
        type="button"
        onClick={() => onSubmitResults?.([
          {
            matchId: 301,
            teamResults: [
              { teamId: 7, won: true, participantScores: [{ participantId: 14, score: 75 }] },
            ],
          },
        ])}
      >
        Submit Results
      </button>
    </div>
  ),
}))

const mockMutateAnnouncements = jest.fn()
const mockMutateSchedules = jest.fn()
const mockMutateNews = jest.fn()
const mockMutateJudges = jest.fn()
const mockMutateTeams = jest.fn()
const mockMutateMatches = jest.fn()
const mockMutateRoundGroups = jest.fn()
const mockMutateRounds = jest.fn()
const mockMutateTournament = jest.fn()
const mockToast = jest.fn()
const mockUseTournamentTeams = jest.fn()
const mockUseTournamentJudges = jest.fn()
const mockUseRoundSelection = jest.fn()
const mockPrimaryImage = new File(["primary"], "primary.png", { type: "image/png" })
const mockExtraImage = new File(["extra"], "extra.png", { type: "image/png" })
let mockCurrentRole: Role = Role.ORGANIZER
let mockCurrentUserPresent = true
let mockTournamentStarted = true
let mockTournamentOrganizerIds: number[] = [1]
let mockTeamsContent: Array<{ id: number; name: string; club: { id: number; name: string }; checkedIn: boolean }> = []

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock("@/hooks/tournament/useImageUpload", () => ({
  useImageUpload: () => ({
    imagePreviews: [],
    uploadErrors: [],
    postImages: [mockPrimaryImage, mockExtraImage],
    dzAnimate: false,
    formatBytes: (bytes: number) => `${bytes} B`,
    handleImageUpload: jest.fn(),
    handleDragOver: jest.fn(),
    handleDrop: jest.fn(),
    removeImageByKey: jest.fn(),
    resetUploads: jest.fn(),
  }),
}))

jest.mock("@/hooks/tournament/useTournamentVisibility", () => ({
  useTournamentVisibility: () => ({
    isTournamentEnabled: true,
    toggleTournamentLoading: false,
    handleTournamentToggle: jest.fn(),
  }),
}))

jest.mock("@/hooks/tournament/useRoundSelection", () => ({
  useRoundSelection: (...args: unknown[]) => mockUseRoundSelection(...args),
}))

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: () => ({
    user: mockCurrentUserPresent ? {
      id: 1,
      username: "organizer",
      firstName: "Org",
      lastName: "User",
      role: mockCurrentRole,
      profileId: 10,
    } : null,
  }),
  useTournament: () => ({
    tournament: { id: 53, name: "Climate Cup", enabled: true, started: mockTournamentStarted },
    isLoading: false,
    error: undefined,
    mutate: mockMutateTournament,
  }),
  useTournamentParticipants: () => ({ participants: { content: [], totalElements: 0, totalPages: 0 } }),
  useTournamentTeams: (...args: unknown[]) => mockUseTournamentTeams(...args),
  useTournamentAnnouncements: () => ({
    announcements: { content: [], totalElements: 0, totalPages: 0 },
    isLoading: false,
    error: undefined,
    mutate: mockMutateAnnouncements,
  }),
  useTournamentSchedules: () => ({
    schedules: [],
    isLoading: false,
    error: undefined,
    mutate: mockMutateSchedules,
  }),
  useTournamentJudges: (...args: unknown[]) => mockUseTournamentJudges(...args),
  useTournamentOrganizers: () => ({
    organizers: mockTournamentOrganizerIds.map((id) => ({
      id,
      username: `organizer${id}`,
      firstName: "Org",
      lastName: "User",
      role: Role.ORGANIZER,
    })),
    isLoading: false,
    error: undefined,
    mutate: jest.fn(),
  }),
  useTournamentFeedbacks: () => ({
    feedbacks: { content: [], totalElements: 0, totalPages: 0 },
    isLoading: false,
    error: undefined,
    mutate: jest.fn(),
  }),
  useNews: () => ({
    news: { content: [], totalElements: 0, totalPages: 0 },
    isLoading: false,
    error: undefined,
    mutate: mockMutateNews,
  }),
}))

jest.mock("@/lib/api", () => ({
  api: {
    createAnnouncement: jest.fn(),
    addSchedule: jest.fn(),
    createNews: jest.fn(),
    addJudge: jest.fn(),
    updateJudge: jest.fn(),
    deleteJudge: jest.fn(),
    removeTeam: jest.fn(),
    updateTeam_Organizer: jest.fn(),
    updateTeam_Participant: jest.fn(),
    checkInTeam: jest.fn(),
    uncheckInTeam: jest.fn(),
    disqualifyTeam: jest.fn(),
    requalifyTeam: jest.fn(),
    startTournament: jest.fn(),
    proceedToNextRound: jest.fn(),
    changeRoundGroupFormat: jest.fn(),
    updateMatch: jest.fn(),
    randomizeMatches: jest.fn(),
    publishMatches: jest.fn(),
    submitMatchResults: jest.fn(),
    clearMatches: jest.fn(),
    addAnnouncementComment: jest.fn(),
  },
}))

const apiMock = api as jest.Mocked<typeof api>

function okResponse() {
  return {
    ok: true,
    status: 200,
    text: async () => "",
    json: async () => ({}),
  } as Response
}

function errorResponse(message: string, status = 400) {
  return {
    ok: false,
    status,
    text: async () => JSON.stringify({ message }),
    json: async () => ({ message }),
  } as Response
}

function fillPostForm(title = "Registration open", description = "Teams can register now.") {
  fireEvent.change(screen.getByLabelText("Post title"), { target: { value: title } })
  fireEvent.change(screen.getByLabelText("Post description"), { target: { value: description } })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCurrentRole = Role.ORGANIZER
  mockCurrentUserPresent = true
  mockTournamentStarted = true
  mockTournamentOrganizerIds = [1]
  mockTeamsContent = [{ id: 7, name: "Old Team", club: { id: 3, name: "Old Club" }, checkedIn: false }]
  mockUseTournamentTeams.mockImplementation(() => ({
    teams: {
      content: mockTeamsContent,
      totalElements: mockTeamsContent.length,
      totalPages: 1,
    },
    isLoading: false,
    error: undefined,
    mutate: mockMutateTeams,
  }))
  mockUseTournamentJudges.mockImplementation(() => ({
    judges: {
      content: [
        {
          id: 12,
          fullName: "Aigerim Judge",
          email: "judge@example.com",
          phoneNumber: "+77010000000",
          socialProfiles: [],
          checkedIn: false,
        },
      ],
      totalElements: 1,
      totalPages: 1,
    },
    isLoading: false,
    error: undefined,
    mutate: mockMutateJudges,
  }))
  mockUseRoundSelection.mockImplementation(() => ({
    selectedRoundGroupId: 101,
    selectedRoundId: 201,
    selectedRoundNumber: 1,
    currentRoundNumber: 1,
    rounds: [{ id: 201, name: "Round 1", roundNumber: 1 }],
    matches: { content: [], totalElements: 0, totalPages: 0 },
    isLoading: false,
    error: undefined,
    mutate: mockMutateMatches,
    mutateRoundGroups: mockMutateRoundGroups,
    mutateRounds: mockMutateRounds,
  }))
  jest.spyOn(window, "confirm").mockReturnValue(true)
  jest.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("TournamentDetailPage mutations", () => {
  it("requests enough teams to render a full tournament roster", () => {
    render(<TournamentDetailPage />)

    expect(mockUseTournamentTeams).toHaveBeenCalledWith(53, { page: 0, size: 100 })
  })

  it("requests enough judges to render the full judge roster", () => {
    render(<TournamentDetailPage />)

    expect(mockUseTournamentJudges).toHaveBeenCalledWith(53, { page: 0, size: 100 })
  })

  it("starts pairing workflow on the preliminary first round", () => {
    render(<TournamentDetailPage />)

    expect(mockUseRoundSelection).toHaveBeenCalledWith(expect.objectContaining({
      selectedStage: "preliminary",
      selectedRoundLabel: "Round 1",
    }))
  })

  it("keeps pairing stage and selected round together when switching stages", async () => {
    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Select Team Elim"))

    await waitFor(() => {
      expect(mockUseRoundSelection).toHaveBeenLastCalledWith(expect.objectContaining({
        selectedStage: "team",
        selectedRoundLabel: "1/16",
      }))
    })
  })

  it("adds an announcement through the backend and refreshes announcements", async () => {
    apiMock.createAnnouncement.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Open Announcement"))
    fillPostForm()
    fireEvent.click(screen.getByText("Submit Post"))

    await waitFor(() => {
      expect(apiMock.createAnnouncement).toHaveBeenCalledWith(
        53,
        { title: "Registration open", content: "Teams can register now." },
        mockPrimaryImage,
      )
    })
    expect(mockMutateAnnouncements).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByTestId("add-post-modal")).not.toBeInTheDocument()
    })
  })

  it("keeps the add-post modal open and shows backend errors", async () => {
    apiMock.createAnnouncement.mockResolvedValue(errorResponse("You are not an organizer", 403))

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Open Announcement"))
    fillPostForm()
    fireEvent.click(screen.getByText("Submit Post"))

    expect(await screen.findByRole("alert")).toHaveTextContent("You are not an organizer")
    expect(screen.getByTestId("add-post-modal")).toBeInTheDocument()
    expect(mockMutateAnnouncements).not.toHaveBeenCalled()
  })

  it("adds tournament news with a tournament tag and extra gallery images", async () => {
    apiMock.createNews.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("News"))
    fireEvent.click(screen.getByText("Open News"))
    fillPostForm("Round highlights", "The first round finished.")
    fireEvent.change(screen.getByLabelText("News category"), { target: { value: "Important" } })
    fireEvent.click(screen.getByText("Submit Post"))

    await waitFor(() => {
      expect(apiMock.createNews).toHaveBeenCalledWith(
        {
          title: "Round highlights",
          content: "The first round finished.",
          tags: ["tournament:53", "Important"],
        },
        mockPrimaryImage,
        [mockExtraImage],
      )
    })
    expect(mockMutateNews).toHaveBeenCalledTimes(1)
  })

  it("adds a judge through the backend and refreshes judges", async () => {
    apiMock.addJudge.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Judges"))
    fireEvent.click(screen.getByText("Open Judge"))
    fireEvent.change(screen.getByLabelText("Judge name"), { target: { value: "Aigerim Judge" } })
    fireEvent.change(screen.getByLabelText("Judge email"), { target: { value: "judge@example.com" } })
    fireEvent.change(screen.getByLabelText("Judge phone"), { target: { value: "+77010000000" } })
    fireEvent.click(screen.getByText("Submit Judge"))

    await waitFor(() => {
      expect(apiMock.addJudge).toHaveBeenCalledWith(53, {
        fullName: "Aigerim Judge",
        email: "judge@example.com",
        phoneNumber: "+77010000000",
      })
    })
    expect(mockMutateJudges).toHaveBeenCalledTimes(1)
  })

  it("checks in a judge through the backend and refreshes judges", async () => {
    apiMock.updateJudge.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Judges"))
    fireEvent.click(screen.getByText("Check in Aigerim Judge"))

    await waitFor(() => {
      expect(apiMock.updateJudge).toHaveBeenCalledWith(53, 12, {
        fullName: "Aigerim Judge",
        email: "judge@example.com",
        phoneNumber: "+77010000000",
        checkedIn: true,
      })
    })
    expect(mockMutateJudges).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Judge checked in",
    }))
  })

  it("edits a judge through the backend and refreshes judges", async () => {
    apiMock.updateJudge.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Judges"))
    fireEvent.click(screen.getByText("Edit Aigerim Judge"))
    fireEvent.change(screen.getByLabelText("Judge name"), { target: { value: "Aigerim Updated" } })
    fireEvent.change(screen.getByLabelText("Judge email"), { target: { value: "updated@example.com" } })
    fireEvent.change(screen.getByLabelText("Judge phone"), { target: { value: "+77012223344" } })
    fireEvent.click(screen.getByText("Submit Judge"))

    await waitFor(() => {
      expect(apiMock.updateJudge).toHaveBeenCalledWith(53, 12, {
        fullName: "Aigerim Updated",
        email: "updated@example.com",
        phoneNumber: "+77012223344",
        checkedIn: false,
      })
    })
    expect(mockMutateJudges).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Judge updated",
    }))
  })

  it("deletes a judge through the backend and refreshes judges", async () => {
    apiMock.deleteJudge.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Judges"))
    fireEvent.click(screen.getByText("Delete Aigerim Judge"))

    await waitFor(() => {
      expect(apiMock.deleteJudge).toHaveBeenCalledWith(53, 12)
    })
    expect(mockMutateJudges).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Judge removed",
    }))
  })

  it("hides judge management actions from participants", () => {
    mockCurrentRole = Role.PARTICIPANT

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Judges"))

    expect(screen.queryByText("Open Judge")).not.toBeInTheDocument()
    expect(screen.queryByText("Edit Aigerim Judge")).not.toBeInTheDocument()
    expect(screen.queryByText("Delete Aigerim Judge")).not.toBeInTheDocument()
  })

  it("hides judge management actions from organizer-role users who are not assigned to this tournament", () => {
    mockCurrentRole = Role.ORGANIZER
    mockTournamentOrganizerIds = [99]

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Judges"))

    expect(screen.queryByText("Open Judge")).not.toBeInTheDocument()
    expect(screen.queryByText("Edit Aigerim Judge")).not.toBeInTheDocument()
    expect(screen.queryByText("Delete Aigerim Judge")).not.toBeInTheDocument()
  })

  it("does not show a team removed success when deletion fails", async () => {
    apiMock.removeTeam.mockResolvedValue(errorResponse("Team is already checked in"))

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))
    fireEvent.click(screen.getByText("Delete Team"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Failed to remove team",
        description: "Team is already checked in",
        variant: "destructive",
      }))
    })
    expect(mockMutateTeams).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Team removed" }))
  })

  it("lets an organizer edit team details and members", async () => {
    apiMock.updateTeam_Organizer.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))
    fireEvent.click(screen.getByText("Edit Team"))
    fireEvent.click(screen.getByText("Save Team"))

    await waitFor(() => {
      expect(apiMock.updateTeam_Organizer).toHaveBeenCalledWith(53, 7, {
        name: "Old Team Updated",
        club: "Old Club Updated",
        members: ["speaker2", "speaker1"],
      })
    })
    expect(mockMutateTeams).toHaveBeenCalledTimes(1)
  })

  it("does not let participants edit teams directly", () => {
    mockCurrentRole = Role.PARTICIPANT

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))

    expect(screen.queryByText("Edit Team")).not.toBeInTheDocument()
  })

  it("checks in a team through the backend and refreshes teams", async () => {
    apiMock.checkInTeam.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))
    fireEvent.click(screen.getByText("Check In Team"))

    await waitFor(() => {
      expect(apiMock.checkInTeam).toHaveBeenCalledWith(53, 7)
    })
    expect(mockMutateTeams).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Team checked in",
    }))
  })

  it("rolls check-in state back and shows the backend error when check-in fails", async () => {
    apiMock.checkInTeam.mockResolvedValue(errorResponse("Team is missing a speaker"))

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))
    fireEvent.click(screen.getByText("Check In Team"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Failed to check team in",
        description: "Team is missing a speaker",
        variant: "destructive",
      }))
    })
    expect(mockMutateTeams).not.toHaveBeenCalled()
    expect(screen.getByText("Check In Team")).toBeInTheDocument()
    expect(mockToast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Team checked in" }))
  })

  it("unchecks a previously checked-in team through the backend", async () => {
    mockTeamsContent = [{ id: 7, name: "Old Team", club: { id: 3, name: "Old Club" }, checkedIn: true }]
    apiMock.uncheckInTeam.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))
    fireEvent.click(await screen.findByText("Uncheck Team"))

    await waitFor(() => {
      expect(apiMock.uncheckInTeam).toHaveBeenCalledWith(53, 7)
    })
    expect(mockMutateTeams).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Team unchecked",
    }))
  })

  it("adds an announcement comment through the backend and refreshes announcements", async () => {
    apiMock.addAnnouncementComment.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Add Announcement Comment"))

    await waitFor(() => {
      expect(apiMock.addAnnouncementComment).toHaveBeenCalledWith(53, 11, {
        content: "Can we register two teams?",
      })
    })
    expect(mockMutateAnnouncements).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Comment added",
    }))
  })

  it("hides announcement comment actions from guests", () => {
    mockCurrentUserPresent = false

    render(<TournamentDetailPage />)

    expect(screen.queryByText("Add Announcement Comment")).not.toBeInTheDocument()
  })

  it("disqualifies a team through the backend and refreshes teams", async () => {
    apiMock.disqualifyTeam.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))
    fireEvent.click(screen.getByText("Disqualify Team"))

    await waitFor(() => {
      expect(apiMock.disqualifyTeam).toHaveBeenCalledWith(53, 7)
    })
    expect(mockMutateTeams).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Team disqualified",
    }))
  })

  it("requalifies a team through the backend and refreshes teams", async () => {
    apiMock.requalifyTeam.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Teams"))
    fireEvent.click(screen.getByText("Requalify Team"))

    await waitFor(() => {
      expect(apiMock.requalifyTeam).toHaveBeenCalledWith(53, 7)
    })
    expect(mockMutateTeams).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Team requalified",
    }))
  })

  it("starts the tournament through the backend", async () => {
    mockTournamentStarted = false
    apiMock.startTournament.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Start Tournament"))

    await waitFor(() => {
      expect(apiMock.startTournament).toHaveBeenCalledWith(53)
    })
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Tournament started",
    }))
    expect(mockMutateTournament).toHaveBeenCalledTimes(1)
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
  })

  it("does not show start tournament once the tournament has started", () => {
    mockTournamentStarted = true

    render(<TournamentDetailPage />)

    expect(screen.queryByText("Start Tournament")).not.toBeInTheDocument()
  })

  it("does not randomize pairings before the tournament is started", async () => {
    mockTournamentStarted = false

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Randomize Pairings"))

    expect(apiMock.randomizeMatches).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Start tournament first",
      variant: "destructive",
    }))
  })

  it("proceeds the selected round group through the backend", async () => {
    apiMock.proceedToNextRound.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Proceed Round"))

    await waitFor(() => {
      expect(apiMock.proceedToNextRound).toHaveBeenCalledWith(53, 101)
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Round advanced",
    }))
  })

  it("changes the selected round group format through the backend", async () => {
    apiMock.changeRoundGroupFormat.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Change Format"))

    await waitFor(() => {
      expect(apiMock.changeRoundGroupFormat).toHaveBeenCalledWith(
        53,
        { format: DebateFormat.LD },
        { roundGroupType: RoundGroupType.PRELIMINARY },
      )
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Round format updated",
    }))
  })

  it("randomizes pairings for the selected round through the backend", async () => {
    apiMock.randomizeMatches.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Randomize Pairings"))

    await waitFor(() => {
      expect(apiMock.randomizeMatches).toHaveBeenCalledWith(53, 101, 201)
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Pairings randomized",
    }))
  })

  it("updates a match room for the selected round through the backend", async () => {
    apiMock.updateMatch.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Save Room"))

    await waitFor(() => {
      expect(apiMock.updateMatch).toHaveBeenCalledWith(53, 101, 201, 301, {
        location: "Room B-12",
      })
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Room updated",
    }))
  })

  it("updates match teams room and judge for the selected round", async () => {
    apiMock.updateMatch.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Save Match"))

    await waitFor(() => {
      expect(apiMock.updateMatch).toHaveBeenCalledWith(53, 101, 201, 301, {
        location: "Room C-15",
        team1Id: 8,
        team2Id: 7,
        judgeId: 12,
      })
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Match updated",
    }))
  })

  it("publishes pairings for the selected round through the backend", async () => {
    apiMock.publishMatches.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Submit Pairings"))

    await waitFor(() => {
      expect(apiMock.publishMatches).toHaveBeenCalledWith(53, 101, 201)
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Pairings published",
    }))
  })

  it("submits match results for the selected round through the backend", async () => {
    apiMock.submitMatchResults.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Results and Statistics"))
    fireEvent.click(screen.getByText("Submit Results"))

    await waitFor(() => {
      expect(apiMock.submitMatchResults).toHaveBeenCalledWith(53, 101, 201, [
        {
          matchId: 301,
          teamResults: [
            { teamId: 7, won: true, participantScores: [{ participantId: 14, score: 75 }] },
          ],
        },
      ])
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockMutateRoundGroups).toHaveBeenCalledTimes(1)
    expect(mockMutateRounds).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Results submitted",
    }))
  })

  it("clears matches for the selected round through the backend", async () => {
    apiMock.clearMatches.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Clear Matches"))

    await waitFor(() => {
      expect(apiMock.clearMatches).toHaveBeenCalledWith(53, 101, 201)
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Matches cleared",
    }))
  })
})
