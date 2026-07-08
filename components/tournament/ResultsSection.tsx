"use client"

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import type { PageResult } from "@/types/page"
import type { MatchResponse, MatchResultRequest } from "@/types/tournament/match"
import type { SimpleRoundResponse } from "@/types/tournament/round/round"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import {
  clearResultInputDrafts,
  readPersistedResultDrafts,
  readResultInputDrafts,
  toResultDraftValue,
  writePersistedResultDrafts,
  writeResultInputDrafts,
  type PersistedResultDraft,
  type PersistedResultDrafts,
  type ResultDraftValue,
} from "@/lib/tournament-result-drafts"
import {
  getParticipantName,
  getTeamMembers,
  participantScoreSlot,
  resolveParticipantCurrentScore,
  resolveTeamCurrentWon,
  type TeamSlotName,
} from "@/lib/match-result-slots"

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
  preliminaryRoundMatches?: PreliminaryRoundMatches[]
  preliminaryRoundMatchesLoading?: boolean
  preliminaryRoundMatchesError?: Error
}

const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2"] as const
type DebaterSlotName = "debater1" | "debater2"
type ScoreSlotName = string

type SpeakerScoreSlot = {
  kind: "speaker"
  slot: ScoreSlotName
  fallbackSlot: TeamSlotName
  entityId: number
  name: string
  currentScore?: number | null
}

type TeamResultSlot = {
  kind: "team"
  slot: TeamSlotName
  entityId: number
  name: string
  currentWon?: boolean | null
  speakers: SpeakerScoreSlot[]
}

type DebaterResultSlot = {
  kind: "debater"
  slot: DebaterSlotName
  entityId: number
  name: string
  currentScore?: number | null
}

type ResultSlot = TeamResultSlot | DebaterResultSlot
type ScoreSlot = SpeakerScoreSlot | DebaterResultSlot
type PreliminaryRoundMatches = {
  round: SimpleRoundResponse
  matches: PageResult<MatchResponse>
}
type ResultsView = "entry" | "standings" | "speaker-details" | "win-count"

const RESULTS_VIEW_OPTIONS: ReadonlyArray<{ id: ResultsView; label: string }> = [
  { id: "entry", label: "Round entry" },
  { id: "standings", label: "Preliminary standings" },
  { id: "speaker-details", label: "Speaker details" },
  { id: "win-count", label: "Win count by round" },
]

const isValidScoreValue = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0
  if (typeof value !== "string" || value.trim() === "") return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
}

const getMatchTeamScore = (match: MatchResponse, slot: TeamSlotName) => {
  const score = (match as MatchResponse & Record<string, unknown>)[`${slot}Score`]
  return typeof score === "number" && Number.isFinite(score) ? score : null
}

const isCompleteResultValue = (result: ResultDraftValue) => result === "won" || result === "lost"

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
  preliminaryRoundMatches,
  preliminaryRoundMatchesLoading = false,
  preliminaryRoundMatchesError,
}: ResultsSectionProps) {
  const teamRows = useMemo(() => teams?.content ?? [], [teams?.content])
  const teamsById = useMemo(() => {
    return new Map(teamRows.map((team) => [team.id, team]))
  }, [teamRows])
  const matchRows = useMemo(() => matches?.content ?? [], [matches?.content])
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})
  const [resultDrafts, setResultDrafts] = useState<Record<string, ResultDraftValue>>({})
  const [locallyCompletedMatchIds, setLocallyCompletedMatchIds] = useState<Record<number, boolean>>({})
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [selectedResultsView, setSelectedResultsView] = useState<ResultsView | "auto">("auto")
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

  const getResultSlots = useCallback((match: MatchResponse): ResultSlot[] => {
    const slots: ResultSlot[] = []
    const teamSlots = [
      { slot: "team1", team: match.team1 },
      { slot: "team2", team: match.team2 },
      { slot: "team3", team: match.team3 },
      { slot: "team4", team: match.team4 },
    ] as const

    teamSlots.forEach(({ slot, team }) => {
      if (!team) return
      const members = getTeamMembers(team, teamsById)
      slots.push({
        kind: "team",
        slot,
        entityId: team.id,
        name: team.name,
        currentWon: resolveTeamCurrentWon(match, slot, team.id),
        speakers: members.map((member, index) => ({
          kind: "speaker",
          slot: participantScoreSlot(slot, member.id),
          fallbackSlot: slot,
          entityId: member.id,
          name: getParticipantName(member, `Speaker ${index + 1}`),
          currentScore: resolveParticipantCurrentScore(match, slot, team.id, member.id, index),
        })),
      })
    })

    const debaterSlots = [
      { slot: "debater1", debater: match.debater1, score: match.debater1Score },
      { slot: "debater2", debater: match.debater2, score: match.debater2Score },
    ] as const

    debaterSlots.forEach(({ slot, debater, score }) => {
      if (!debater) return
      slots.push({
        kind: "debater",
        slot,
        entityId: debater.id,
        name: getParticipantName(debater, `Debater ${debater.id}`),
        currentScore: score,
      })
    })

    return slots
  }, [teamsById])

  const scoreKey = useCallback(
    (matchId: number, slot: ScoreSlotName) => `${matchId}:${slot}`,
    []
  )

  const getScoreSlots = useCallback((match: MatchResponse): ScoreSlot[] => {
    return getResultSlots(match).flatMap((slot): ScoreSlot[] => slot.kind === "team" ? slot.speakers : [slot])
  }, [getResultSlots])

  const hasDraftScore = useCallback((matchId: number, slot: ScoreSlot) => {
    return isValidScoreValue(scoreDrafts[scoreKey(matchId, slot.slot)])
  }, [scoreDrafts, scoreKey])

  const hasPersistedScore = useCallback((drafts: PersistedResultDrafts, matchId: number, slot: ScoreSlot) => {
    const draft = drafts[scoreKey(matchId, slot.slot)]
    if (isValidScoreValue(draft?.score)) return true

    if (slot.kind === "speaker") {
      return isValidScoreValue(drafts[scoreKey(matchId, slot.fallbackSlot)]?.score)
    }

    return false
  }, [scoreKey])

  const getPersistedResult = useCallback((drafts: PersistedResultDrafts, matchId: number, slot: TeamSlotName) => {
    return toResultDraftValue(drafts[scoreKey(matchId, slot)]?.result)
  }, [scoreKey])

  const getTeamResultRule = useCallback((teamCount: number) => {
    const isBpfMatch = selectedResultsOption === "BPF" || teamCount >= 4
    return {
      requiredTeamCount: isBpfMatch ? 4 : 2,
      requiredWinnerCount: isBpfMatch ? 2 : 1,
    }
  }, [selectedResultsOption])

  const hasValidTeamResultSet = useCallback((teamCount: number, results: ResultDraftValue[]) => {
    const { requiredTeamCount, requiredWinnerCount } = getTeamResultRule(teamCount)
    return (
      teamCount === requiredTeamCount &&
      results.every(isCompleteResultValue) &&
      results.filter((result) => result === "won").length === requiredWinnerCount
    )
  }, [getTeamResultRule])

  const hasCompletePersistedResult = useCallback((match: MatchResponse, drafts: PersistedResultDrafts) => {
    const slots = getResultSlots(match)
    const teamSlots = slots.filter((slot): slot is TeamResultSlot => slot.kind === "team")
    const debaterSlots = slots.filter((slot): slot is DebaterResultSlot => slot.kind === "debater")

    if (teamSlots.length > 0) {
      const results = teamSlots.map((slot) => getPersistedResult(drafts, match.id, slot.slot))
      return (
        hasValidTeamResultSet(teamSlots.length, results) &&
        teamSlots.every((slot) =>
          slot.speakers.length > 0 &&
          slot.speakers.every((speaker) => hasPersistedScore(drafts, match.id, speaker))
        )
      )
    }

    return debaterSlots.length > 0 && debaterSlots.every((slot) => hasPersistedScore(drafts, match.id, slot))
  }, [getPersistedResult, getResultSlots, hasPersistedScore, hasValidTeamResultSet])

  const saveInputDraft = useCallback((key: string, patch: PersistedResultDraft) => {
    const drafts = readResultInputDrafts(resultStorageKey)
    const nextDraft = { ...drafts[key], ...patch }
    const score = typeof nextDraft.score === "string" ? nextDraft.score : undefined
    const result = toResultDraftValue(nextDraft.result)
    const hasScore = score !== undefined && score.trim() !== ""
    const hasResult = result !== ""

    if (!hasScore && !hasResult) {
      delete drafts[key]
    } else {
      drafts[key] = {
        ...(hasScore ? { score } : {}),
        ...(hasResult ? { result } : {}),
      }
    }

    writeResultInputDrafts(resultStorageKey, drafts)
  }, [resultStorageKey])

  useEffect(() => {
    const submittedDrafts = readPersistedResultDrafts(resultStorageKey)
    const inputDrafts = readResultInputDrafts(resultStorageKey)
    const nextCompletedMatches: Record<number, boolean> = {}

    setScoreDrafts(() => {
      const next: Record<string, string> = {}
      matchRows.forEach((match) => {
        getScoreSlots(match).forEach((slot) => {
          const key = scoreKey(match.id, slot.slot)
          const legacySubmittedScore =
            slot.kind === "speaker" ? submittedDrafts[scoreKey(match.id, slot.fallbackSlot)]?.score : undefined
          const legacyInputScore =
            slot.kind === "speaker" ? inputDrafts[scoreKey(match.id, slot.fallbackSlot)]?.score : undefined
          next[key] =
            typeof slot.currentScore === "number"
              ? String(slot.currentScore)
              : submittedDrafts[key]?.score ?? legacySubmittedScore ?? inputDrafts[key]?.score ?? legacyInputScore ?? ""
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
              : toResultDraftValue(submittedDrafts[key]?.result ?? inputDrafts[key]?.result)
        })
      })
      return next
    })
    matchRows.forEach((match) => {
      if (hasCompletePersistedResult(match, submittedDrafts)) {
        nextCompletedMatches[match.id] = true
      }
    })
    setLocallyCompletedMatchIds(nextCompletedMatches)
    setScoreError(null)
  }, [getResultSlots, getScoreSlots, hasCompletePersistedResult, matchRows, resultStorageKey, scoreKey])

  const isMatchDraftComplete = useCallback((match: MatchResponse) => {
    const slots = getResultSlots(match)
    const teamSlots = slots.filter((slot): slot is TeamResultSlot => slot.kind === "team")
    const debaterSlots = slots.filter((slot): slot is DebaterResultSlot => slot.kind === "debater")

    if (teamSlots.length > 0) {
      const results = teamSlots.map((slot) => resultDrafts[scoreKey(match.id, slot.slot)])
      return (
        hasValidTeamResultSet(teamSlots.length, results) &&
        teamSlots.every((slot) =>
          slot.speakers.length > 0 &&
          slot.speakers.every((speaker) => hasDraftScore(match.id, speaker))
        )
      )
    }

    return debaterSlots.length > 0 && debaterSlots.every((slot) => hasDraftScore(match.id, slot))
  }, [getResultSlots, hasDraftScore, hasValidTeamResultSet, resultDrafts, scoreKey])

  const isMatchBackendComplete = useCallback((match: MatchResponse) => {
    const slots = getResultSlots(match)
    const teamSlots = slots.filter((slot): slot is TeamResultSlot => slot.kind === "team")
    const debaterSlots = slots.filter((slot): slot is DebaterResultSlot => slot.kind === "debater")

    if (teamSlots.length > 0) {
      const results: ResultDraftValue[] = teamSlots.map((slot) => {
        if (slot.currentWon === true) return "won"
        if (slot.currentWon === false) return "lost"
        return ""
      })
      return (
        hasValidTeamResultSet(teamSlots.length, results) &&
        teamSlots.every((slot) =>
          (
            slot.speakers.length > 0 &&
            slot.speakers.every((speaker) => isValidScoreValue(speaker.currentScore))
          ) ||
          isValidScoreValue(getMatchTeamScore(match, slot.slot))
        )
      )
    }

    return debaterSlots.length > 0 && debaterSlots.every((slot) => isValidScoreValue(slot.currentScore))
  }, [getResultSlots, hasValidTeamResultSet])

  const isMatchReadOnly = useCallback((match: MatchResponse) => {
    if (match.completed && isMatchBackendComplete(match)) return true
    return Boolean(locallyCompletedMatchIds[match.id]) && isMatchDraftComplete(match)
  }, [isMatchBackendComplete, isMatchDraftComplete, locallyCompletedMatchIds])

  const editableMatches = useMemo(
    () => matchRows.filter((match) => !isMatchReadOnly(match) && getResultSlots(match).length > 0),
    [getResultSlots, isMatchReadOnly, matchRows]
  )
  const canRepairSelectedRound =
    hasRoundProgress &&
    typeof selectedRoundNumber === "number" &&
    typeof currentRoundNumber === "number" &&
    selectedRoundNumber < currentRoundNumber &&
    editableMatches.length > 0

  // Organizers fill results match-by-match as rounds finish, so allow submitting the
  // matches that are fully scored rather than forcing every open match to be ready first.
  const completedDraftMatches = useMemo(
    () => editableMatches.filter((match) => isMatchDraftComplete(match)),
    [editableMatches, isMatchDraftComplete]
  )

  const hasEditableMatches = editableMatches.length > 0
  const readyToSubmitCount = completedDraftMatches.length
  const pendingMatchCount = editableMatches.length - readyToSubmitCount
  const hasTeamsWithoutSpeakers = editableMatches.some((match) =>
    getResultSlots(match).some((slot) => slot.kind === "team" && slot.speakers.length === 0)
  )
  const canSubmitMatchResults =
    Boolean(onSubmitResults) &&
    canManageTeams &&
    (canEditSelectedRound || canRepairSelectedRound) &&
    readyToSubmitCount > 0 &&
    !isSubmittingResults
  const shouldRenderMatchResults = matchesLoading || matchesError || Boolean(matches)
  const matchSubmitButtonClass = `px-8 py-3 bg-[#3E5C76] text-white rounded-lg text-[16px] font-medium transition-colors ${
    canSubmitMatchResults ? "hover:bg-[#2D3748]" : "cursor-not-allowed opacity-50"
  }`
  const summaryRoundMatches = useMemo(() => {
    return [...(preliminaryRoundMatches ?? [])].sort((a, b) => a.round.roundNumber - b.round.roundNumber)
  }, [preliminaryRoundMatches])
  const preliminarySummary = useMemo(() => {
    const teamStandings = new Map<number, {
      teamId: number
      teamName: string
      clubName: string
      wins: number
      losses: number
      pending: number
      speakerTotal: number
      speakerPointCount: number
      roundResults: Record<number, string[]>
      roundSpeakerTotals: Record<number, number[]>
    }>()
    const speakerStandings = new Map<number, {
      participantId: number
      speakerName: string
      teamId: number
      teamName: string
      aggregateScore: number | null
      total: number
      count: number
      roundScores: Record<number, number[]>
    }>()

    const ensureTeam = (team: SimpleTeamResponse) => {
      const existing = teamStandings.get(team.id)
      if (existing) return existing
      const row = {
        teamId: team.id,
        teamName: team.name,
        clubName: team.club?.name ?? "—",
        wins: 0,
        losses: 0,
        pending: 0,
        speakerTotal: 0,
        speakerPointCount: 0,
        roundResults: {},
        roundSpeakerTotals: {},
      }
      teamStandings.set(team.id, row)
      return row
    }

    const ensureSpeaker = (
      participantId: number,
      speakerName: string,
      teamId: number,
      teamName: string,
      aggregateScore: number | null,
    ) => {
      const existing = speakerStandings.get(participantId)
      if (existing && existing.aggregateScore === null && aggregateScore !== null) {
        existing.aggregateScore = aggregateScore
      }
      if (existing) return existing
      const row = {
        participantId,
        speakerName,
        teamId,
        teamName,
        aggregateScore,
        total: 0,
        count: 0,
        roundScores: {},
      }
      speakerStandings.set(participantId, row)
      return row
    }

    summaryRoundMatches.forEach(({ round, matches: roundMatchPage }) => {
      roundMatchPage.content.forEach((match) => {
        const teamSlots = [
          { slot: "team1", team: match.team1 },
          { slot: "team2", team: match.team2 },
          { slot: "team3", team: match.team3 },
          { slot: "team4", team: match.team4 },
        ] as const

        teamSlots.forEach(({ slot, team }) => {
          if (!team) return
          const teamRow = ensureTeam(team)
          const won = resolveTeamCurrentWon(match, slot, team.id)
          if (!teamRow.roundResults[round.roundNumber]) teamRow.roundResults[round.roundNumber] = []

          if (won === true) {
            teamRow.wins += 1
            teamRow.roundResults[round.roundNumber].push("W")
          } else if (won === false) {
            teamRow.losses += 1
            teamRow.roundResults[round.roundNumber].push("L")
          } else {
            teamRow.pending += 1
            teamRow.roundResults[round.roundNumber].push("—")
          }

          let speakerScoresFoundForMatch = 0
          getTeamMembers(team, teamsById).forEach((member, index) => {
            const speakerRow = ensureSpeaker(
              member.id,
              getParticipantName(member, `Speaker ${index + 1}`),
              team.id,
              team.name,
              typeof member.speakerScore === "number" && Number.isFinite(member.speakerScore)
                ? member.speakerScore
                : null,
            )
            const score = resolveParticipantCurrentScore(match, slot, team.id, member.id, index)
            if (typeof score !== "number" || !Number.isFinite(score)) return

            if (!speakerRow.roundScores[round.roundNumber]) speakerRow.roundScores[round.roundNumber] = []
            speakerRow.roundScores[round.roundNumber].push(score)
            speakerRow.total += score
            speakerRow.count += 1
            teamRow.speakerTotal += score
            teamRow.speakerPointCount += 1
            speakerScoresFoundForMatch += 1
          })

          const teamScore = getMatchTeamScore(match, slot)
          if (speakerScoresFoundForMatch === 0 && teamScore !== null) {
            if (!teamRow.roundSpeakerTotals[round.roundNumber]) teamRow.roundSpeakerTotals[round.roundNumber] = []
            teamRow.roundSpeakerTotals[round.roundNumber].push(teamScore)
            teamRow.speakerTotal += teamScore
            teamRow.speakerPointCount += 1
          }
        })
      })
    })

    return {
      teams: Array.from(teamStandings.values()).sort((a, b) =>
        b.wins - a.wins ||
        a.teamName.localeCompare(b.teamName)
      ),
      speakers: Array.from(speakerStandings.values()).sort((a, b) => {
        const aTotal = a.count ? a.total : a.aggregateScore ?? 0
        const bTotal = b.count ? b.total : b.aggregateScore ?? 0
        const aAverage = a.count ? a.total / a.count : a.aggregateScore ?? 0
        const bAverage = b.count ? b.total / b.count : b.aggregateScore ?? 0

        return bTotal - aTotal || bAverage - aAverage || a.speakerName.localeCompare(b.speakerName)
      }),
    }
  }, [summaryRoundMatches, teamsById])
  const summaryRounds = useMemo(() => summaryRoundMatches.map(({ round }) => round), [summaryRoundMatches])
  const preliminaryIsComplete = useMemo(() => {
    if (!summaryRoundMatches.length) return false
    return summaryRoundMatches.every(({ matches: roundMatchPage }) =>
      roundMatchPage.content.length > 0 &&
      roundMatchPage.content.every((match) => isMatchBackendComplete(match))
    )
  }, [isMatchBackendComplete, summaryRoundMatches])
  const availableResultsViewOptions = useMemo(() => {
    return RESULTS_VIEW_OPTIONS.filter((option) =>
      canManageTeams || option.id === "standings" || option.id === "win-count"
    )
  }, [canManageTeams])
  const activeResultsView = (() => {
    if (selectedResultsView === "auto") {
      if (!canManageTeams) return "standings"
      return preliminaryIsComplete ? "standings" : "entry"
    }

    return availableResultsViewOptions.some((option) => option.id === selectedResultsView)
      ? selectedResultsView
      : "standings"
  })()

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
    return completedDraftMatches.map((match) => {
      const teamResults = getResultSlots(match)
        .filter((slot) => slot.kind === "team")
        .map((slot) => ({
          teamId: slot.entityId,
          won: resultDrafts[scoreKey(match.id, slot.slot)] === "won",
          participantScores: slot.speakers.map((speaker) => ({
            participantId: speaker.entityId,
            score: Number(scoreDrafts[scoreKey(match.id, speaker.slot)]),
          })),
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

  const buildPersistedDrafts = (): PersistedResultDrafts => {
    return completedDraftMatches.reduce<PersistedResultDrafts>((acc, match) => {
      getResultSlots(match).forEach((slot) => {
        if (slot.kind === "team") {
          acc[scoreKey(match.id, slot.slot)] = {
            result: resultDrafts[scoreKey(match.id, slot.slot)] ?? "",
          }
          slot.speakers.forEach((speaker) => {
            acc[scoreKey(match.id, speaker.slot)] = {
              score: scoreDrafts[scoreKey(match.id, speaker.slot)] ?? "",
            }
          })
          return
        }

        acc[scoreKey(match.id, slot.slot)] = {
          score: scoreDrafts[scoreKey(match.id, slot.slot)] ?? "",
        }
      })

      return acc
    }, {})
  }

  const handleSubmitMatchResults = async () => {
    if (!onSubmitResults || !canManageTeams) return

    if (!canEditSelectedRound && !canRepairSelectedRound) {
      setScoreError("Only the current round or incomplete past results can be submitted.")
      return
    }

    if (!hasEditableMatches) {
      setScoreError("There are no open matches to submit.")
      return
    }

    if (readyToSubmitCount === 0) {
      setScoreError(
        hasTeamsWithoutSpeakers
          ? "Add participants to every team before submitting speaker points."
          : "APF matches need one winner; BPF matches need two winners. Every speaker also needs points."
      )
      return
    }

    const payload = buildResultPayload()
    const submittedDraftPatch = buildPersistedDrafts()
    const previousPersistedDrafts = readPersistedResultDrafts(resultStorageKey)
    const persistedDrafts = {
      ...previousPersistedDrafts,
      ...submittedDraftPatch,
    }
    const restoreLocallyCompletedMatches = () => {
      setLocallyCompletedMatchIds((current) => {
        const next = { ...current }
        payload.forEach((matchResult) => {
          const match = editableMatches.find((item) => item.id === matchResult.matchId)
          if (match && hasCompletePersistedResult(match, previousPersistedDrafts)) {
            next[matchResult.matchId] = true
            return
          }

          delete next[matchResult.matchId]
        })
        return next
      })
    }

    setScoreError(null)
    writePersistedResultDrafts(resultStorageKey, persistedDrafts)
    setLocallyCompletedMatchIds((current) => {
      const next = { ...current }
      payload.forEach((matchResult) => {
        next[matchResult.matchId] = true
      })
      return next
    })
    let submitResult: boolean | void
    try {
      submitResult = await onSubmitResults(payload)
    } catch (error) {
      writePersistedResultDrafts(resultStorageKey, previousPersistedDrafts)
      restoreLocallyCompletedMatches()
      throw error
    }

    if (submitResult === false) {
      writePersistedResultDrafts(resultStorageKey, previousPersistedDrafts)
      restoreLocallyCompletedMatches()
      return
    }

    writePersistedResultDrafts(resultStorageKey, persistedDrafts)
    const remainingInputDrafts = { ...readResultInputDrafts(resultStorageKey) }
    Object.keys(submittedDraftPatch).forEach((key) => {
      delete remainingInputDrafts[key]
    })
    if (Object.keys(remainingInputDrafts).length === 0) {
      clearResultInputDrafts(resultStorageKey)
    } else {
      writeResultInputDrafts(resultStorageKey, remainingInputDrafts)
    }
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
  }

  const getTeamResultUpdates = useCallback((match: MatchResponse, selectedSlot: TeamSlotName, value: ResultDraftValue) => {
    const teamSlots = getResultSlots(match).filter((slot): slot is TeamResultSlot => slot.kind === "team")
    const updates = new Map<TeamSlotName, ResultDraftValue>([[selectedSlot, value]])

    if (teamSlots.length === 2) {
      const otherSlot = teamSlots.find((slot) => slot.slot !== selectedSlot)
      if (otherSlot) updates.set(otherSlot.slot, value === "won" ? "lost" : "won")
      return Array.from(updates.entries()).map(([slot, result]) => ({ slot, result }))
    }

    const isBpfMatch = selectedResultsOption === "BPF" || teamSlots.length >= 4
    if (isBpfMatch) {
      const currentResults = new Map<TeamSlotName, ResultDraftValue>(
        teamSlots.map((slot) => [slot.slot, resultDrafts[scoreKey(match.id, slot.slot)] ?? ""])
      )
      currentResults.set(selectedSlot, value)

      const winnerSlots = teamSlots.filter((slot) => currentResults.get(slot.slot) === "won")
      if (winnerSlots.length > 2) {
        const slotToDemote = winnerSlots.find((slot) => slot.slot !== selectedSlot)
        if (slotToDemote) updates.set(slotToDemote.slot, "lost")
      }

      const loserSlots = teamSlots.filter((slot) => currentResults.get(slot.slot) === "lost")
      if (loserSlots.length > 2) {
        const slotToPromote = loserSlots.find((slot) => slot.slot !== selectedSlot)
        if (slotToPromote) updates.set(slotToPromote.slot, "won")
      }

      return Array.from(updates.entries()).map(([slot, result]) => ({ slot, result }))
    }

    if (value === "won") {
      teamSlots.forEach((slot) => {
        if (slot.slot !== selectedSlot) updates.set(slot.slot, "lost")
      })
    }

    return Array.from(updates.entries()).map(([slot, result]) => ({ slot, result }))
  }, [getResultSlots, resultDrafts, scoreKey, selectedResultsOption])

  const updateTeamResultDraft = useCallback((match: MatchResponse, selectedSlot: TeamSlotName, value: ResultDraftValue) => {
    const updates = getTeamResultUpdates(match, selectedSlot, value)
    setResultDrafts((current) => {
      const next = { ...current }
      updates.forEach(({ slot, result }) => {
        next[scoreKey(match.id, slot)] = result
      })
      return next
    })
    updates.forEach(({ slot, result }) => {
      saveInputDraft(scoreKey(match.id, slot), { result })
    })
  }, [getTeamResultUpdates, saveInputDraft, scoreKey])

  const renderScoreInput = (
    match: MatchResponse,
    slot: ScoreSlot,
    canEditResult: boolean,
    labelPrefix?: string,
  ) => {
    const key = scoreKey(match.id, slot.slot)

    return (
      <label key={key} className="flex items-center justify-between gap-3 text-sm text-[#4A5168]">
        <span className="min-w-0 truncate">{labelPrefix ? `${labelPrefix}: ${slot.name}` : slot.name}</span>
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
            saveInputDraft(key, { score: value })
          }}
          className="h-10 w-24 shrink-0 rounded-lg border border-[#D5D9E7] px-3 text-center text-sm text-[#0B1327] outline-none transition focus:border-[#2B3F63] disabled:bg-[#F5F7FC] disabled:text-[#7A83A0]"
        />
      </label>
    )
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
        const canEditResult = canManageTeams && (canEditSelectedRound || canRepairSelectedRound) && !matchIsReadOnly
        const statusLabel = matchIsReadOnly ? "Completed" : match.completed ? "Needs correction" : "Open"
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
                          updateTeamResultDraft(match, slot.slot, value)
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
              {slot.kind === "team" ? (
                slot.speakers.length > 0 ? (
                  <div className="grid min-w-64 gap-2">
                    {slot.speakers.map((speaker, speakerIndex) =>
                      renderScoreInput(match, speaker, canEditResult, `Speaker ${speakerIndex + 1}`)
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-red-500">No participants assigned</span>
                )
              ) : (
                renderScoreInput(match, slot, canEditResult)
              )}
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
                  {statusLabel}
                </td>
              </>
            ) : null}
          </tr>
        )
      })
    })
  }

  const formatScore = (score: number) => Number.isInteger(score) ? String(score) : score.toFixed(1)
  const getRoundHeader = (round: SimpleRoundResponse) => `${round.roundNumber} раунд`
  const getRoundResultValue = (result: string) => {
    if (result === "W") return "1"
    if (result === "L") return "0"
    return "—"
  }

  const renderPreliminarySummaryState = () => {
    if (preliminaryRoundMatchesLoading) {
      return (
        <div className="rounded-lg border border-[#D5D9E7] bg-white px-6 py-5 text-sm text-[#4A5168]">
          Loading preliminary standings...
        </div>
      )
    }

    if (preliminaryRoundMatchesError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
          Failed to load preliminary standings.
        </div>
      )
    }

    if (!summaryRoundMatches.length) {
      return (
        <div className="rounded-lg border border-[#D5D9E7] bg-white px-6 py-5 text-sm text-[#4A5168]">
          No preliminary rounds loaded yet.
        </div>
      )
    }

    return null
  }

  const renderPreliminaryStandingsTable = () => {
    const state = renderPreliminarySummaryState()
    if (state) return state
    const hasTeamRows = preliminarySummary.teams.length > 0

    return (
      <section>
        <h3 className="mb-4 text-xl font-semibold text-[#0D1321]">Preliminary standings</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-4 text-center text-[#0D1321] font-medium text-[16px]">№</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Фракция атауы</th>
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Жеңіс саны</th>
              </tr>
            </thead>
            <tbody>
              {hasTeamRows ? preliminarySummary.teams.map((team, index) => (
                <tr key={team.teamId} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-4 text-center text-[#4a4e69] text-[16px] font-medium">{index + 1}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] font-medium">{team.teamName}</td>
                  <td className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] text-[16px] font-semibold">{team.wins}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">
                    No preliminary team results yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const renderSpeakerDetailsTable = () => {
    const state = renderPreliminarySummaryState()
    if (state) return state
    const hasTeamRows = preliminarySummary.teams.length > 0

    return (
      <section>
        <h3 className="mb-4 text-xl font-semibold text-[#0D1321]">Speaker details</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse border border-gray-300 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-4 text-center text-[#0D1321] font-medium text-[16px]">№</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Фракция атауы</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Спикер</th>
                {summaryRounds.map((round) => (
                  <th key={round.id} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">
                    {getRoundHeader(round)}
                  </th>
                ))}
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Іріктеу нәтижесі</th>
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Жалпы іріктеу нәтижесі</th>
              </tr>
            </thead>
            <tbody>
              {hasTeamRows ? preliminarySummary.teams.flatMap((team, teamIndex) => {
                const speakers = preliminarySummary.speakers.filter((speaker) => speaker.teamId === team.teamId)
                const rows = speakers.length ? speakers : [null]

                return rows.map((speaker, speakerIndex) => (
                  <tr key={speaker ? `${team.teamId}-${speaker.participantId}` : `${team.teamId}-empty`} className="hover:bg-gray-50">
                    {speakerIndex === 0 ? (
                      <td rowSpan={rows.length} className="border border-gray-300 px-4 py-4 text-center align-top text-[#4a4e69] text-[16px] font-medium">
                        {teamIndex + 1}
                      </td>
                    ) : null}
                    {speakerIndex === 0 ? (
                      <td rowSpan={rows.length} className="border border-gray-300 px-6 py-4 align-top text-[#0D1321] text-[16px] font-medium">
                        {team.teamName}
                      </td>
                    ) : null}
                    <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] font-medium">
                      {speaker?.speakerName ?? "—"}
                    </td>
                    {summaryRounds.map((round) => {
                      const scores = speaker?.roundScores[round.roundNumber]
                      return (
                        <td key={round.id} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69] text-[16px]">
                          {scores?.length ? scores.map(formatScore).join(", ") : "—"}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] text-[16px] font-semibold">
                      {speaker && (speaker.count || speaker.aggregateScore !== null)
                        ? formatScore(speaker.count ? speaker.total : speaker.aggregateScore ?? 0)
                        : "—"}
                    </td>
                    {speakerIndex === 0 ? (
                      <td rowSpan={rows.length} className="border border-gray-300 px-6 py-4 text-center align-top text-[#0D1321] text-[16px] font-semibold">
                        {team.speakerPointCount ? formatScore(team.speakerTotal) : "—"}
                      </td>
                    ) : null}
                  </tr>
                ))
              }) : (
                <tr>
                  <td colSpan={summaryRounds.length + 5} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">
                    No preliminary speaker points yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const renderWinCountTable = () => {
    const state = renderPreliminarySummaryState()
    if (state) return state
    const hasTeamRows = preliminarySummary.teams.length > 0

    return (
      <section>
        <h3 className="mb-4 text-xl font-semibold text-[#0D1321]">Win count by round</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse border border-gray-300 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-4 text-center text-[#0D1321] font-medium text-[16px]">№</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Фракция атауы</th>
                {summaryRounds.map((round) => (
                  <th key={round.id} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">
                    {getRoundHeader(round)}
                  </th>
                ))}
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Іріктеу нәтижесі</th>
              </tr>
            </thead>
            <tbody>
              {hasTeamRows ? preliminarySummary.teams.map((team, index) => (
                <tr key={team.teamId} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-4 text-center text-[#4a4e69] text-[16px] font-medium">{index + 1}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] font-medium">{team.teamName}</td>
                  {summaryRounds.map((round) => {
                    const results = team.roundResults[round.roundNumber]
                    return (
                      <td key={round.id} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69] text-[16px]">
                        {results?.length ? results.map(getRoundResultValue).join(", ") : "—"}
                      </td>
                    )
                  })}
                  <td className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] text-[16px] font-semibold">{team.wins}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={summaryRounds.length + 3} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">
                    No preliminary team results yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const renderRoundEntryTable = () => (
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
      {hasEditableMatches ? (
        <p className="mt-4 text-sm text-[#4A5168]">
          {readyToSubmitCount > 0
            ? `${readyToSubmitCount} of ${editableMatches.length} ${editableMatches.length === 1 ? "match" : "matches"} ready to submit${
                pendingMatchCount > 0
                  ? `. ${pendingMatchCount} still need${pendingMatchCount === 1 ? "s" : ""} a result and speaker points.`
                  : "."
              }`
            : "APF matches need one winner; BPF matches need two winners. Every speaker also needs points."}
        </p>
      ) : null}
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

  const renderResultsWorkspace = () => (
    <>
      <div className="mb-6 flex flex-wrap gap-2" aria-label="Select results view">
        {availableResultsViewOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={activeResultsView === option.id}
            onClick={() => setSelectedResultsView(option.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeResultsView === option.id
                ? "bg-[#0D1321] text-white"
                : "border border-[#D5D9E7] text-[#0D1321] hover:bg-[#F5F7FC]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {activeResultsView === "entry" ? renderRoundEntryTable() : null}
      {activeResultsView === "standings" ? renderPreliminaryStandingsTable() : null}
      {activeResultsView === "speaker-details" ? renderSpeakerDetailsTable() : null}
      {activeResultsView === "win-count" ? renderWinCountTable() : null}
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
          renderResultsWorkspace()
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
