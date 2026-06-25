/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { ResultsSection } from "./ResultsSection"
import type { MatchResultRequest } from "@/types/tournament/match"

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
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" } },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" } },
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
    expect(screen.getByLabelText("Speaker points for Team 1 in match 301")).toBeEnabled()
    expect(screen.getByLabelText("Speaker points for Team 2 in match 301")).toBeEnabled()
    expect(screen.getByRole("button", { name: "Submit results" })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Team 1 in match 301"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Team 2 in match 301"), { target: { value: "72" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([
        {
          matchId: 301,
          teamResults: [
            { teamId: 1, won: true, participantScores: [{ participantId: 1, score: 75 }] },
            { teamId: 2, won: false, participantScores: [{ participantId: 2, score: 72 }] },
          ],
        },
      ] satisfies MatchResultRequest[])
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
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" } },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" } },
              team1Score: 75,
              team2Score: 72,
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
    expect(screen.getByLabelText("Speaker points for Team 1 in match 301")).toBeDisabled()
    expect(screen.getByLabelText("Speaker points for Team 1 in match 301")).toHaveValue(75)
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
      "301:team1": { score: "75", result: "won" },
    }))

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" } },
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
      expect(screen.getByLabelText("Speaker points for Team 1 in match 301")).toHaveValue(75)
      expect(screen.getByLabelText("Speaker points for Team 1 in match 301")).toBeDisabled()
      expect(screen.getByText("Completed")).toBeInTheDocument()
    })
  })
})
