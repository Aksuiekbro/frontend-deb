/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"

import { ResultsSection } from "./ResultsSection"
import { getResultInputDraftStorageKey } from "@/lib/tournament-result-drafts"
import { displayRoundLabel } from "@/lib/round-label"
import type { MatchResultRequest } from "@/types/tournament/match"
import { RoundGroupType } from "@/types/tournament/round/round-group"
import { Role } from "@/types/user/user"
import { LocaleProvider } from "@/lib/i18n"

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
const team3Members = [makeParticipant(31, "Erkin"), makeParticipant(32, "Fariza")]
const team4Members = [makeParticipant(41, "Gani"), makeParticipant(42, "Hana")]

const baseProps = {
  selectedResultsOption: "APF",
  resultsSubTab: "Results" as const,
  onResultsSubTabChange: jest.fn(),
  bpfSubTab: "BPF Results",
  activeResultsSection: "APF Results",
  onActiveResultsSectionChange: jest.fn(),
  selectedRound: "Round 1",
  onSelectedRoundChange: jest.fn(),
  roundGroupType: RoundGroupType.PRELIMINARY,
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

  it("renders the preliminary Results view in Russian", async () => {
    window.localStorage.setItem("debetter-locale", "ru")

    render(
      <LocaleProvider>
        <ResultsSection {...baseProps} canManageTeams matches={{ content: [], totalElements: 0, totalPages: 0 } as never} matchesLoading={false} />
      </LocaleProvider>,
    )

    await waitFor(() => expect(screen.getByRole("button", { name: "Данные спикеров" })).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "Данные спикеров" }))
    expect(screen.getByText("Предварительные раунды ещё не загружены.")).toBeInTheDocument()
  })

  it("renders the preliminary Results view in Kazakh", async () => {
    window.localStorage.setItem("debetter-locale", "kk")

    render(
      <LocaleProvider>
        <ResultsSection {...baseProps} canManageTeams matches={{ content: [], totalElements: 0, totalPages: 0 } as never} matchesLoading={false} />
      </LocaleProvider>,
    )

    await waitFor(() => expect(screen.getByRole("button", { name: "Спикерлер деректері" })).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "Спикерлер деректері" }))
    expect(screen.getByText("Алдын ала раундтар әлі жүктелмеген.")).toBeInTheDocument()
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

  it("keeps an open match editable when a later round is already current", () => {
    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 651,
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
        currentRoundNumber={3}
        canManageTeams
        onSubmitResults={jest.fn()}
      />,
    )

    expect(screen.getByLabelText("Speaker points for Arman in match 651")).toBeEnabled()
    expect(screen.getByLabelText("Speaker points for Boris in match 651")).toBeEnabled()
  })

  it("submits team knockout results without speaker points", async () => {
    const onSubmitResults = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        roundGroupType={RoundGroupType.TEAM_ELIMINATION}
        activeResultsSection="1/16"
        selectedRound="1/16"
        matches={{
          content: [
            {
              id: 901,
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
      />,
    )

    expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 901" })).toBeEnabled()
    expect(screen.queryByText("Speaker points")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Speaker points for Arman in match 901")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 901" }))
    expect(screen.getByRole("button", { name: "Submit results" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([{
        matchId: 901,
        teamResults: [
          { teamId: 1, won: true },
          { teamId: 2, won: false },
        ],
      }] satisfies MatchResultRequest[])
    })
  })

  it("keeps speaker points required until the round-group type is known", () => {
    render(
      <ResultsSection
        {...baseProps}
        roundGroupType={undefined}
        matches={{
          content: [
            {
              id: 905,
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
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 905" }))
    expect(screen.getByLabelText("Speaker points for Arman in match 905")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit results" })).toBeDisabled()
  })

  it("keeps an open Final reachable and editable after a knockout reload", () => {
    render(
      <ResultsSection
        {...baseProps}
        roundGroupType={RoundGroupType.TEAM_ELIMINATION}
        activeResultsSection="Final"
        selectedRound="Final"
        matches={{
          content: [
            {
              id: 902,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={5}
        currentRoundNumber={5}
        canManageTeams
        onSubmitResults={jest.fn()}
      />,
    )

    expect(screen.getByRole("heading", { name: "Final results" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Speaker points for Arman in match 902")).not.toBeInTheDocument()
  })

  it("returns to round entry when switching from preliminary statistics to elimination", () => {
    const result = render(
      <ResultsSection
        {...baseProps}
        matches={{ content: [], totalElements: 0, totalPages: 1 } as never}
        matchesLoading={false}
        canManageTeams
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Speaker details" }))
    expect(screen.getByRole("button", { name: "Speaker details" })).toHaveAttribute("aria-pressed", "true")

    result.rerender(
      <ResultsSection
        {...baseProps}
        roundGroupType={RoundGroupType.TEAM_ELIMINATION}
        activeResultsSection="Final"
        selectedRound="Final"
        matches={{ content: [], totalElements: 0, totalPages: 1 } as never}
        matchesLoading={false}
        canManageTeams
      />,
    )

    expect(screen.getByRole("heading", { name: "Final results" })).toBeInTheDocument()
  })

  it("treats a redacted completed elimination match as complete for read-only users", () => {
    render(
      <ResultsSection
        {...baseProps}
        roundGroupType={RoundGroupType.TEAM_ELIMINATION}
        activeResultsSection="Final"
        selectedRound="Final"
        matches={{
          content: [{
            id: 906,
            team1: { id: 1, name: "Team 1", members: team1Members },
            team2: { id: 2, name: "Team 2", members: team2Members },
            completed: true,
          }],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        canManageTeams={false}
      />,
    )

    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.queryByText(/Needs correction/)).not.toBeInTheDocument()
    expect(screen.queryByText(/invalid outcome/)).not.toBeInTheDocument()
  })

  it("submits the fully-scored matches without waiting for every match in the round", async () => {
    const onSubmitResults = jest.fn(async () => true)

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
            {
              id: 302,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              completed: false,
            },
          ],
          totalElements: 2,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        canManageTeams
        onSubmitResults={onSubmitResults}
      />,
    )

    // With nothing filled the button stays disabled.
    expect(screen.getByRole("button", { name: "Submit results" })).toBeDisabled()

    // Fully score ONLY match 301 (match 302 stays untouched).
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 301" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 2 as not winner in match 301" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 301"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 301"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 301"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 301"), { target: { value: "73" } })

    // A completed match now enables submitting, and the helper text reflects the pending one.
    expect(screen.getByRole("button", { name: "Submit results" })).toBeEnabled()
    expect(screen.getByText(/1 of 2 matches ready to submit\. 1 still need/i)).toBeInTheDocument()

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

  it("keeps a two-team ballot to exactly one winner when toggling losses", async () => {
    const onSubmitResults = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 310,
              team1: { id: 31, name: "Team 31", club: { id: 31, name: "Club 31" }, members: team1Members },
              team2: { id: 6, name: "Team 6", club: { id: 6, name: "Club 6" }, members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={3}
        currentRoundNumber={3}
        canManageTeams
        onSubmitResults={onSubmitResults}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 31 as not winner in match 310" }))
    expect(screen.getByRole("button", { name: "Mark Team 31 as not winner in match 310" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Mark Team 6 as winner in match 310" })).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 6 as not winner in match 310" }))
    expect(screen.getByRole("button", { name: "Mark Team 31 as winner in match 310" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Mark Team 6 as not winner in match 310" })).toHaveAttribute("aria-pressed", "true")

    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 310"), { target: { value: "24" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 310"), { target: { value: "19" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 310"), { target: { value: "24" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 310"), { target: { value: "24" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([
        {
          matchId: 310,
          teamResults: [
            {
              teamId: 31,
              won: true,
              participantScores: [
                { participantId: 11, score: 24 },
                { participantId: 12, score: 19 },
              ],
            },
            {
              teamId: 6,
              won: false,
              participantScores: [
                { participantId: 21, score: 24 },
                { participantId: 22, score: 24 },
              ],
            },
          ],
        },
      ] satisfies MatchResultRequest[])
    })
  })

  it("submits LD Win/Lose using the explicit winner participant", async () => {
    const debater1 = makeParticipant(1301, "Winner")
    const debater2 = makeParticipant(1351, "Runner")
    const onSubmitResults = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        roundGroupType={RoundGroupType.SOLO_ELIMINATION}
        selectedResultsOption="LD"
        activeResultsSection="Final"
        selectedRound="Final"
        matches={{
          content: [
            {
              id: 501,
              debater1,
              debater2,
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

    expect(screen.queryByText("Speaker points")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Mark Winner as winner in match 501" }))
    expect(screen.getByRole("button", { name: "Mark Runner as not winner in match 501" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([{
        matchId: 501,
        winnerParticipantId: 1301,
      }] satisfies MatchResultRequest[])
    })
  })

  it("keeps the BPF results view available when BPF is selected", () => {
    render(
      <ResultsSection
        {...baseProps}
        selectedResultsOption="BPF"
        bpfSubTab="BPF Results"
      />,
    )

    expect(screen.getByRole("heading", { name: "BPF" })).toBeInTheDocument()
    expect(screen.getByText("Fraction Name")).toBeInTheDocument()
  })

  it("submits BPF ballots with exactly two winners and two losses", async () => {
    const onSubmitResults = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        selectedResultsOption="BPF"
        matches={{
          content: [
            {
              id: 411,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              team3: { id: 3, name: "Team 3", club: { id: 3, name: "Club 3" }, members: team3Members },
              team4: { id: 4, name: "Team 4", club: { id: 4, name: "Club 4" }, members: team4Members },
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

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 1 as winner in match 411" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 2 as winner in match 411" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 3 as not winner in match 411" }))
    fireEvent.click(screen.getByRole("button", { name: "Mark Team 4 as not winner in match 411" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 411"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 411"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 411"), { target: { value: "74" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 411"), { target: { value: "73" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Erkin in match 411"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Fariza in match 411"), { target: { value: "71" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Gani in match 411"), { target: { value: "70" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Hana in match 411"), { target: { value: "69" } })

    expect(screen.getByRole("button", { name: "Submit results" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([
        {
          matchId: 411,
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
              won: true,
              participantScores: [
                { participantId: 21, score: 74 },
                { participantId: 22, score: 73 },
              ],
            },
            {
              teamId: 3,
              won: false,
              participantScores: [
                { participantId: 31, score: 72 },
                { participantId: 32, score: 71 },
              ],
            },
            {
              teamId: 4,
              won: false,
              participantScores: [
                { participantId: 41, score: 70 },
                { participantId: 42, score: 69 },
              ],
            },
          ],
        },
      ] satisfies MatchResultRequest[])
    })
  })

  it("renders all four BPF entrants and persisted winner states after a Final reload", () => {
    render(
      <ResultsSection
        {...baseProps}
        roundGroupType={RoundGroupType.TEAM_ELIMINATION}
        selectedResultsOption="BPF"
        activeResultsSection="Final"
        selectedRound="Final"
        rounds={[{ id: 412, name: "Final", roundNumber: 2, customFormat: "BPF" as never }]}
        matches={{
          content: [
            {
              id: 41201,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              team3: { id: 3, name: "Team 3", club: { id: 3, name: "Club 3" }, members: team3Members },
              team4: { id: 4, name: "Team 4", club: { id: 4, name: "Club 4" }, members: team4Members },
              team1ParticipantScores: [{ participantId: 11, score: 75 }, { participantId: 12, score: 76 }],
              team2ParticipantScores: [{ participantId: 21, score: 74 }, { participantId: 22, score: 73 }],
              team3ParticipantScores: [{ participantId: 31, score: 72 }, { participantId: 32, score: 71 }],
              team4ParticipantScores: [{ participantId: 41, score: 70 }, { participantId: 42, score: 69 }],
              team1Won: true,
              team2Won: true,
              team3Won: false,
              team4Won: false,
              participantScoresComplete: true,
              participantScoresRepairable: false,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={2}
        currentRoundNumber={2}
        canManageTeams
        onSubmitResults={jest.fn()}
      />,
    )

    for (const team of ["Team 1", "Team 2", "Team 3", "Team 4"]) {
      expect(screen.getByText(team)).toBeInTheDocument()
    }
    expect(screen.getByRole("button", { name: "Mark Team 1 as winner in match 41201" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Mark Team 2 as winner in match 41201" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Mark Team 3 as not winner in match 41201" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Mark Team 4 as not winner in match 41201" })).toBeDisabled()
    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("allows organizers to repair invalid completed results from a past round", async () => {
    const onSubmitResults = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 220,
              team1: { id: 15, name: "Team 15", club: { id: 15, name: "Club 15" }, members: team1Members },
              team2: { id: 23, name: "Team 23", club: { id: 23, name: "Club 23" }, members: team2Members },
              participantScoresComplete: false,
              participantScoresRepairable: true,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={3}
        canManageTeams
        onSubmitResults={onSubmitResults}
      />,
    )

    expect(screen.getByText("Needs correction")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mark Team 15 as winner in match 220" })).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Mark Team 15 as winner in match 220" }))
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 220"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 220"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 220"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 220"), { target: { value: "73" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([
        {
          matchId: 220,
          teamResults: [
            {
              teamId: 15,
              won: true,
              participantScores: [
                { participantId: 11, score: 75 },
                { participantId: 12, score: 76 },
              ],
            },
            {
              teamId: 23,
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

  it("marks a backend-declared nonrepairable partial match read-only", () => {
    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 221,
              team1: { id: 15, name: "Team 15", club: { id: 15, name: "Club 15" }, members: team1Members },
              team2: { id: 23, name: "Team 23", club: { id: 23, name: "Club 23" }, members: team2Members },
              team1Score: 151,
              team2Score: 145,
              team1Won: true,
              team2Won: false,
              team1ParticipantScores: [],
              team2ParticipantScores: [],
              participantScoresComplete: false,
              participantScoresRepairable: false,
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

    expect(screen.getByRole("cell", { name: "Needs correction (not repairable)" })).toBeInTheDocument()
    expect(screen.getByText("This completed match has nonrepairable participant scores and cannot be submitted.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mark Team 15 as winner in match 221" })).toBeDisabled()
    expect(screen.getByLabelText("Speaker points for Arman in match 221")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Submit results" })).toBeDisabled()
  })

  it("renders organizer preliminary standings, speaker details, and win count views from all round matches", () => {
    render(
      <ResultsSection
        {...baseProps}
        matches={{ content: [], totalElements: 0, totalPages: 0 }}
        matchesLoading={false}
        selectedRoundNumber={2}
        currentRoundNumber={2}
        canManageTeams
        preliminaryRoundMatches={[
          {
            round: { id: 201, name: "Round 1", roundNumber: 1, customFormat: "APF" as never },
            matches: {
              content: [
                {
                  id: 301,
                  team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
                  team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
                  team1Won: true,
                  team2Won: false,
                  team1ParticipantScores: [
                    { participantId: 11, score: 75 },
                    { participantId: 12, score: 76 },
                  ],
                  team2ParticipantScores: [
                    { participantId: 21, score: 72 },
                    { participantId: 22, score: 73 },
                  ],
                  completed: true,
                },
              ],
              totalElements: 1,
              totalPages: 1,
            } as never,
          },
          {
            round: { id: 202, name: "Round 2", roundNumber: 2, customFormat: "APF" as never },
            matches: {
              content: [
                {
                  id: 302,
                  team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
                  team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
                  team1Won: false,
                  team2Won: true,
                  team1ParticipantScores: [
                    { participantId: 11, score: 78 },
                    { participantId: 12, score: 74 },
                  ],
                  team2ParticipantScores: [
                    { participantId: 21, score: 79 },
                    { participantId: 22, score: 77 },
                  ],
                  completed: true,
                },
              ],
              totalElements: 1,
              totalPages: 1,
            } as never,
          },
        ]}
      />,
    )

    expect(screen.getByRole("button", { name: "Preliminary standings" })).toHaveAttribute("aria-pressed", "true")
    const standingsSection = screen.getByRole("heading", { name: "Preliminary standings" }).closest("section")
    expect(standingsSection).not.toBeNull()
    const standingsRow = within(standingsSection as HTMLElement).getByText("Team 1").closest("tr")
    expect(standingsRow).not.toBeNull()
    expect(within(standingsRow as HTMLElement).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "1",
      "Team 1",
      "1",
    ])

    fireEvent.click(screen.getByRole("button", { name: "Speaker details" }))
    const speakerSection = screen.getByRole("heading", { name: "Speaker details" }).closest("section")
    expect(speakerSection).not.toBeNull()
    const speakerRow = within(speakerSection as HTMLElement).getByText("Arman").closest("tr")
    expect(speakerRow).not.toBeNull()
    expect(within(speakerRow as HTMLElement).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "1",
      "Team 1",
      "Arman",
      "75",
      "78",
      "153",
      "303",
    ])

    fireEvent.click(screen.getByRole("button", { name: "Win count by round" }))
    const winCountSection = screen.getByRole("heading", { name: "Win count by round" }).closest("section")
    expect(winCountSection).not.toBeNull()
    const winCountRow = within(winCountSection as HTMLElement).getByText("Team 1").closest("tr")
    expect(winCountRow).not.toBeNull()
    expect(within(winCountRow as HTMLElement).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "1",
      "Team 1",
      "1",
      "0",
      "1",
    ])
  })

  it("hides result entry and speaker details from non-organizers", () => {
    render(
      <ResultsSection
        {...baseProps}
        matches={{ content: [], totalElements: 0, totalPages: 0 }}
        matchesLoading={false}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        preliminaryRoundMatches={[
          {
            round: { id: 201, name: "Round 1", roundNumber: 1, customFormat: "APF" as never },
            matches: {
              content: [
                {
                  id: 301,
                  team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
                  team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
                  team1Won: true,
                  team2Won: false,
                  team1ParticipantScores: [
                    { participantId: 11, score: 75 },
                    { participantId: 12, score: 76 },
                  ],
                  team2ParticipantScores: [
                    { participantId: 21, score: 72 },
                    { participantId: 22, score: 73 },
                  ],
                  completed: true,
                },
              ],
              totalElements: 1,
              totalPages: 1,
            } as never,
          },
        ]}
      />,
    )

    expect(screen.getByRole("button", { name: "Preliminary standings" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Win count by round" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Round entry" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Speaker details" })).not.toBeInTheDocument()
    expect(screen.queryByText("Спикерлік балл")).not.toBeInTheDocument()
  })

  it("uses backend team scores and participant aggregate scores when per-round speaker scores are unavailable", () => {
    const seededTeam1Members = [
      { ...team1Members[0], speakerScore: 153 },
      { ...team1Members[1], speakerScore: 150 },
    ]
    const seededTeam2Members = [
      { ...team2Members[0], speakerScore: 151 },
      { ...team2Members[1], speakerScore: 150 },
    ]

    render(
      <ResultsSection
        {...baseProps}
        teams={{
          content: [
            { id: 5301, name: "Birminem", club: { id: 5301, name: "Birminem Club" }, members: seededTeam1Members },
            { id: 5302, name: "Dorn", club: { id: 5302, name: "Dorn Club" }, members: seededTeam2Members },
          ],
          totalElements: 2,
          totalPages: 1,
        } as never}
        matches={{ content: [], totalElements: 0, totalPages: 0 }}
        matchesLoading={false}
        selectedRoundNumber={2}
        currentRoundNumber={2}
        canManageTeams
        preliminaryRoundMatches={[
          {
            round: { id: 5311, name: "Round 1", roundNumber: 1, customFormat: "APF" as never },
            matches: {
              content: [
                {
                  id: 53101,
                  team1: { id: 5301, name: "Birminem", club: { id: 5301, name: "Birminem Club" } },
                  team2: { id: 5302, name: "Dorn", club: { id: 5302, name: "Dorn Club" } },
                  team1Score: 151,
                  team2Score: 145,
                  team1Won: true,
                  team2Won: false,
                  completed: true,
                },
              ],
              totalElements: 1,
              totalPages: 1,
            } as never,
          },
          {
            round: { id: 5312, name: "Round 2", roundNumber: 2, customFormat: "APF" as never },
            matches: {
              content: [
                {
                  id: 53103,
                  team1: { id: 5301, name: "Birminem", club: { id: 5301, name: "Birminem Club" } },
                  team2: { id: 5302, name: "Dorn", club: { id: 5302, name: "Dorn Club" } },
                  team1Score: 152,
                  team2Score: 156,
                  team1Won: false,
                  team2Won: true,
                  completed: true,
                },
              ],
              totalElements: 1,
              totalPages: 1,
            } as never,
          },
        ]}
      />,
    )

    const standingsSection = screen.getByRole("heading", { name: "Preliminary standings" }).closest("section")
    expect(standingsSection).not.toBeNull()
    const standingsRow = within(standingsSection as HTMLElement).getByText("Birminem").closest("tr")
    expect(standingsRow).not.toBeNull()
    expect(within(standingsRow as HTMLElement).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "1",
      "Birminem",
      "1",
    ])

    fireEvent.click(screen.getByRole("button", { name: "Speaker details" }))
    const speakerSection = screen.getByRole("heading", { name: "Speaker details" }).closest("section")
    expect(speakerSection).not.toBeNull()
    const speakerRow = within(speakerSection as HTMLElement).getByText("Arman").closest("tr")
    expect(speakerRow).not.toBeNull()
    expect(within(speakerRow as HTMLElement).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "1",
      "Birminem",
      "Arman",
      "—",
      "—",
      "153",
      "303",
    ])
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

  it("keeps a repairable completed match editable and submits scores matching aggregates", async () => {
    const onSubmitResults = jest.fn(async () => true)

    render(
      <ResultsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 220,
              team1: { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" }, members: team1Members },
              team2: { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" }, members: team2Members },
              team1Score: 151,
              team2Score: 145,
              team1Won: true,
              team2Won: false,
              team1ParticipantScores: [],
              team2ParticipantScores: [],
              participantScoresComplete: false,
              participantScoresRepairable: true,
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
        onSubmitResults={onSubmitResults}
      />,
    )

    expect(screen.getByLabelText("Speaker points for Arman in match 220")).toBeEnabled()
    expect(screen.getByRole("cell", { name: "Needs correction" })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Speaker points for Arman in match 220"), { target: { value: "75" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Aisha in match 220"), { target: { value: "76" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Boris in match 220"), { target: { value: "72" } })
    fireEvent.change(screen.getByLabelText("Speaker points for Dana in match 220"), { target: { value: "73" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit results" }))

    await waitFor(() => {
      expect(onSubmitResults).toHaveBeenCalledWith([
        {
          matchId: 220,
          teamResults: [
            { teamId: 1, won: true, participantScores: [{ participantId: 11, score: 75 }, { participantId: 12, score: 76 }] },
            { teamId: 2, won: false, participantScores: [{ participantId: 21, score: 72 }, { participantId: 22, score: 73 }] },
          ],
        },
      ])
    })
  })

  it("displays decimal-suffixed round chips without the .0 while preserving the raw name as the selection value", () => {
    const onSelectedRoundChange = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        matches={{ content: [], totalElements: 0, totalPages: 0 }}
        matchesLoading={false}
        selectedRound="1/16.0"
        canManageTeams
        rounds={[
          { id: 801, name: "1/16.0", roundNumber: 1, customFormat: "APF" as never },
          { id: 802, name: "1/8.0", roundNumber: 2, customFormat: "APF" as never },
        ]}
        onSelectedRoundChange={onSelectedRoundChange}
      />,
    )

    const roundSelector = screen.getByLabelText("Select results round")
    const activeChip = within(roundSelector).getByRole("button", { name: "1/16" })
    expect(activeChip).toHaveClass("bg-[#0D1321]")
    expect(within(roundSelector).queryByRole("button", { name: "1/16.0" })).not.toBeInTheDocument()

    fireEvent.click(within(roundSelector).getByRole("button", { name: "1/8" }))
    expect(onSelectedRoundChange).toHaveBeenCalledWith("1/8.0")

    expect(screen.getByRole("heading", { name: new RegExp(`^${displayRoundLabel("1/16.0")} results`) })).toBeInTheDocument()
  })

  it("switches between backend-provided rounds from the results screen", () => {
    const onSelectedRoundChange = jest.fn()

    render(
      <ResultsSection
        {...baseProps}
        matches={{ content: [], totalElements: 0, totalPages: 0 }}
        matchesLoading={false}
        selectedRound="Round 1"
        canManageTeams
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
      "301:team2": { result: "lost" },
      "301:team2:participant:21": { score: "72" },
      "301:team2:participant:22": { score: "73" },
    }))

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
