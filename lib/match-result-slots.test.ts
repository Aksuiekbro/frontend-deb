import { resolveDebaterCurrentWon, resolveParticipantCurrentScore } from "./match-result-slots"

describe("resolveParticipantCurrentScore", () => {
  it("reads participant scores from the typed team response fields", () => {
    const score = resolveParticipantCurrentScore(
      {
        id: 551,
        team1: { id: 10, name: "Team 1", club: { id: 1, name: "Club" }, members: [] },
        team1ParticipantScores: [{ participantId: 901, score: 74 }],
        participantScoresComplete: true,
        participantScoresRepairable: false,
        completed: true,
      },
      "team1",
      10,
      901,
      0,
    )

    expect(score).toBe(74)
  })

  it("leaves a repairable missing score absent instead of using the aggregate team total", () => {
    const score = resolveParticipantCurrentScore(
      {
        id: 220,
        team1: { id: 10, name: "Team 1", club: { id: 1, name: "Club" }, members: [] },
        team1Score: 145,
        team1ParticipantScores: [],
        participantScoresComplete: false,
        participantScoresRepairable: true,
        completed: true,
      },
      "team1",
      10,
      901,
      0,
    )

    expect(score).toBeNull()
  })
})

describe("resolveDebaterCurrentWon", () => {
  const debater1 = { id: 701 }
  const debater2 = { id: 702 }

  it("uses the explicit winner participant from the elimination contract", () => {
    const match = {
      id: 303,
      debater1,
      debater2,
      winnerParticipantId: 702,
      completed: true,
    } as never

    expect(resolveDebaterCurrentWon(match, "debater1", 701)).toBe(false)
    expect(resolveDebaterCurrentWon(match, "debater2", 702)).toBe(true)
  })

  it("falls back to historical distinct LD scores for old completed matches", () => {
    const match = {
      id: 304,
      debater1,
      debater2,
      debater1Score: 71,
      debater2Score: 69,
      completed: true,
    } as never

    expect(resolveDebaterCurrentWon(match, "debater1", 701)).toBe(true)
    expect(resolveDebaterCurrentWon(match, "debater2", 702)).toBe(false)
  })

  it("does not turn an unrelated winner participant into two losses", () => {
    const match = {
      id: 305,
      debater1,
      debater2,
      winnerParticipantId: 999,
      completed: true,
    } as never

    expect(resolveDebaterCurrentWon(match, "debater1", 701)).toBeNull()
    expect(resolveDebaterCurrentWon(match, "debater2", 702)).toBeNull()
  })
})
