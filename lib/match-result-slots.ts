import type { MatchResponse } from "@/types/tournament/match"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import type { SimpleTournamentParticipantResponse } from "@/types/tournament/tournament-participant"

export type TeamSlotName = "team1" | "team2" | "team3" | "team4"

export const participantScoreSlot = (teamSlot: TeamSlotName, participantId: number) =>
  `${teamSlot}:participant:${participantId}`

export const getParticipantName = (participant: SimpleTournamentParticipantResponse, fallback: string) => {
  const fullName = `${participant.user?.firstName ?? ""} ${participant.user?.lastName ?? ""}`.trim()
  return fullName || participant.user?.username || fallback
}

export const getTeamMembers = (
  team: SimpleTeamResponse,
  teamsById: Map<number, SimpleTeamResponse>,
): SimpleTournamentParticipantResponse[] => {
  if (Array.isArray(team.members)) return team.members

  const detailedTeam = teamsById.get(team.id)
  return Array.isArray(detailedTeam?.members) ? detailedTeam.members : []
}

const getNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const getParticipantIdFromRecord = (record: Record<string, unknown>) => {
  const direct = getNumber(record.participantId) ?? getNumber(record.tournamentParticipantId) ?? getNumber(record.id)
  if (typeof direct === "number") return direct

  const participant = record.participant
  if (participant && typeof participant === "object") {
    return getNumber((participant as Record<string, unknown>).id)
  }

  return null
}

const getScoreFromRecord = (record: Record<string, unknown>) => {
  return getNumber(record.score) ?? getNumber(record.speakerScore) ?? getNumber(record.points)
}

const findParticipantScore = (value: unknown, participantId: number) => {
  if (!Array.isArray(value)) return null

  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const record = item as Record<string, unknown>
    if (getParticipantIdFromRecord(record) !== participantId) continue
    const score = getScoreFromRecord(record)
    if (typeof score === "number") return score
  }

  return null
}

export const resolveParticipantCurrentScore = (
  match: MatchResponse,
  teamSlot: TeamSlotName,
  teamId: number,
  participantId: number,
  participantIndex: number,
) => {
  const record = match as MatchResponse & Record<string, unknown>
  const scoreCollections = [
    record[`${teamSlot}ParticipantScores`],
    record[`${teamSlot}SpeakerScores`],
    record[`${teamSlot}Scores`],
    record.participantScores,
    record.speakerScores,
  ]

  const teamResults = Array.isArray(record.teamResults) ? record.teamResults : []
  const teamResult = teamResults.find((item) => {
    if (!item || typeof item !== "object") return false
    return getNumber((item as Record<string, unknown>).teamId) === teamId
  }) as Record<string, unknown> | undefined

  if (teamResult) {
    scoreCollections.push(teamResult.participantScores)
  }

  for (const collection of scoreCollections) {
    const score = findParticipantScore(collection, participantId)
    if (typeof score === "number") return score
  }

  const index = participantIndex + 1
  const keyedScore =
    getNumber(record[`${teamSlot}Speaker${index}Score`]) ??
    getNumber(record[`${teamSlot}Participant${index}Score`])

  return typeof keyedScore === "number" ? keyedScore : null
}
