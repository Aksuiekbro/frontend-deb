/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { StrictMode } from "react"
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
  TournamentTabs: ({
    onChangeTab,
    onResultsOptionSelect,
    resultsOptions = ["APF", "BPF", "LD"],
  }: {
    onChangeTab: (tab: string) => void
    onResultsOptionSelect?: (option: "APF" | "BPF" | "LD") => void
    resultsOptions?: ReadonlyArray<"APF" | "BPF" | "LD">
  }) => (
    <nav>
      {["Main Info", "Teams", "Judges", "Pairing and Matches", "Results and Statistics", "News"].map((tab) => (
        <button key={tab} type="button" onClick={() => onChangeTab(tab)}>
          {tab}
        </button>
      ))}
      {resultsOptions.map((opt) => (
        <button key={opt} type="button" onClick={() => onResultsOptionSelect?.(opt)}>
          {`Format ${opt}`}
        </button>
      ))}
    </nav>
  ),
}))

jest.mock("@/components/tournament/MainInfoSection", () => ({
  MainInfoSection: ({
    onOpenModal,
    onEditAnnouncement,
    onAddAnnouncementComment,
  }: {
    onOpenModal?: (context: "announcements" | "schedule" | "map" | "news") => void
    onEditAnnouncement?: (announcement: {
      id: number
      title: string
      content: string
      imageUrl: null
      timestamp: string
      author: { organizedTournaments: unknown[]; coOrganizedTournaments: unknown[] }
      user: { id: number; username: string; firstName: string; lastName: string; role: Role }
      comments: unknown[]
      tags: unknown[]
    }) => void
    onAddAnnouncementComment?: (announcementId: number, content: string) => void
  }) => (
    <div>
      <button type="button" onClick={() => onOpenModal?.("announcements")}>Open Announcement</button>
      <button type="button" onClick={() => onOpenModal?.("schedule")}>Open Schedule</button>
      {onEditAnnouncement ? (
        <button
          type="button"
          onClick={() => onEditAnnouncement({
            id: 11,
            title: "Registration open",
            content: "Teams can register now.",
            imageUrl: null,
            timestamp: "2026-06-18T10:00:00",
            author: { organizedTournaments: [], coOrganizedTournaments: [] },
            user: {
              id: 1,
              username: "organizer",
              firstName: "Org",
              lastName: "User",
              role: Role.ORGANIZER,
            },
            comments: [],
            tags: [],
          })}
        >
          Edit Announcement
        </button>
      ) : null}
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
    availableStages,
    onSelectStage,
    onSelectRound,
    onProceedToNextRound,
    onRandomizePairings,
    onSubmitPairings,
    onClearMatches,
    onSaveAllRooms,
    onUpdateMatch,
  }: {
    selectedStage: "preliminary" | "team" | "solo"
    selectedRound: string
    availableStages?: ReadonlyArray<{
      id: "preliminary" | "team" | "solo"
      label: string
      format: "APF" | "BPF" | "LD"
      defaultRound?: string
    }>
    onSelectStage: (stage: "preliminary" | "team" | "solo") => void
    onSelectRound: (round: string) => void
    onProceedToNextRound?: () => void
    onRandomizePairings?: () => Promise<boolean | void>
    onSubmitPairings?: () => Promise<boolean | void>
    onClearMatches?: (stage: "preliminary") => void
    onSaveAllRooms?: (entries: { matchId: number; location: string }[]) => Promise<boolean | void>
    onUpdateMatch?: (matchId: number, payload: { location: string; team1Id: number; team2Id: number; judgeId: number }) => void
  }) => (
    <div data-testid="pairings">
      <div data-testid="selected-pairing-state">{selectedStage}:{selectedRound}</div>
      <div data-testid="stage-formats">{availableStages?.map(({ format }) => format).join(":")}</div>
      <div data-testid="stage-labels">{availableStages?.map(({ label, format }) => `${label} (${format})`).join("|")}</div>
      <button type="button" onClick={() => {
        onSelectStage("team")
        onSelectRound("1/16")
      }}>
        Select Team Elim
      </button>
      <button type="button" onClick={() => onProceedToNextRound?.()}>Proceed Round</button>
      <button type="button" onClick={() => onRandomizePairings?.()}>Randomize Pairings</button>
      <button type="button" onClick={() => onSubmitPairings?.()}>Submit Pairings</button>
      <button type="button" onClick={() => onClearMatches?.("preliminary")}>Clear Matches</button>
      <button type="button" onClick={() => onSaveAllRooms?.([{ matchId: 301, location: " Room B-12 " }])}>Save Rooms</button>
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
    selectedResultsOption,
    roundGroupType,
    onActiveResultsSectionChange,
  }: {
    selectedResultsOption: string
    roundGroupType?: RoundGroupType
    onActiveResultsSectionChange?: (section: string) => void
    onSubmitResults?: (results: Array<{
      matchId: number
      teamResults: Array<{ teamId: number; won: boolean; participantScores: Array<{ participantId: number; score: number }> }>
    }>) => void
  }) => (
    <div data-testid="results">
      <div data-testid="selected-results-option">{selectedResultsOption}</div>
      <div data-testid="results-round-group-type">{roundGroupType ?? "unknown"}</div>
      <button type="button" onClick={() => onActiveResultsSectionChange?.("Final")}>Select Elimination Results</button>
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
let mockTournamentOrganizerIds: Array<number | null> = [1]
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
    organizers: mockTournamentOrganizerIds.map((id) => id === null ? null : ({
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
  useRoundMatches: () => ({
    roundMatches: [],
    isLoading: false,
    error: undefined,
    mutate: jest.fn(),
  }),
}))

jest.mock("@/lib/api", () => ({
  api: {
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
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
    updateMatchLocations: jest.fn(),
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

type FixtureRoundGroup = {
  id: number
  type: RoundGroupType
  format: DebateFormat
  rounds: Array<{ id: number; name: string; roundNumber: number }>
  currentRoundNumber: number | null
}

function configureRoundSelectionGroups(
  roundGroups: FixtureRoundGroup[] | (() => FixtureRoundGroup[]),
) {
  mockUseRoundSelection.mockImplementation((args: { selectedStage?: "preliminary" | "team" | "solo" }) => {
    const currentRoundGroups = typeof roundGroups === "function" ? roundGroups() : roundGroups
    const preferredType = args?.selectedStage === "team"
      ? RoundGroupType.TEAM_ELIMINATION
      : args?.selectedStage === "solo"
        ? RoundGroupType.SOLO_ELIMINATION
        : RoundGroupType.PRELIMINARY
    const selectedGroup = currentRoundGroups.find(({ type }) => type === preferredType) ?? currentRoundGroups[0]
    const selectedRound = selectedGroup?.rounds[0]

    return {
      selectedRoundGroupId: selectedGroup?.id ?? null,
      selectedRoundId: selectedRound?.id ?? null,
      selectedRoundNumber: selectedRound?.roundNumber ?? null,
      currentRoundNumber: selectedGroup?.currentRoundNumber ?? null,
      selectedRoundGroup: selectedGroup,
      selectedRound,
      rounds: selectedGroup?.rounds ?? [],
      roundGroups: currentRoundGroups,
      matches: { content: [], totalElements: 0, totalPages: 0 },
      isLoading: false,
      error: undefined,
      mutate: mockMutateMatches,
      mutateRoundGroups: mockMutateRoundGroups,
      mutateRounds: mockMutateRounds,
    }
  })
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
    selectedRoundGroup: {
      id: 101,
      type: RoundGroupType.PRELIMINARY,
      format: DebateFormat.APF,
      rounds: [],
      currentRoundNumber: 1,
    },
    selectedRound: { id: 201, name: "Round 1", roundNumber: 1 },
    rounds: [
      { id: 201, name: "Round 1", roundNumber: 1 },
      { id: 202, name: "1/16", roundNumber: 1 },
    ],
    roundGroups: [
      { id: 101, type: RoundGroupType.PRELIMINARY, format: DebateFormat.APF, rounds: [], currentRoundNumber: 1 },
      { id: 102, type: RoundGroupType.TEAM_ELIMINATION, format: DebateFormat.BPF, rounds: [], currentRoundNumber: 1 },
      { id: 103, type: RoundGroupType.SOLO_ELIMINATION, format: DebateFormat.LD, rounds: [], currentRoundNumber: 1 },
    ],
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
  it("ignores null organizer entries while resolving tournament access", () => {
    mockTournamentOrganizerIds = [null, 1]

    expect(() => render(<TournamentDetailPage />)).not.toThrow()
  })

  it("requests enough teams to render a full tournament roster", () => {
    render(<TournamentDetailPage />)

    expect(mockUseTournamentTeams).toHaveBeenCalledWith(53, { page: 0, size: 100 })
  })

  it("requests enough judges to render the full judge roster", () => {
    render(<TournamentDetailPage />)

    expect(mockUseTournamentJudges).toHaveBeenCalledWith(53, undefined, { page: 0, size: 100 })
  })

  it("starts pairing workflow on the preliminary first round", () => {
    render(<TournamentDetailPage />)

    expect(mockUseRoundSelection).toHaveBeenCalledWith(expect.objectContaining({
      selectedStage: "preliminary",
      selectedRoundLabel: "Round 1",
    }))
  })

  it("renders only existing pairing stages after round-group revalidation", () => {
    configureRoundSelectionGroups([
      {
        id: 201,
        type: RoundGroupType.PRELIMINARY,
        format: DebateFormat.APF,
        rounds: [{ id: 301, name: "Preliminary 1", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
      {
        id: 202,
        type: RoundGroupType.TEAM_ELIMINATION,
        format: DebateFormat.APF,
        rounds: [{ id: 302, name: "Semifinal", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
    ])

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))

    expect(screen.getByTestId("stage-labels")).toHaveTextContent("Preliminary (APF)|Team elimination (APF)")
    expect(screen.getByTestId("stage-labels")).not.toHaveTextContent("Solo elimination")
  })

  it("renders exact mixed-stage labels and formats from round groups", () => {
    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))

    expect(screen.getByTestId("stage-labels")).toHaveTextContent(
      "Preliminary (APF)|Team elimination (BPF)|Solo elimination (LD)",
    )
  })

  it("shows APF and LD only for APF team stages with a solo LD stage", () => {
    configureRoundSelectionGroups([
      {
        id: 331,
        type: RoundGroupType.PRELIMINARY,
        format: DebateFormat.APF,
        rounds: [{ id: 431, name: "Round 1", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
      {
        id: 332,
        type: RoundGroupType.TEAM_ELIMINATION,
        format: DebateFormat.APF,
        rounds: [{ id: 432, name: "Final", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
      {
        id: 333,
        type: RoundGroupType.SOLO_ELIMINATION,
        format: DebateFormat.LD,
        rounds: [{ id: 433, name: "Semifinal", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
    ])

    render(<TournamentDetailPage />)

    expect(screen.getByRole("button", { name: "Format APF" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Format LD" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Format BPF" })).not.toBeInTheDocument()
  })

  it("shows and selects BPF when it is the only configured result format", async () => {
    configureRoundSelectionGroups([{
      id: 341,
      type: RoundGroupType.PRELIMINARY,
      format: DebateFormat.BPF,
      rounds: [{ id: 441, name: "Round 1", roundNumber: 1 }],
      currentRoundNumber: 1,
    }])

    render(<TournamentDetailPage />)

    expect(screen.getByRole("button", { name: "Format BPF" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Format APF" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Format LD" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText("Results and Statistics"))
    await waitFor(() => {
      expect(screen.getByTestId("selected-results-option")).toHaveTextContent("BPF")
    })
  })

  it("shows each distinct configured result format once", () => {
    configureRoundSelectionGroups([
      {
        id: 351,
        type: RoundGroupType.PRELIMINARY,
        format: DebateFormat.APF,
        rounds: [{ id: 451, name: "Round 1", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
      {
        id: 352,
        type: RoundGroupType.TEAM_ELIMINATION,
        format: DebateFormat.BPF,
        rounds: [{ id: 452, name: "Semifinal", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
      {
        id: 353,
        type: RoundGroupType.SOLO_ELIMINATION,
        format: DebateFormat.LD,
        rounds: [{ id: 453, name: "Final", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
    ])

    render(<TournamentDetailPage />)

    expect(screen.getAllByRole("button", { name: "Format APF" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Format BPF" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Format LD" })).toHaveLength(1)
  })

  it("passes the selected result stage type into the results workspace", async () => {
    configureRoundSelectionGroups([
      {
        id: 351,
        type: RoundGroupType.PRELIMINARY,
        format: DebateFormat.APF,
        rounds: [{ id: 451, name: "Round 1", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
      {
        id: 352,
        type: RoundGroupType.TEAM_ELIMINATION,
        format: DebateFormat.BPF,
        rounds: [{ id: 452, name: "Final", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
      {
        id: 353,
        type: RoundGroupType.SOLO_ELIMINATION,
        format: DebateFormat.LD,
        rounds: [{ id: 453, name: "Final", roundNumber: 1 }],
        currentRoundNumber: 1,
      },
    ])

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Results and Statistics"))
    expect(screen.getByTestId("results-round-group-type")).toHaveTextContent(RoundGroupType.PRELIMINARY)

    fireEvent.click(screen.getByRole("button", { name: "Select Elimination Results" }))
    await waitFor(() => {
      expect(screen.getByTestId("results-round-group-type")).toHaveTextContent(RoundGroupType.TEAM_ELIMINATION)
    })

    fireEvent.click(screen.getByRole("button", { name: "Format LD" }))
    await waitFor(() => {
      expect(screen.getByTestId("results-round-group-type")).toHaveTextContent(RoundGroupType.SOLO_ELIMINATION)
    })
  })

  it("falls back to the first remaining result format after round-group revalidation", async () => {
    const preliminary: FixtureRoundGroup = {
      id: 361,
      type: RoundGroupType.PRELIMINARY,
      format: DebateFormat.APF,
      rounds: [{ id: 461, name: "Round 1", roundNumber: 1 }],
      currentRoundNumber: 1,
    }
    const team: FixtureRoundGroup = {
      id: 362,
      type: RoundGroupType.TEAM_ELIMINATION,
      format: DebateFormat.BPF,
      rounds: [{ id: 462, name: "Semifinal", roundNumber: 1 }],
      currentRoundNumber: 1,
    }
    const solo: FixtureRoundGroup = {
      id: 363,
      type: RoundGroupType.SOLO_ELIMINATION,
      format: DebateFormat.LD,
      rounds: [{ id: 463, name: "Final", roundNumber: 1 }],
      currentRoundNumber: 1,
    }
    let groups = [preliminary, team, solo]
    configureRoundSelectionGroups(() => groups)

    const { rerender } = render(
      <StrictMode>
        <TournamentDetailPage />
      </StrictMode>,
    )
    fireEvent.click(screen.getByText("Format BPF"))

    await waitFor(() => {
      expect(screen.getByTestId("selected-results-option")).toHaveTextContent("BPF")
    })

    groups = [preliminary, solo]
    rerender(
      <StrictMode>
        <TournamentDetailPage />
      </StrictMode>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("selected-results-option")).toHaveTextContent("APF")
    })
    expect(screen.queryByRole("button", { name: "Format BPF" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Format APF" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Format LD" })).toBeInTheDocument()

    const lifecycleWarnings = (console.error as jest.Mock).mock.calls.filter(([message]) =>
      typeof message === "string" && message.includes("hasn't mounted yet"),
    )
    expect(lifecycleWarnings).toHaveLength(0)
  })

  it("normalizes an initial solo-only pairing selection to its first round", async () => {
    configureRoundSelectionGroups([{
      id: 301,
      type: RoundGroupType.SOLO_ELIMINATION,
      format: DebateFormat.LD,
      rounds: [{ id: 401, name: "Semifinal", roundNumber: 1 }],
      currentRoundNumber: 1,
    }])

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))

    await waitFor(() => {
      expect(screen.getByTestId("selected-pairing-state")).toHaveTextContent("solo:Semifinal")
    })
    expect(screen.getByTestId("stage-labels")).toHaveTextContent("Solo elimination (LD)")
    expect(screen.queryByText("Preliminary (APF)")).not.toBeInTheDocument()
  })

  it("keeps stage visibility current and normalizes a removed selected stage", async () => {
    const preliminary: FixtureRoundGroup = {
      id: 311,
      type: RoundGroupType.PRELIMINARY,
      format: DebateFormat.APF,
      rounds: [{ id: 411, name: "Round 1", roundNumber: 1 }],
      currentRoundNumber: 1,
    }
    const team: FixtureRoundGroup = {
      id: 312,
      type: RoundGroupType.TEAM_ELIMINATION,
      format: DebateFormat.BPF,
      rounds: [
        { id: 412, name: "1/16", roundNumber: 1 },
        { id: 413, name: "Semifinal", roundNumber: 2 },
      ],
      currentRoundNumber: 1,
    }
    const solo: FixtureRoundGroup = {
      id: 313,
      type: RoundGroupType.SOLO_ELIMINATION,
      format: DebateFormat.LD,
      rounds: [{ id: 414, name: "Final", roundNumber: 2 }],
      currentRoundNumber: 1,
    }
    let groups = [preliminary, team]
    configureRoundSelectionGroups(() => groups)

    const { rerender } = render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Select Team Elim"))

    await waitFor(() => {
      expect(screen.getByTestId("selected-pairing-state")).toHaveTextContent("team:1/16")
    })

    groups = [preliminary, team, solo]
    rerender(<TournamentDetailPage />)
    expect(screen.getByTestId("stage-labels")).toHaveTextContent("Solo elimination (LD)")
    expect(screen.getByTestId("selected-pairing-state")).toHaveTextContent("team:1/16")

    team.rounds = [{ id: 415, name: "Semifinal", roundNumber: 1 }]
    rerender(<TournamentDetailPage />)
    expect(screen.getByTestId("selected-pairing-state")).toHaveTextContent("team:Semifinal")

    groups = [preliminary, solo]
    rerender(<TournamentDetailPage />)

    await waitFor(() => {
      expect(screen.getByTestId("selected-pairing-state")).toHaveTextContent("preliminary:Round 1")
    })
    expect(screen.getByTestId("stage-labels")).toHaveTextContent("Preliminary (APF)|Solo elimination (LD)")
    expect(screen.getByTestId("stage-labels")).not.toHaveTextContent("Team elimination")
  })

  it("does not emit a lifecycle warning when delayed round data arrives in StrictMode", async () => {
    let groups: FixtureRoundGroup[] = []
    configureRoundSelectionGroups(() => groups)

    const { rerender } = render(
      <StrictMode>
        <TournamentDetailPage />
      </StrictMode>,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
      groups = [{
        id: 321,
        type: RoundGroupType.SOLO_ELIMINATION,
        format: DebateFormat.LD,
        rounds: [{ id: 421, name: "Semifinal", roundNumber: 1 }],
        currentRoundNumber: 1,
      }]
      rerender(
        <StrictMode>
          <TournamentDetailPage />
        </StrictMode>,
      )
    })

    fireEvent.click(screen.getByText("Pairing and Matches"))
    await waitFor(() => {
      expect(screen.getByTestId("selected-pairing-state")).toHaveTextContent("solo:Semifinal")
    })

    const lifecycleWarnings = (console.error as jest.Mock).mock.calls.filter(([message]) =>
      typeof message === "string" && message.includes("hasn't mounted yet"),
    )
    expect(lifecycleWarnings).toHaveLength(0)
  })

  it("does not emit a lifecycle warning when unmounted immediately in StrictMode", () => {
    configureRoundSelectionGroups([])

    const { unmount } = render(
      <StrictMode>
        <TournamentDetailPage />
      </StrictMode>,
    )
    unmount()

    const lifecycleWarnings = (console.error as jest.Mock).mock.calls.filter(([message]) =>
      typeof message === "string" && message.includes("hasn't mounted yet"),
    )
    expect(lifecycleWarnings).toHaveLength(0)
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
    fireEvent.change(screen.getByLabelText("News category"), { target: { value: "Important" } })
    fireEvent.click(screen.getByText("Submit Post"))

    await waitFor(() => {
      expect(apiMock.createAnnouncement).toHaveBeenCalledWith(
        53,
        { title: "Registration open", content: "Teams can register now.", tags: ["Important"] },
        mockPrimaryImage,
      )
    })
    expect(mockMutateAnnouncements).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByTestId("add-post-modal")).not.toBeInTheDocument()
    })
  })

  it("updates an announcement through the backend and refreshes announcements", async () => {
    apiMock.updateAnnouncement.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Edit Announcement"))

    expect(screen.getByLabelText("Post title")).toHaveValue("Registration open")
    expect(screen.getByLabelText("Post description")).toHaveValue("Teams can register now.")

    fillPostForm("Registration updated", "Photo and copy changed.")
    fireEvent.click(screen.getByText("Submit Post"))

    await waitFor(() => {
      expect(apiMock.updateAnnouncement).toHaveBeenCalledWith(
        53,
        11,
        { title: "Registration updated", content: "Photo and copy changed.", tags: ["Info"] },
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
    fireEvent.click(screen.getByText("Submit Post"))

    await waitFor(() => {
      expect(apiMock.createNews).toHaveBeenCalledWith(
        {
          title: "Round highlights",
          content: "The first round finished.",
          tags: ["tournament:53"],
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
    mockTournamentOrganizerIds = [99]

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
    mockTournamentOrganizerIds = [99]

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

  it("re-selects the active round when returning to APF after LD so the results table is not stranded", async () => {
    render(<TournamentDetailPage />)

    // Switching to LD parks the selection on the elimination round "1/16".
    fireEvent.click(screen.getByText("Format LD"))
    await waitFor(() => {
      expect(mockUseRoundSelection).toHaveBeenLastCalledWith(expect.objectContaining({
        selectedRoundLabel: "1/16",
      }))
    })

    // Returning to APF must reset to the active round (currentRoundNumber = 1),
    // not leave the stale "1/16" that renders an empty results table.
    fireEvent.click(screen.getByText("Format APF"))
    await waitFor(() => {
      expect(mockUseRoundSelection).toHaveBeenLastCalledWith(expect.objectContaining({
        selectedRoundLabel: "Round 1",
      }))
    })
  })

  it("passes locked round group formats to pairings without exposing format changes", () => {
    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))

    expect(screen.getByTestId("stage-formats")).toHaveTextContent("APF:BPF:LD")
    expect(screen.queryByText("Change Format")).not.toBeInTheDocument()
    expect(apiMock.changeRoundGroupFormat).not.toHaveBeenCalled()
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

  it("bulk updates trimmed match rooms for the selected round", async () => {
    apiMock.updateMatchLocations.mockResolvedValue(okResponse())

    render(<TournamentDetailPage />)
    fireEvent.click(screen.getByText("Pairing and Matches"))
    fireEvent.click(screen.getByText("Save Rooms"))

    await waitFor(() => {
      expect(apiMock.updateMatchLocations).toHaveBeenCalledWith(53, 101, 201, [{
        matchId: 301,
        location: "Room B-12",
      }])
    })
    expect(mockMutateMatches).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "1 rooms saved",
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
