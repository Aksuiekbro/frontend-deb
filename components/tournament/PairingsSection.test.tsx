/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { PairingsSection } from "./PairingsSection"
import { RESULT_DRAFTS_CHANGED_EVENT } from "@/lib/tournament-result-drafts"
import { displayRoundLabel } from "@/lib/round-label"
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
  matches: { content: [], totalElements: 0, totalPages: 0 },
  matchesLoading: false,
  matchesError: undefined,
  selectedStage: "preliminary" as const,
  selectedRound: "Round 1",
  onSelectStage: jest.fn(),
  onSelectRound: jest.fn(),
}

describe("PairingsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
  })

  it("keeps backend-backed pairing actions disabled until handlers are wired", () => {
    render(<PairingsSection {...baseProps} />)

    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Randomize" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Publish pairings" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Clear matches" })).toBeDisabled()
  })

  it("calls backend-backed pairing handlers when organizer actions are wired", async () => {
    const onProceedToNextRound = jest.fn()
    const onRandomizePairings = jest.fn()
    const onSubmitPairings = jest.fn()
    const onClearMatches = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              team1Score: 75,
              team2Score: 72,
              team1Won: true,
              team2Won: false,
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1" },
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
        onRandomizePairings={onRandomizePairings}
        onSubmitPairings={onSubmitPairings}
        onClearMatches={onClearMatches}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Proceed to next round" }))
    fireEvent.click(screen.getByRole("button", { name: "Randomize" }))
    fireEvent.click(screen.getByRole("button", { name: "Publish pairings" }))

    expect(onProceedToNextRound).toHaveBeenCalledTimes(1)
    expect(onRandomizePairings).toHaveBeenCalledTimes(1)
    expect(onSubmitPairings).toHaveBeenCalledTimes(1)

    expect(screen.queryByRole("button", { name: "Change format" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Clear matches" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    await waitFor(() => {
    expect(onClearMatches).toHaveBeenCalledWith("preliminary")
    })
  })

  it("explains future rounds instead of showing a vague empty table", () => {
    const onProceedToNextRound = jest.fn()
    const onRandomizePairings = jest.fn()
    const onSubmitPairings = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        selectedRound="Round 2"
        selectedRoundNumber={2}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
        onRandomizePairings={onRandomizePairings}
        onSubmitPairings={onSubmitPairings}
      />,
    )

    expect(screen.getByText("Round 2 is locked until Round 1 is completed and advanced.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Randomize" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Publish pairings" })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Proceed to next round" }))
    expect(onProceedToNextRound).not.toHaveBeenCalled()
  })

  it("blocks advancing the current round until every match has results", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1" },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("Enter results for all matches before proceeding. Completed 0 of 1 matches.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeDisabled()
  })

  it("allows advancing when submitted scores and team results are present even if the completed flag is stale", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              team1Score: 75,
              team2Score: 72,
              team1Won: true,
              team2Won: false,
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("All matches in this round are completed. You can proceed to the next round.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
  })

  it("allows advancing from completed team scores when participant-level scores are omitted", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 302,
              team1: { id: 1, name: "Team 1", members: team1Members },
              team2: { id: 2, name: "Team 2", members: team2Members },
              team1Score: 141,
              team2Score: 145,
              team1Won: true,
              team2Won: false,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        teams={{ content: [], totalElements: 0, totalPages: 0 }}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("All matches in this round are completed. You can proceed to the next round.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
  })

  it("allows team elimination to advance from Win/Lose outcomes without speaker points", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        selectedStage="team"
        stageFormats={{ team: "APF" }}
        selectedRound="1/8"
        matches={{
          content: [{
            id: 901,
            team1: { id: 1, name: "Team 1", members: team1Members },
            team2: { id: 2, name: "Team 2", members: team2Members },
            team1Won: true,
            team2Won: false,
            participantScoresComplete: false,
            completed: true,
          }],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
    expect(screen.queryByText(/Needs correction/)).not.toBeInTheDocument()
  })

  it("allows solo elimination to advance from an explicit winning participant", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        selectedStage="solo"
        selectedRound="1/8"
        matches={{
          content: [{
            id: 902,
            debater1: makeParticipant(701, "First"),
            debater2: makeParticipant(702, "Second"),
            winnerParticipantId: 702,
            completed: true,
          }],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
  })

  it("treats redacted completed elimination outcomes as complete for read-only users", () => {
    render(
      <PairingsSection
        {...baseProps}
        selectedStage="team"
        stageFormats={{ team: "APF" }}
        selectedRound="Final"
        matches={{
          content: [{
            id: 903,
            team1: { id: 1, name: "Team 1" },
            team2: { id: 2, name: "Team 2" },
            completed: true,
          }],
          totalElements: 1,
          totalPages: 1,
        } as never}
      />,
    )

    expect(screen.getByText("All matches in this round are completed.")).toBeInTheDocument()
    expect(screen.queryByText(/Enter results/)).not.toBeInTheDocument()
  })

  it("does not advance from team scores alone without win/loss results", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              team1Score: 75,
              team2Score: 72,
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("Enter results for all matches before proceeding. Completed 0 of 1 matches.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeDisabled()
  })

  it("advances from a backend-completed match when invalid win/loss flags can be inferred from scores", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              team1Score: 43,
              team2Score: 48,
              team1Won: false,
              team2Won: false,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("All matches in this round are completed. You can proceed to the next round.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
  })

  it("allows advancing from persisted submitted results when the refreshed match list omits scores", async () => {
    const onProceedToNextRound = jest.fn()
    const resultStorageKey = "tournament:53:round-group:101:round:201:match-results"
    window.localStorage.setItem(resultStorageKey, JSON.stringify({
      "301:team1": { score: "75", result: "won" },
      "301:team2": { score: "72", result: "lost" },
    }))

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
        resultStorageKey={resultStorageKey}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
    })
  })

  it("allows advancing from persisted participant scores when refreshed team scores are stale", async () => {
    const onProceedToNextRound = jest.fn()
    const resultStorageKey = "tournament:53:round-group:101:round:201:match-results"
    window.localStorage.setItem(resultStorageKey, JSON.stringify({
      "301:team1": { result: "won" },
      "301:team1:participant:11": { score: "75" },
      "301:team1:participant:12": { score: "76" },
      "301:team2": { result: "lost" },
      "301:team2:participant:21": { score: "72" },
      "301:team2:participant:22": { score: "73" },
    }))

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", members: team1Members },
              team2: { id: 2, name: "Team 2", members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
        resultStorageKey={resultStorageKey}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
    })
  })

  it("refreshes submitted result drafts saved in the same browser tab", async () => {
    const onProceedToNextRound = jest.fn()
    const resultStorageKey = "tournament:53:round-group:101:round:201:match-results"

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1", members: team1Members },
              team2: { id: 2, name: "Team 2", members: team2Members },
              completed: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
        resultStorageKey={resultStorageKey}
      />,
    )

    expect(screen.getByText("Enter results for all matches before proceeding. Completed 0 of 1 matches.")).toBeInTheDocument()

    act(() => {
      window.localStorage.setItem(resultStorageKey, JSON.stringify({
        "301:team1": { result: "won" },
        "301:team1:participant:11": { score: "75" },
        "301:team1:participant:12": { score: "76" },
        "301:team2": { result: "lost" },
        "301:team2:participant:21": { score: "72" },
        "301:team2:participant:22": { score: "73" },
      }))
      window.dispatchEvent(new CustomEvent(RESULT_DRAFTS_CHANGED_EVENT, { detail: { storageKey: resultStorageKey } }))
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
    })
  })

  it("allows advancing when all current-round matches are completed", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              team1Score: 75,
              team2Score: 72,
              team1Won: true,
              team2Won: false,
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1" },
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Proceed to next round" }))
    expect(onProceedToNextRound).toHaveBeenCalledTimes(1)
  })

  it("does not advance a completed team match with no winner", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 310,
              team1: { id: 31, name: "Team 31" },
              team2: { id: 6, name: "Team 6" },
              team1Score: 43,
              team2Score: 48,
              team1Won: false,
              team2Won: false,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={3}
        currentRoundNumber={3}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("Enter results for all matches before proceeding. Completed 0 of 1 matches.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeDisabled()
  })

  it("blocks advancing BPF matches unless exactly two of four teams win", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        stageFormats={{ preliminary: "BPF" }}
        matches={{
          content: [
            {
              id: 410,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              team3: { id: 3, name: "Team 3" },
              team4: { id: 4, name: "Team 4" },
              team1Score: 75,
              team2Score: 74,
              team3Score: 73,
              team4Score: 72,
              team1Won: true,
              team2Won: false,
              team3Won: false,
              team4Won: false,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("Enter results for all matches before proceeding. Completed 0 of 1 matches.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeDisabled()
  })

  it("allows advancing BPF matches with two winners and two losses", () => {
    const onProceedToNextRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        stageFormats={{ preliminary: "BPF" }}
        matches={{
          content: [
            {
              id: 411,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              team3: { id: 3, name: "Team 3" },
              team4: { id: 4, name: "Team 4" },
              team1Score: 75,
              team2Score: 74,
              team3Score: 73,
              team4Score: 72,
              team1Won: true,
              team2Won: true,
              team3Won: false,
              team4Won: false,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={1}
        currentRoundNumber={1}
        onProceedToNextRound={onProceedToNextRound}
      />,
    )

    expect(screen.getByText("All matches in this round are completed. You can proceed to the next round.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Proceed to next round" })).toBeEnabled()
  })

  it("renders all four BPF entrants and each persisted winner state in the generated Final", () => {
    render(
      <PairingsSection
        {...baseProps}
        selectedStage="team"
        selectedRound="Final"
        stageFormats={{ team: "BPF" }}
        rounds={[{ id: 501, name: "Final", roundNumber: 2, customFormat: "BPF" as never }]}
        matches={{
          content: [
            {
              id: 50101,
              team1: { id: 1, name: "BPF Team 1" },
              team2: { id: 2, name: "BPF Team 2" },
              team3: { id: 3, name: "BPF Team 3" },
              team4: { id: 4, name: "BPF Team 4" },
              team1Won: true,
              team2Won: false,
              team3Won: true,
              team4Won: false,
              completed: true,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        selectedRoundNumber={2}
        currentRoundNumber={2}
      />,
    )

    expect(screen.getByRole("columnheader", { name: "Fraction 4" })).toBeInTheDocument()
    expect(screen.getByText("BPF Team 1")).toBeInTheDocument()
    expect(screen.getByText("BPF Team 2")).toBeInTheDocument()
    expect(screen.getByText("BPF Team 3")).toBeInTheDocument()
    expect(screen.getByText("BPF Team 4")).toBeInTheDocument()
    expect(screen.getAllByText("Winner")).toHaveLength(2)
    expect(screen.getAllByText("Loss")).toHaveLength(2)
  })

  it("keeps the selected stage and round synchronized", () => {
    const onSelectStage = jest.fn()
    const onSelectRound = jest.fn()
    const { rerender } = render(
      <PairingsSection
        {...baseProps}
        selectedStage="preliminary"
        selectedRound="Round 1"
        onSelectStage={onSelectStage}
        onSelectRound={onSelectRound}
      />,
    )

    const preliminaryButton = screen.getByRole("button", { name: "Preliminary (APF)" })
    const teamButton = screen.getByRole("button", { name: "Team elimination (BPF)" })
    expect(preliminaryButton).toHaveAttribute("aria-pressed", "true")
    expect(teamButton).toHaveAttribute("aria-pressed", "false")

    fireEvent.click(teamButton)
    expect(onSelectStage).toHaveBeenCalledWith("team")
    expect(onSelectRound).toHaveBeenCalledWith("1/16")

    rerender(
      <PairingsSection
        {...baseProps}
        selectedStage="team"
        selectedRound="1/16"
        onSelectStage={onSelectStage}
        onSelectRound={onSelectRound}
      />,
    )
    expect(screen.getByRole("button", { name: "Preliminary (APF)" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Team elimination (BPF)" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /^1\/16$/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /^Round 1$/ })).toHaveAttribute("aria-pressed", "false")

    fireEvent.click(screen.getByRole("button", { name: "Round 1" }))
    expect(onSelectStage).toHaveBeenCalledWith("preliminary")
    expect(onSelectRound).toHaveBeenCalledWith("Round 1")

    rerender(
      <PairingsSection
        {...baseProps}
        selectedStage="preliminary"
        selectedRound="Round 1"
        onSelectStage={onSelectStage}
        onSelectRound={onSelectRound}
      />,
    )
    expect(screen.getByRole("button", { name: "Preliminary (APF)" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Team elimination (BPF)" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: /^Round 1$/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /^1\/16$/ })).toHaveAttribute("aria-pressed", "false")
  })

  it("renders only the stages supplied by the round groups", () => {
    render(
      <PairingsSection
        {...baseProps}
        availableStages={[
          { id: "preliminary", label: "Preliminary", format: "APF", defaultRound: "Preliminary 1" },
          { id: "team", label: "Team elimination", format: "APF", defaultRound: "Semifinal" },
        ]}
        selectedRound="Preliminary 1"
        rounds={[{ id: 701, name: "Preliminary 1", roundNumber: 1 } as never]}
      />,
    )

    expect(screen.getByRole("button", { name: "Preliminary (APF)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Team elimination (APF)" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Solo elimination (LD)" })).not.toBeInTheDocument()
  })

  it("uses exact mixed-stage labels and backend rounds for stage selection", () => {
    const onSelectStage = jest.fn()
    const onSelectRound = jest.fn()
    const availableStages = [
      { id: "preliminary" as const, label: "Preliminary", format: "APF" as const, defaultRound: "Preliminary 1" },
      { id: "team" as const, label: "Team elimination", format: "BPF" as const, defaultRound: "Semifinal" },
      { id: "solo" as const, label: "Solo elimination", format: "LD" as const, defaultRound: "Final" },
    ]
    const { rerender } = render(
      <PairingsSection
        {...baseProps}
        availableStages={availableStages}
        selectedRound="Preliminary 1"
        rounds={[
          { id: 701, name: "Preliminary 1", roundNumber: 1 },
          { id: 702, name: "Semifinal", roundNumber: 1 },
          { id: 703, name: "Final", roundNumber: 2 },
        ] as never}
        onSelectStage={onSelectStage}
        onSelectRound={onSelectRound}
      />,
    )

    expect(screen.getByRole("button", { name: "Preliminary (APF)" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Team elimination (BPF)" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Solo elimination (LD)" })).toHaveAttribute("aria-pressed", "false")

    fireEvent.click(screen.getByRole("button", { name: "Team elimination (BPF)" }))
    expect(onSelectStage).toHaveBeenCalledWith("team")
    expect(onSelectRound).toHaveBeenCalledWith("Semifinal")

    rerender(
      <PairingsSection
        {...baseProps}
        availableStages={availableStages}
        selectedStage="team"
        selectedRound="Semifinal"
        rounds={[
          { id: 701, name: "Preliminary 1", roundNumber: 1 },
          { id: 702, name: "Semifinal", roundNumber: 1 },
          { id: 703, name: "Final", roundNumber: 2 },
        ] as never}
        onSelectStage={onSelectStage}
        onSelectRound={onSelectRound}
      />,
    )

    expect(screen.getByRole("button", { name: "Preliminary (APF)" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Team elimination (BPF)" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Solo elimination (LD)" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Semifinal" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Preliminary 1" })).toHaveAttribute("aria-pressed", "false")
  })

  it.each(["Preliminary 1", "Preliminary 1.0"])(
    "keeps backend preliminary round %s on the preliminary stage",
    (roundLabel) => {
      const onSelectStage = jest.fn()
      const onSelectRound = jest.fn()

      render(
        <PairingsSection
          {...baseProps}
          rounds={[{ id: 701, name: roundLabel, roundNumber: 1 } as never]}
          selectedRound={roundLabel}
          onSelectStage={onSelectStage}
          onSelectRound={onSelectRound}
        />,
      )

      fireEvent.click(screen.getByRole("button", { name: displayRoundLabel(roundLabel) }))

      expect(onSelectRound).toHaveBeenCalledWith(roundLabel)
      expect(onSelectStage).toHaveBeenCalledWith("preliminary")
      expect(onSelectStage).not.toHaveBeenCalledWith("team")
    },
  )

  it("displays decimal-suffixed round chips without the .0 while preserving the raw name as the selection value", () => {
    const onSelectRound = jest.fn()

    render(
      <PairingsSection
        {...baseProps}
        selectedStage="team"
        selectedRound="1/16.0"
        rounds={[{ id: 801, name: "1/16.0", roundNumber: 1 } as never]}
        onSelectRound={onSelectRound}
      />,
    )

    const chip = screen.getByRole("button", { name: "1/16" })
    expect(chip).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("button", { name: "1/16.0" })).not.toBeInTheDocument()

    fireEvent.click(chip)
    expect(onSelectRound).toHaveBeenCalledWith("1/16.0")
  })

  it("exposes client hydration on the Pairings section", async () => {
    render(<PairingsSection {...baseProps} />)
    const pairingsSection = document.querySelector("[data-pairings-hydrated]")

    await waitFor(() => {
      expect(pairingsSection).toBeInTheDocument()
      expect(pairingsSection).toHaveAttribute("data-pairings-hydrated", "true")
    })
  })

  it("lets organizers edit and bulk save rooms", async () => {
    const onSaveAllRooms = jest.fn().mockResolvedValue(true)

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              location: "-",
              judge: { id: 7, fullName: "Judge 1" },
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        onSaveAllRooms={onSaveAllRooms}
      />,
    )

    fireEvent.change(screen.getByLabelText("Room for match 301"), {
      target: { value: "Room B-12" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save all rooms (1)" }))

    await waitFor(() => {
      expect(onSaveAllRooms).toHaveBeenCalledWith([{ matchId: 301, location: "Room B-12" }])
    })
  })

  it("resets room drafts from fresh backend match data after refetch", () => {
    const onSaveAllRooms = jest.fn().mockResolvedValue(true)
    const { rerender } = render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1" },
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        onSaveAllRooms={onSaveAllRooms}
      />,
    )

    expect(screen.getByLabelText("Room for match 301")).toHaveValue("Room A")

    rerender(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              location: "Room B",
              judge: { id: 7, fullName: "Judge 1" },
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        onSaveAllRooms={onSaveAllRooms}
      />,
    )

    expect(screen.getByLabelText("Room for match 301")).toHaveValue("Room B")
  })

  it("keeps unsaved room drafts when a refetch replaces match data", () => {
    const onSaveAllRooms = jest.fn().mockResolvedValue(true)
    const buildMatches = (locations: Record<number, string | null>) => ({
      content: [301, 302].map((id) => ({
        id,
        team1: { id: 1, name: "Team 1" },
        team2: { id: 2, name: "Team 2" },
        location: locations[id] ?? null,
        judge: { id: 7, fullName: "Judge 1" },
      })),
      totalElements: 2,
      totalPages: 1,
    }) as never

    const { rerender } = render(
      <PairingsSection
        {...baseProps}
        matches={buildMatches({ 301: null, 302: null })}
        onSaveAllRooms={onSaveAllRooms}
      />,
    )

    fireEvent.change(screen.getByLabelText("Room for match 301"), { target: { value: "12" } })

    // A refetch that updates another match must preserve the unsaved draft for 301.
    rerender(
      <PairingsSection
        {...baseProps}
        matches={buildMatches({ 301: null, 302: "34" })}
        onSaveAllRooms={onSaveAllRooms}
      />,
    )

    expect(screen.getByLabelText("Room for match 301")).toHaveValue("12")
    expect(screen.getByLabelText("Room for match 302")).toHaveValue("34")
  })

  it("lets organizers manually edit teams room and judge for a randomized match", async () => {
    const onUpdateMatch = jest.fn().mockResolvedValue(undefined)

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1" },
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        teams={{
          content: [
            { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" } },
            { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" } },
          ],
          totalElements: 2,
          totalPages: 1,
        }}
        judges={{
          content: [
            { id: 7, fullName: "Judge 1", checkedIn: true },
            { id: 8, fullName: "Judge 2", checkedIn: true },
          ],
          totalElements: 2,
          totalPages: 1,
        } as never}
        onUpdateMatch={onUpdateMatch}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Edit match 301" }))
    fireEvent.change(screen.getByLabelText("Team 1"), { target: { value: "2" } })
    fireEvent.change(screen.getByLabelText("Team 2"), { target: { value: "1" } })
    fireEvent.change(screen.getByLabelText("Match room"), { target: { value: "Room C-15" } })
    fireEvent.change(screen.getByLabelText("Judge"), { target: { value: "8" } })
    fireEvent.click(screen.getByRole("button", { name: "Save match" }))

    await waitFor(() => {
      expect(onUpdateMatch).toHaveBeenCalledWith(301, {
        location: "Room C-15",
        judgeId: 8,
        team1Id: 2,
        team2Id: 1,
      })
    })
  })

  it("saves a cleared room as null from the match editor", async () => {
    const onUpdateMatch = jest.fn().mockResolvedValue(undefined)

    render(
      <PairingsSection
        {...baseProps}
        matches={{
          content: [
            {
              id: 301,
              team1: { id: 1, name: "Team 1" },
              team2: { id: 2, name: "Team 2" },
              location: "Room A",
              judge: { id: 7, fullName: "Judge 1" },
            },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        teams={{
          content: [
            { id: 1, name: "Team 1", club: { id: 1, name: "Club 1" } },
            { id: 2, name: "Team 2", club: { id: 2, name: "Club 2" } },
          ],
          totalElements: 2,
          totalPages: 1,
        }}
        judges={{
          content: [
            { id: 7, fullName: "Judge 1", checkedIn: true },
          ],
          totalElements: 1,
          totalPages: 1,
        } as never}
        onUpdateMatch={onUpdateMatch}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Edit match 301" }))
    fireEvent.change(screen.getByLabelText("Match room"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Save match" }))

    await waitFor(() => {
      expect(onUpdateMatch).toHaveBeenCalledWith(301, {
        location: null,
        judgeId: 7,
        team1Id: 1,
        team2Id: 2,
      })
    })
  })
})
