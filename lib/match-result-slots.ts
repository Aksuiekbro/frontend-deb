import type { MatchResponse } from "@/types/tournament/match"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import type { SimpleTournamentParticipantResponse } from "@/types/tournament/tournament-participant"

export type TeamSlotName = "team1" | "team2" | "team3" | "team4"
export type DebaterSlotName = "debater1" | "debater2"

export const participantScoreSlot = (teamSlot: TeamSlotName, participantId: number) =>
  `${teamSlot}:participant:${participantId}`

const TEAM_SLOT_NAMES: TeamSlotName[] = ["team1", "team2", "team3", "team4"]

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

const WIN_RESULT_VALUES = new Set(["WIN", "WON", "VICTORY", "TRUE", "YES"])
const LOSS_RESULT_VALUES = new Set(["LOSS", "LOST", "DEFEAT", "FALSE", "NO"])

const normalizeResultString = (value: unknown) => {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  if (WIN_RESULT_VALUES.has(normalized)) return true
  if (LOSS_RESULT_VALUES.has(normalized)) return false
  return null
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

const getWonFromRecord = (record: Record<string, unknown>) => {
  const booleanValue =
    record.won ??
    record.win ??
    record.victory ??
    record.winner ??
    record.isWinner

  if (typeof booleanValue === "boolean") return booleanValue

  return (
    normalizeResultString(record.result) ??
    normalizeResultString(record.outcome) ??
    normalizeResultString(record.status)
  )
}

const getTeamSlotWonFromRecord = (record: Record<string, unknown>, teamSlot: TeamSlotName) => {
  const booleanKeys = [`${teamSlot}Won`, `${teamSlot}Win`, `${teamSlot}Victory`, `${teamSlot}Winner`, `${teamSlot}IsWinner`]

  for (const key of booleanKeys) {
    if (typeof record[key] === "boolean") return record[key] as boolean
  }

  const resultKeys = [`${teamSlot}Result`, `${teamSlot}Outcome`, `${teamSlot}Status`]
  for (const key of resultKeys) {
    const normalized = normalizeResultString(record[key])
    if (typeof normalized === "boolean") return normalized
  }

  return null
}

const getTeamIdForSlot = (record: Record<string, unknown>, teamSlot: TeamSlotName) => {
  const team = record[teamSlot]
  if (!team || typeof team !== "object") return null
  return getNumber((team as Record<string, unknown>).id)
}

const getTeamScoreForSlot = (record: Record<string, unknown>, teamSlot: TeamSlotName) =>
  getNumber(record[`${teamSlot}Score`])

const getRequiredWinnerCount = (teamCount: number) => {
  if (teamCount >= 4) return 2
  if (teamCount === 2) return 1
  return null
}

const hasValidExplicitTeamResults = (results: (boolean | null)[], requiredWinnerCount: number | null) => {
  if (requiredWinnerCount === null) return false
  return results.every((result): result is boolean => typeof result === "boolean") &&
    results.filter(Boolean).length === requiredWinnerCount
}

const inferCompletedTeamWonFromScores = (
  record: Record<string, unknown>,
  teamSlot: TeamSlotName,
  teamId: number,
) => {
  if (record.completed !== true) return null

  const teamSlots = TEAM_SLOT_NAMES
    .map((slot) => ({
      slot,
      teamId: getTeamIdForSlot(record, slot),
      score: getTeamScoreForSlot(record, slot),
    }))
    .filter((slot): slot is { slot: TeamSlotName; teamId: number; score: number } =>
      typeof slot.teamId === "number"
    )
  const requiredWinnerCount = getRequiredWinnerCount(teamSlots.length)
  if (requiredWinnerCount === null || teamSlots.some((slot) => typeof slot.score !== "number")) return null

  const rankedSlots = [...teamSlots].sort((a, b) => b.score - a.score)
  const cutoffScore = rankedSlots[requiredWinnerCount - 1]?.score
  const nextScore = rankedSlots[requiredWinnerCount]?.score
  if (cutoffScore === undefined || cutoffScore === nextScore) return null

  const winningTeamIds = new Set(
    rankedSlots.slice(0, requiredWinnerCount).map((slot) => slot.teamId)
  )
  return winningTeamIds.has(teamId)
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

export const resolveTeamCurrentWon = (match: MatchResponse, teamSlot: TeamSlotName, teamId: number) => {
  const record = match as MatchResponse & Record<string, unknown>
  const presentTeamSlots = TEAM_SLOT_NAMES.filter((slot) => typeof getTeamIdForSlot(record, slot) === "number")
  const explicitResults = presentTeamSlots.map((slot) => getTeamSlotWonFromRecord(record, slot))
  const requiredWinnerCount = getRequiredWinnerCount(presentTeamSlots.length)
  const explicitWon = getTeamSlotWonFromRecord(record, teamSlot)

  if (hasValidExplicitTeamResults(explicitResults, requiredWinnerCount)) {
    return explicitWon
  }

  if (typeof record.winnerTeamId === "number") return record.winnerTeamId === teamId

  const winningTeamIds = Array.isArray(record.winningTeamIds)
    ? record.winningTeamIds
    : Array.isArray(record.winnerTeamIds)
      ? record.winnerTeamIds
      : null

  if (winningTeamIds) {
    return winningTeamIds.includes(teamId)
  }

  const teamResults = Array.isArray(record.teamResults) ? record.teamResults : []
  const teamResult = teamResults.find((item) => {
    if (!item || typeof item !== "object") return false
    return getNumber((item as Record<string, unknown>).teamId) === teamId
  }) as Record<string, unknown> | undefined

  if (teamResult) {
    const won = getWonFromRecord(teamResult)
    if (typeof won === "boolean") return won
  }

  const inferredWon = inferCompletedTeamWonFromScores(record, teamSlot, teamId)
  if (typeof inferredWon === "boolean") return inferredWon

  if (typeof explicitWon === "boolean") return explicitWon

  return null
}

export const resolveDebaterCurrentWon = (
  match: MatchResponse,
  debaterSlot: DebaterSlotName,
  participantId: number,
) => {
  const record = match as MatchResponse & Record<string, unknown>
  const winnerParticipantId =
    getNumber(record.winnerParticipantId) ??
    getNumber(record.winnerDebaterId)

  if (winnerParticipantId !== null) {
    const assignedParticipantIds = [match.debater1?.id, match.debater2?.id]
      .filter((id): id is number => typeof id === "number")
    if (assignedParticipantIds.length > 0 && !assignedParticipantIds.includes(winnerParticipantId)) {
      return null
    }
    return winnerParticipantId === participantId
  }

  const booleanKeys = [
    `${debaterSlot}Won`,
    `${debaterSlot}Win`,
    `${debaterSlot}Winner`,
    `${debaterSlot}IsWinner`,
  ]
  for (const key of booleanKeys) {
    if (typeof record[key] === "boolean") return record[key] as boolean
  }

  const participantResults = Array.isArray(record.participantResults)
    ? record.participantResults
    : Array.isArray(record.debaterResults)
      ? record.debaterResults
      : []
  const participantResult = participantResults.find((item) => {
    if (!item || typeof item !== "object") return false
    return getParticipantIdFromRecord(item as Record<string, unknown>) === participantId
  }) as Record<string, unknown> | undefined
  if (participantResult) {
    const won = getWonFromRecord(participantResult)
    if (typeof won === "boolean") return won
  }

  const currentScore = getNumber(record[`${debaterSlot}Score`])
  const opponentScore = getNumber(record[`${debaterSlot === "debater1" ? "debater2" : "debater1"}Score`])
  if (currentScore === null || opponentScore === null || currentScore === opponentScore) return null
  return currentScore > opponentScore
}
