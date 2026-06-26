/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { PairingsSection } from "./PairingsSection"
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
    const onChangeStageFormat = jest.fn()

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
        onChangeStageFormat={onChangeStageFormat}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Proceed to next round" }))
    fireEvent.click(screen.getByRole("button", { name: "Randomize" }))
    fireEvent.click(screen.getByRole("button", { name: "Publish pairings" }))

    expect(onProceedToNextRound).toHaveBeenCalledTimes(1)
    expect(onRandomizePairings).toHaveBeenCalledTimes(1)
    expect(onSubmitPairings).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Change format" }))
    fireEvent.click(screen.getByRole("button", { name: "LD" }))
    fireEvent.click(screen.getByRole("button", { name: "Change" }))
    expect(onChangeStageFormat).toHaveBeenCalledWith("preliminary", "LD")

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

  it("allows advancing when submitted scores are present even if the completed flag is stale", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Team elimination(BPF)" }))
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
    fireEvent.click(screen.getByRole("button", { name: "Round 1" }))
    expect(onSelectStage).toHaveBeenCalledWith("preliminary")
    expect(onSelectRound).toHaveBeenCalledWith("Round 1")
  })

  it("lets organizers edit and save a room for a match", () => {
    const onUpdateMatchRoom = jest.fn()

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
        onUpdateMatchRoom={onUpdateMatchRoom}
      />,
    )

    fireEvent.change(screen.getByLabelText("Room for match 301"), {
      target: { value: "Room B-12" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save room for match 301" }))

    expect(onUpdateMatchRoom).toHaveBeenCalledWith(301, "Room B-12")
  })

  it("resets room drafts from fresh backend match data after refetch", () => {
    const onUpdateMatchRoom = jest.fn()
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
        onUpdateMatchRoom={onUpdateMatchRoom}
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
        onUpdateMatchRoom={onUpdateMatchRoom}
      />,
    )

    expect(screen.getByLabelText("Room for match 301")).toHaveValue("Room B")
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
