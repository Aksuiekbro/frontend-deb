import { resolveParticipantCurrentScore } from "./match-result-slots"

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
