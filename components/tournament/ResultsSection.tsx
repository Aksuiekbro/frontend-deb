"use client"

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import type { PageResult } from "@/types/page"
import type { MatchResponse, MatchResultRequest } from "@/types/tournament/match"
import type { SimpleRoundResponse } from "@/types/tournament/round/round"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import {
  readPersistedResultDrafts,
  toResultDraftValue,
  writePersistedResultDrafts,
  type PersistedResultDrafts,
  type ResultDraftValue,
} from "@/lib/tournament-result-drafts"

interface ResultsSectionProps {
  selectedResultsOption: string
  resultsSubTab: "Speaker Score" | "Results"
  onResultsSubTabChange: (tab: "Speaker Score" | "Results") => void
  bpfSubTab: string
  activeResultsSection: string
  onActiveResultsSectionChange: (section: string) => void
  selectedRound: string
  onSelectedRoundChange: (round: string) => void
  rounds?: SimpleRoundResponse[]
  teams?: PageResult<SimpleTeamResponse>
  teamsLoading: boolean
  teamsError?: Error
  matches?: PageResult<MatchResponse>
  matchesLoading?: boolean
  matchesError?: Error
  selectedRoundNumber?: number | null
  currentRoundNumber?: number | null
  canManageTeams: boolean
  onDeleteTeam: (teamId: number, teamName: string) => void
  deletingTeamId: number | null
  onSubmitResults?: (results: MatchResultRequest[]) => Promise<boolean | void> | boolean | void
  isSubmittingResults?: boolean
  resultStorageKey?: string
}

const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2"] as const
type TeamSlotName = "team1" | "team2" | "team3" | "team4"

const WIN_RESULT_VALUES = new Set(["WIN", "WON", "VICTORY", "TRUE", "YES"])
const LOSS_RESULT_VALUES = new Set(["LOSS", "LOST", "DEFEAT", "FALSE", "NO"])

const normalizeResultString = (value: unknown) => {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  if (WIN_RESULT_VALUES.has(normalized)) return true
  if (LOSS_RESULT_VALUES.has(normalized)) return false
  return null
}

const resolveCurrentTeamWon = (match: MatchResponse, slot: TeamSlotName, teamId: number) => {
  const record = match as MatchResponse & Record<string, unknown>
  const booleanKeys = [`${slot}Won`, `${slot}Win`, `${slot}Victory`, `${slot}Winner`, `${slot}IsWinner`]

  for (const key of booleanKeys) {
    if (typeof record[key] === "boolean") return record[key] as boolean
  }

  const resultKeys = [`${slot}Result`, `${slot}Outcome`, `${slot}Status`]
  for (const key of resultKeys) {
    const normalized = normalizeResultString(record[key])
    if (typeof normalized === "boolean") return normalized
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

  return null
}

export function ResultsSection({
  selectedResultsOption,
  resultsSubTab,
  onResultsSubTabChange,
  bpfSubTab,
  activeResultsSection,
  onActiveResultsSectionChange,
  selectedRound,
  onSelectedRoundChange,
  rounds,
  teams,
  teamsLoading,
  teamsError,
  matches,
  matchesLoading,
  matchesError,
  selectedRoundNumber,
  currentRoundNumber,
  canManageTeams,
  onDeleteTeam,
  deletingTeamId,
  onSubmitResults,
  isSubmittingResults = false,
  resultStorageKey,
}: ResultsSectionProps) {
  const teamRows = teams?.content ?? []
  const matchRows = useMemo(() => matches?.content ?? [], [matches?.content])
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})
  const [resultDrafts, setResultDrafts] = useState<Record<string, ResultDraftValue>>({})
  const [locallyCompletedMatchIds, setLocallyCompletedMatchIds] = useState<Record<number, boolean>>({})
  const [scoreError, setScoreError] = useState<string | null>(null)
  const roundOptions = useMemo(() => {
    if (rounds?.length) return rounds.map((round) => round.name)
    return selectedRound ? [selectedRound] : []
  }, [rounds, selectedRound])

  const hasRoundProgress =
    typeof selectedRoundNumber === "number" &&
    typeof currentRoundNumber === "number"
  const canEditSelectedRound = !hasRoundProgress || selectedRoundNumber === currentRoundNumber

  const submitDisabled = true
  const submitButtonClass = `px-8 py-3 bg-[#3E5C76] text-white rounded-lg text-[16px] font-medium transition-colors ${
    "cursor-not-allowed opacity-50"
  }`

  type ResultSlot = {
    kind: "team" | "debater"
    slot: "team1" | "team2" | "team3" | "team4" | "debater1" | "debater2"
    entityId: number
    name: string
    currentScore?: number | null
    currentWon?: boolean | null
  }

  const getResultSlots = useCallback((match: MatchResponse): ResultSlot[] => {
    const slots: ResultSlot[] = []
    const teamSlots = [
      { slot: "team1", team: match.team1, score: match.team1Score },
      { slot: "team2", team: match.team2, score: match.team2Score },
      { slot: "team3", team: match.team3, score: match.team3Score },
      { slot: "team4", team: match.team4, score: match.team4Score },
    ] as const

    teamSlots.forEach(({ slot, team, score }) => {
      if (!team) return
      slots.push({
        kind: "team",
        slot,
        entityId: team.id,
        name: team.name,
        currentScore: score,
        currentWon: resolveCurrentTeamWon(match, slot, team.id),
      })
    })

    const debaterSlots = [
      { slot: "debater1", debater: match.debater1, score: match.debater1Score },
      { slot: "debater2", debater: match.debater2, score: match.debater2Score },
    ] as const

    debaterSlots.forEach(({ slot, debater, score }) => {
      if (!debater) return
      const profile = debater.participantProfile
      const name = profile
        ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
        : debater.user?.username
      slots.push({
        kind: "debater",
        slot,
        entityId: debater.id,
        name: name || debater.user?.username || `Debater ${debater.id}`,
        currentScore: score,
      })
    })

    return slots
  }, [])

  const scoreKey = useCallback(
    (matchId: number, slot: ResultSlot["slot"]) => `${matchId}:${slot}`,
    []
  )

  const hasCompletePersistedResult = useCallback((match: MatchResponse, drafts: PersistedResultDrafts) => {
    const slots = getResultSlots(match)
    return slots.length > 0 && slots.every((slot) => {
      const draft = drafts[scoreKey(match.id, slot.slot)]
      const hasScore = Boolean(draft?.score?.trim())
      const hasResult = slot.kind !== "team" || Boolean(draft?.result)
      return hasScore && hasResult
    })
  }, [getResultSlots, scoreKey])

  const isMatchReadOnly = useCallback((match: MatchResponse) => {
    return match.completed || Boolean(locallyCompletedMatchIds[match.id])
  }, [locallyCompletedMatchIds])

  useEffect(() => {
    const persistedDrafts = readPersistedResultDrafts(resultStorageKey)
    const nextCompletedMatches: Record<number, boolean> = {}

    setScoreDrafts(() => {
      const next: Record<string, string> = {}
      matchRows.forEach((match) => {
        getResultSlots(match).forEach((slot) => {
          const key = scoreKey(match.id, slot.slot)
          next[key] =
            typeof slot.currentScore === "number" ? String(slot.currentScore) : persistedDrafts[key]?.score ?? ""
        })
      })
      return next
    })
    setResultDrafts(() => {
      const next: Record<string, ResultDraftValue> = {}
      matchRows.forEach((match) => {
        getResultSlots(match).forEach((slot) => {
          if (slot.kind !== "team") return
          const key = scoreKey(match.id, slot.slot)
          next[key] =
            typeof slot.currentWon === "boolean"
              ? (slot.currentWon ? "won" : "lost")
              : toResultDraftValue(persistedDrafts[key]?.result)
        })
      })
      return next
    })
    matchRows.forEach((match) => {
      if (hasCompletePersistedResult(match, persistedDrafts)) {
        nextCompletedMatches[match.id] = true
      }
    })
    setLocallyCompletedMatchIds(nextCompletedMatches)
    setScoreError(null)
  }, [getResultSlots, hasCompletePersistedResult, matchRows, resultStorageKey, scoreKey])

  const editableMatches = useMemo(
    () => matchRows.filter((match) => !isMatchReadOnly(match) && getResultSlots(match).length > 0),
    [getResultSlots, isMatchReadOnly, matchRows]
  )

  const hasEditableMatches = editableMatches.length > 0
  const allEditableScoresFilled = editableMatches.every((match) =>
    getResultSlots(match).every((slot) => {
      const key = scoreKey(match.id, slot.slot)
      const hasScore = Boolean(scoreDrafts[key]?.trim())
      const hasResult = slot.kind !== "team" || Boolean(resultDrafts[key])
      return hasScore && hasResult
    })
  )
  const canSubmitMatchResults =
    Boolean(onSubmitResults) &&
    canManageTeams &&
    canEditSelectedRound &&
    hasEditableMatches &&
    allEditableScoresFilled &&
    !isSubmittingResults
  const shouldRenderMatchResults = matchesLoading || matchesError || Boolean(matches)
  const matchSubmitButtonClass = `px-8 py-3 bg-[#3E5C76] text-white rounded-lg text-[16px] font-medium transition-colors ${
    canSubmitMatchResults ? "hover:bg-[#2D3748]" : "cursor-not-allowed opacity-50"
  }`

  const renderTeamRows = (columnCount: number, renderRow: (team: SimpleTeamResponse) => ReactNode) => {
    if (teamsLoading) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69]">
            Loading teams...
          </td>
        </tr>
      )
    }

    if (teamsError) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-red-500">
            Failed to load teams
          </td>
        </tr>
      )
    }

    if (!teamRows.length) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69]">
            No teams found
          </td>
        </tr>
      )
    }

    return teamRows.map((team) => renderRow(team))
  }

  const buildResultPayload = (): MatchResultRequest[] => {
    return editableMatches.map((match) => {
      const teamResults = getResultSlots(match)
        .filter((slot) => slot.kind === "team")
        .map((slot) => ({
          teamId: slot.entityId,
          won: resultDrafts[scoreKey(match.id, slot.slot)] === "won",
          participantScores: [{
            participantId: slot.entityId,
            score: Number(scoreDrafts[scoreKey(match.id, slot.slot)]),
          }],
        }))

      const participantScores = getResultSlots(match)
        .filter((slot) => slot.kind === "debater")
        .map((slot) => ({
          participantId: slot.entityId,
          score: Number(scoreDrafts[scoreKey(match.id, slot.slot)]),
        }))

      return {
        matchId: match.id,
        ...(teamResults.length ? { teamResults } : {}),
        ...(participantScores.length ? { participantScores } : {}),
      }
    })
  }

  const handleSubmitMatchResults = async () => {
    if (!onSubmitResults || !canManageTeams) return

    if (!canEditSelectedRound) {
      setScoreError("Only the current round can be submitted.")
      return
    }

    if (!hasEditableMatches) {
      setScoreError("There are no open matches to submit.")
      return
    }

    if (!allEditableScoresFilled) {
      setScoreError("Select every team result and enter every speaker point before submitting.")
      return
    }

    const payload = buildResultPayload()
    setScoreError(null)
    const submitResult = await onSubmitResults(payload)

    if (submitResult === false) return

    const persistedDrafts = payload.reduce<PersistedResultDrafts>((acc, matchResult) => {
      const match = editableMatches.find((item) => item.id === matchResult.matchId)
      if (!match) return acc

      getResultSlots(match).forEach((slot) => {
        const key = scoreKey(match.id, slot.slot)
        acc[key] = {
          score: scoreDrafts[key] ?? "",
          result: slot.kind === "team" ? resultDrafts[key] ?? "" : "",
        }
      })

      return acc
    }, {})

    writePersistedResultDrafts(resultStorageKey, persistedDrafts)
    setScoreDrafts((current) => {
      const next = { ...current }
      Object.entries(persistedDrafts).forEach(([key, draft]) => {
        next[key] = draft.score ?? ""
      })
      return next
    })
    setResultDrafts((current) => {
      const next = { ...current }
      Object.entries(persistedDrafts).forEach(([key, draft]) => {
        if (draft.result) next[key] = draft.result
      })
      return next
    })
    setLocallyCompletedMatchIds((current) => {
      const next = { ...current }
      payload.forEach((matchResult) => {
        next[matchResult.matchId] = true
      })
      return next
    })
  }

  const renderMatchResultRows = () => {
    if (matchesLoading) {
      return (
        <tr>
          <td colSpan={7} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
            Loading matches...
          </td>
        </tr>
      )
    }

    if (matchesError) {
      return (
        <tr>
          <td colSpan={7} className="border border-gray-300 px-6 py-8 text-center text-red-500">
            Failed to load matches
          </td>
        </tr>
      )
    }

    if (!matchRows.length) {
      return (
        <tr>
          <td colSpan={7} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
            No matches for this round
          </td>
        </tr>
      )
    }

    return matchRows.flatMap((match) => {
      const slots = getResultSlots(match)
      if (!slots.length) {
        return (
          <tr key={match.id} className="hover:bg-gray-50">
            <td className="border border-gray-300 px-6 py-4 text-[#0D1321] font-medium">Match {match.id}</td>
            <td colSpan={6} className="border border-gray-300 px-6 py-4 text-[#4a4e69]">No sides assigned</td>
          </tr>
        )
      }

      return slots.map((slot, index) => {
        const key = scoreKey(match.id, slot.slot)
        const matchIsReadOnly = isMatchReadOnly(match)
        const canEditResult = canManageTeams && canEditSelectedRound && !matchIsReadOnly
        return (
          <tr key={key} className="hover:bg-gray-50">
            {index === 0 ? (
              <td rowSpan={slots.length} className="border border-gray-300 px-6 py-4 align-top text-[#0D1321] font-medium">
                Match {match.id}
              </td>
            ) : null}
            <td className="border border-gray-300 px-6 py-4 text-[#0D1321] font-medium">{slot.name}</td>
            <td className="border border-gray-300 px-6 py-4">
              {slot.kind === "team" ? (
                <div
                  role="group"
                  aria-label={`Result for ${slot.name} in match ${match.id}`}
                  className="inline-flex h-10 overflow-hidden rounded-lg border border-[#D5D9E7] bg-white"
                >
                  {(["won", "lost"] as const).map((value) => {
                    const isSelected = resultDrafts[key] === value
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={!canEditResult || isSubmittingResults}
                        aria-pressed={isSelected}
                        aria-label={`Mark ${slot.name} as ${value === "won" ? "winner" : "not winner"} in match ${match.id}`}
                        onClick={() => {
                          setResultDrafts((current) => ({ ...current, [key]: value }))
                        }}
                        className={`px-3 text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-[#0D1321] text-white"
                            : "text-[#0B1327] hover:bg-[#F5F7FC]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {value === "won" ? "Win" : "Loss"}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <span className="text-sm text-[#7A83A0]">—</span>
              )}
            </td>
            <td className="border border-gray-300 px-6 py-4">
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={scoreDrafts[key] ?? ""}
                disabled={!canEditResult || isSubmittingResults}
                aria-label={`Speaker points for ${slot.name} in match ${match.id}`}
                onChange={(event) => {
                  const value = event.target.value
                  setScoreDrafts((current) => ({ ...current, [key]: value }))
                }}
                className="h-10 w-28 rounded-lg border border-[#D5D9E7] px-3 text-center text-sm text-[#0B1327] outline-none transition focus:border-[#2B3F63] disabled:bg-[#F5F7FC] disabled:text-[#7A83A0]"
              />
            </td>
            {index === 0 ? (
              <>
                <td rowSpan={slots.length} className="border border-gray-300 px-6 py-4 align-top text-[#4a4e69]">
                  {match.location || "—"}
                </td>
                <td rowSpan={slots.length} className="border border-gray-300 px-6 py-4 align-top text-[#4a4e69]">
                  {match.judge?.fullName || "—"}
                </td>
                <td rowSpan={slots.length} className="border border-gray-300 px-6 py-4 align-top text-[#4a4e69]">
                  {matchIsReadOnly ? "Completed" : "Open"}
                </td>
              </>
            ) : null}
          </tr>
        )
      })
    })
  }

  const renderMatchResultsTable = () => (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[#0D1321]">
            {selectedRound} results and speaker points
          </h3>
        </div>
        {roundOptions.length > 1 ? (
          <div className="flex flex-wrap gap-2" aria-label="Select results round">
            {roundOptions.map((round) => (
              <button
                key={round}
                type="button"
                onClick={() => onSelectedRoundChange(round)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedRound === round
                    ? "bg-[#0D1321] text-white"
                    : "border border-[#D5D9E7] text-[#0D1321] hover:bg-[#F5F7FC]"
                }`}
              >
                {round}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Match</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Side</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Result</th>
              <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Speaker points</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Room</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Status</th>
            </tr>
          </thead>
          <tbody>{renderMatchResultRows()}</tbody>
        </table>
      </div>
      {scoreError ? <p className="mt-4 text-sm text-red-500" role="alert">{scoreError}</p> : null}
      <div className="flex justify-end mt-8 mb-8">
        <button
          type="button"
          disabled={!canSubmitMatchResults}
          onClick={handleSubmitMatchResults}
          className={matchSubmitButtonClass}
        >
          {isSubmittingResults ? "Submitting..." : "Submit results"}
        </button>
      </div>
    </>
  )

  const renderDeleteButton = (team: SimpleTeamResponse) => (
    <td className="border border-gray-300 px-6 py-4 text-center">
      <button
        aria-label={`Delete team ${team.name}`}
        className="inline-flex items-center justify-center rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-800 transition"
        onClick={() => onDeleteTeam(team.id, team.name)}
        disabled={deletingTeamId === team.id}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </td>
  )

  const renderFractionRow = (team: SimpleTeamResponse, isDark?: boolean) => (
    <tr key={team.id} className={isDark ? "bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]" : "hover:bg-gray-50"}>
      <td className={`border border-gray-300 px-6 py-4 text-[16px] font-medium ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
        {team.name}
      </td>
      {Array.from({ length: 4 }).map((_, index) => (
        <td key={index} className={`border border-gray-300 px-6 py-4 text-[16px] text-center ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
          —
        </td>
      ))}
      <td className={`border border-gray-300 px-6 py-4 text-[16px] text-center font-medium ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
        —
      </td>
      <td className={`border border-gray-300 px-6 py-4 text-[16px] ${isDark ? "text-white" : "text-[#4a4e69]"}`}>
        {team.club?.name ?? "—"}
      </td>
      {canManageTeams && renderDeleteButton(team)}
    </tr>
  )

  const isEliminationRound =
    selectedResultsOption !== "LD" &&
    ELIMINATION_ROUNDS.includes(activeResultsSection as (typeof ELIMINATION_ROUNDS)[number])
  const isMatchResultsMode = !isEliminationRound && shouldRenderMatchResults

  type TeamWithEliminationResult = SimpleTeamResponse & {
    eliminationResult?: {
      winnerTeamId?: number
      winnerName?: string
    }
  }

  const getEliminationResult = (team?: SimpleTeamResponse) =>
    team ? (team as TeamWithEliminationResult).eliminationResult : undefined

  const hasWinnerData = teamRows.some((team) => {
    const result = getEliminationResult(team)
    return typeof result?.winnerTeamId === "number" || typeof result?.winnerName === "string"
  })

  const resolveWinnerName = (fraction1?: SimpleTeamResponse, fraction2?: SimpleTeamResponse) => {
    if (!hasWinnerData) {
      return fraction2 ? "—" : fraction1?.name ?? "—"
    }

    const candidates = [fraction1, fraction2]
    for (const team of candidates) {
      const result = getEliminationResult(team)
      if (!result) continue
      if (typeof result.winnerName === "string") {
        return result.winnerName
      }
      if (typeof result.winnerTeamId === "number") {
        if (fraction1?.id === result.winnerTeamId) return fraction1.name
        if (fraction2?.id === result.winnerTeamId) return fraction2?.name ?? "—"
        return team?.name ?? "—"
      }
    }

    return fraction2 ? "—" : fraction1?.name ?? "—"
  }

  const renderEliminationTable = () => {
    const pairs = []
    for (let i = 0; i < teamRows.length; i += 2) {
      const fraction1 = teamRows[i]
      if (!fraction1) break
      const fraction2 = teamRows[i + 1]
      pairs.push({ fraction1, fraction2 })
    }

    if (!pairs.length) {
      return (
        <tr>
          <td colSpan={3} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">
            No matches scheduled for this round
          </td>
        </tr>
      )
    }

    return pairs.map(({ fraction1, fraction2 }, index) => (
      <tr key={`${fraction1.id}-${index}`} className="hover:bg-gray-50">
        <td className="border border-gray-300 px-6 py-4 text-[16px] text-[#0B1327] font-medium">{fraction1.name}</td>
        <td className="border border-gray-300 px-6 py-4 text-[16px] text-[#0B1327]">{fraction2?.name ?? "—"}</td>
        {hasWinnerData && (
          <td className="border border-gray-300 px-6 py-4 text-[16px] text-[#0B1327]">{resolveWinnerName(fraction1, fraction2)}</td>
        )}
      </tr>
    ))
  }

  return (
    <div className="p-8">
      <h2 className="text-[#0D1321] text-[32px] font-bold mb-8">{selectedResultsOption}</h2>

      <div className="relative">
        {isEliminationRound ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-white text-[14px] uppercase tracking-[0.08em] text-[#4A5168]">
                    <th className="border border-gray-300 px-6 py-4 text-left">Fraction 1</th>
                    <th className="border border-gray-300 px-6 py-4 text-left">Fraction 2</th>
                    {hasWinnerData && <th className="border border-gray-300 px-6 py-4 text-left">Winner</th>}
                  </tr>
                </thead>
                <tbody>{renderEliminationTable()}</tbody>
              </table>
            </div>
            <div className="flex justify-end mt-8 mb-8">
              <button type="button" disabled={submitDisabled} className={submitButtonClass}>
                Submit
              </button>
            </div>
          </>
        ) : isMatchResultsMode ? (
          renderMatchResultsTable()
        ) : (
          <>
        {selectedResultsOption === "APF" && activeResultsSection === "APF Speaker Score" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Speaker</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Overall</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {renderTeamRows(canManageTeams ? 8 : 7, (team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">{team.club?.name ?? team.name}</td>
                    <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{team.name}</td>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <td key={index} className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                    ))}
                    <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">—</td>
                    {canManageTeams && renderDeleteButton(team)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "APF" && resultsSubTab === "Results" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team, true))}</tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "BPF" && bpfSubTab === "BPF Speaker Score" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Speaker</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Overall</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team))}</tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "BPF" && bpfSubTab === "BPF Results" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team))}</tbody>
            </table>
          </div>
        )}

        {selectedResultsOption === "LD" && !isEliminationRound && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round {index + 1}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team))}</tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-8 mb-8">
          <button type="button" disabled={submitDisabled} className={submitButtonClass}>
            Submit
          </button>
        </div>
          </>
        )}

        {!isMatchResultsMode && (
          <div className="bg-[#0D1321] rounded-lg p-4">
            <div className="flex items-center justify-center gap-2">
              {selectedResultsOption !== "LD" && (
                <>
                  <button
                    className={`px-4 py-2 ${
                      activeResultsSection === `${selectedResultsOption} Results`
                        ? "bg-white text-[#0D1321]"
                        : "text-white hover:bg-[#3E5C76]"
                    } rounded text-[14px] font-medium transition-colors`}
                    onClick={() => {
                      onActiveResultsSectionChange(`${selectedResultsOption} Results`)
                      onResultsSubTabChange("Results")
                    }}
                  >
                    {selectedResultsOption} Results
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeResultsSection === `${selectedResultsOption} Speaker Score`
                        ? "bg-white text-[#0D1321]"
                        : "text-white hover:bg-[#3E5C76]"
                    } rounded text-[14px] font-medium transition-colors`}
                    onClick={() => {
                      onActiveResultsSectionChange(`${selectedResultsOption} Speaker Score`)
                      onResultsSubTabChange("Speaker Score")
                    }}
                  >
                    {selectedResultsOption} Speaker Score
                  </button>
                  <span className="text-white mx-2">|</span>
                </>
              )}

              {ELIMINATION_ROUNDS.map((round) => (
                <button
                  key={round}
                  className={`px-3 py-2 ${
                    activeResultsSection === round ? "bg-white text-[#0D1321]" : "text-white hover:bg-[#3E5C76]"
                  } rounded text-[14px] font-medium transition-colors`}
                  onClick={() => {
                    onActiveResultsSectionChange(round)
                    onSelectedRoundChange(round)
                    onResultsSubTabChange("Results")
                  }}
                >
                  {round}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
