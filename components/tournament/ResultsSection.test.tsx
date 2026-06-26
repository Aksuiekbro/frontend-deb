/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { ResultsSection } from "./ResultsSection"
import { getResultInputDraftStorageKey } from "@/lib/tournament-result-drafts"
import type { MatchResultRequest } from "@/types/tournament/match"
import { Role } from "@/types/user/user"

const participantProfile = {
  city: { id: 1, name: "City" },
  institution: { id: 1, name: "Institution" },
  rating: 0,
}

const makeParticipant = (id: number, firstName: string) => ({
  id,
  speakerScore: 0,
  participantProfile,
  user: {
    id: 1000 + id,
    username: firstName.toLowerCase(),
    firstName,
    lastName: "",
    role: Role.PARTICIPANT,
  },
})

const team1Members = [makeParticipant(11, "Arman"), makeParticipant(12, "Aisha")]
const team2Members = [makeParticipant(21, "Boris"), makeParticipant(22, "Dana")]

const baseProps = {
  selectedResultsOption: "APF",
  resultsSubTab: "Results" as const,
  onResultsSubTabChange: jest.fn(),
  bpfSubTab: "BPF Results",
  activeResultsSection: "APF Results",
  onActiveResultsSectionChange: jest.fn(),
  selectedRound: "Round 1",
  onSelectedRoundChange: jest.fn(),
  teams: { content: [], totalElements: 0, totalPages: 0 },
  teamsLoading: false,
  teamsError: undefined,
  canManageTeams: false,
  onDeleteTeam: jest.fn(),
  deletingTeamId: null,
}

describe("ResultsSection", () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.clearAllMocks()
  })

  it("does not expose an enabled submit button without a real result submit handler", () => {
    render(<ResultsSection {...baseProps} />)

    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled()
  })

  it("does not submit an empty result payload when there are no match rows", () => {
    const onSubmitResults = jest.fn()

    render(<ResultsSection {...baseProps} onSubmitResults={onSubmitResults} />)
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    expect(onSubmitResults).not.toHaveBeenCalled()
  })

  it("renders editable score inputs for uncompleted current-round matches", async () => {
    const onSubmitResults = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1", checkedIn: true },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={onSubmitResults}
      />,
    )

    expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" })).toBeEnabled()
    expect(screen.getByLabelText("Speaker points for Arman in match 301")).toBeEnabled()
    expect(screen.getByLabelText("Speaker points for Aisha in match 301")).toBeEnabled()
    expect(screen.getByLabelText("Speaker points for Boris in match 301")).toBeEnabled()
    expect(screen.getByLabelText("Speaker points for Dana in match 301")).toBeEnabled()
    expect(screen.getByRole("button", { name: "Submit results" })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 301"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 301"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 301"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 301"), { target: { value: "73" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([
        {
          matchId: 301,
          teamResults: [
            {
              teamId: 1,
              won: true,
              participantScores: [
                { participantId: 11, score: 75 },
                { participantId: 12, score: 76 },
              ],
            },
            {
              teamId: 2,
              won: false,
              participantScores: [
                { participantId: 21, score: 72 },
                { participantId: 22, score: 73 },
              ],
            },
          ],
        },
      ] satisfies MatchResultRequest[])
    })
  })

  it("keeps unsent result drafts when switching away from the results table and back", async () => {
    const storageKey = "tournament:53:round-group:101:round:201:match-results"
    const { unmount } = render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={jest.fn()}
        resultStorageKey={storageKey}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 301"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 301"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 301"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 301"), { target: { value: "73" } })

    unmount()

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={jest.fn()}
        resultStorageKey={storageKey}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" })).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" })).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByLabelText("Speaker points for Arman in match 301")).toHaveValue(75)
      expect(screen.getByLabelText("Speaker points for Aisha in match 301")).toHaveValue(76)
      expect(screen.getByLabelText("Speaker points for Boris in match 301")).toHaveValue(72)
      expect(screen.getByLabelText("Speaker points for Dana in match 301")).toHaveValue(73)
      expect(screen.getByText("Open")).toBeInTheDocument()
    })
  })

  it("promotes completed drafts as submitted while submit is pending", async () => {
    let resolveSubmit: (value: boolean) => void = () => undefined
    const onSubmitResults = jest.fn(() => new Promise<boolean>((resolve) => {
      resolveSubmit = resolve
    }))
    const storageKey = "tournament:53:round-group:101:round:201:match-results"

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={onSubmitResults}
        resultStorageKey={storageKey}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 301"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 301"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 301"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 301"), { target: { value: "73" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    const inputDraftStorageKey = getResultInputDraftStorageKey(storageKey)

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(inputDraftStorageKey ?? "") ?? "{}")).toEqual(expect.objectContaining({
        "301:team1": { result: "won" },
        "301:team1:participant:11": { score: "75" },
        "301:team1:participant:12": { score: "76" },
        "301:team2": { result: "lost" },
        "301:team2:participant:21": { score: "72" },
        "301:team2:participant:22": { score: "73" },
      }))
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toEqual(expect.objectContaining({
        "301:team1": { result: "won" },
        "301:team1:participant:11": { score: "75" },
        "301:team1:participant:12": { score: "76" },
        "301:team2": { result: "lost" },
        "301:team2:participant:21": { score: "72" },
        "301:team2:participant:22": { score: "73" },
      }))
    })

    await act(async () => {
      resolveSubmit(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toEqual(expect.objectContaining({
        "301:team1": { result: "won" },
        "301:team1:participant:11": { score: "75" },
        "301:team1:participant:12": { score: "76" },
        "301:team2": { result: "lost" },
        "301:team2:participant:21": { score: "72" },
        "301:team2:participant:22": { score: "73" },
      }))
      expect(window.localStorage.getItem(inputDraftStorageKey ?? "")).toBeNull()
    })
  })

  it("keeps input drafts and rolls back submitted drafts when submit fails", async () => {
    const onSubmitResults = jest.fn(async () => false)
    const storageKey = "tournament:53:round-group:101:round:201:match-results"

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={onSubmitResults}
        resultStorageKey={storageKey}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 301"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 301"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 301"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 301"), { target: { value: "73" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    const inputDraftStorageKey = getResultInputDraftStorageKey(storageKey)

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalled()
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toEqual({})
      expect(JSON.parse(window.localStorage.getItem(inputDraftStorageKey ?? "") ?? "{}")).toEqual(expect.objectContaining({
        "301:team1": { result: "won" },
        "301:team1:participant:11": { score: "75" },
        "301:team1:participant:12": { score: "76" },
        "301:team2": { result: "lost" },
        "301:team2:participant:21": { score: "72" },
        "301:team2:participant:22": { score: "73" },
      }))
    })
  })

  it("keeps completed match scores read-only to avoid double-submitting totals", () => {
    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              team1ParticipantScores: [
                { participantId: 11, score: 75 },
                { participantId: 12, score: 76 },
              ],
              team2ParticipantScores: [
                { participantId: 21, score: 72 },
                { participantId: 22, score: 73 },
              ],
              team1Won: true,
              team2Won: false,
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1", checkedIn: true },
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={jest.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByLabelText("Speaker points for Arman in match 301")).toBeDisabled()
    expect(screen.getByLabelText("Speaker points for Arman in match 301")).toHaveValue(75)
    expect(screen.getByRole("button", { name: "Submit results" })).toBeDisabled()
  })

  it("switches between backend-provided rounds from the results screen", () => {
    const onSelectedRoundChange = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        matches={{ content: [], totalElements: 0, totalPages: 0 }}
        matchesLoading={false}
        selectedRound="Round 1"
        rounds={[
          { id: 201, name: "Round 1", roundNumber: 1, customFormat: "APF" as never },
          { id: 202, name: "Round 2", roundNumber: 2, customFormat: "APF" as never },
          { id: 203, name: "Round 3", roundNumber: 3, customFormat: "APF" as never },
        ]}
        onSelectedRoundChange={onSelectedRoundChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Round 2" }))

    expect(onSelectedRoundChange).toHaveBeenCalledWith("Round 2")
  })

  it("hydrates submitted results from local fallback when the match list omits scores after refresh", async () => {
    const storageKey = "tournament:53:round-group:101:round:201:match-results"
    window.localStorage.setItem(storageKey, JSON.stringify({
      "301:team1": { result: "won" },
      "301:team1:participant:11": { score: "75" },
      "301:team1:participant:12": { score: "76" },
    }))

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1", checkedIn: true },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={jest.fn()}
        resultStorageKey={storageKey}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" })).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" })).toBeDisabled()
      expect(screen.getByLabelText("Speaker points for Arman in match 301")).toHaveValue(75)
      expect(screen.getByLabelText("Speaker points for Arman in match 301")).toBeDisabled()
      expect(screen.getByText("Completed")).toBeInTheDocument()
    })
  })
})
