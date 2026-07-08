"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Save, Trash2 } from "lucide-react"

import type { PageResult } from "@/types/page"
import type { MatchResponse, MatchUpdateRequest } from "@/types/tournament/match"
import type { JudgeResponse } from "@/types/tournament/judge"
import type { SimpleRoundResponse } from "@/types/tournament/round/round"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import {
  readPersistedResultDrafts,
  RESULT_DRAFTS_CHANGED_EVENT,
  type PersistedResultDrafts,
} from "@/lib/tournament-result-drafts"
import {
  getTeamMembers,
  participantScoreSlot,
  resolveParticipantCurrentScore,
  resolveTeamCurrentWon,
} from "@/lib/match-result-slots"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

interface PairingsSectionProps {
  matches?: PageResult<MatchResponse>
  rounds?: SimpleRoundResponse[]
  teams?: PageResult<SimpleTeamResponse>
  judges?: PageResult<JudgeResponse>
  matchesLoading: boolean
  matchesError?: Error
  selectedStage: StageId
  selectedRound: string
  selectedRoundNumber?: number | null
  currentRoundNumber?: number | null
  onSelectStage: (stage: StageId) => void
  onSelectRound: (round: string) => void
  onProceedToNextRound?: () => void
  onRandomizePairings?: () => void
  onSubmitPairings?: () => void
  onClearMatches?: (stage: StageId) => void
  stageFormats?: Partial<Record<StageId, FormatOption>>
  onUpdateMatchRoom?: (matchId: number, location: string) => void
  onUpdateMatch?: (matchId: number, payload: MatchUpdateRequest) => Promise<void> | void
  savingMatchId?: number | null
  resultStorageKey?: string
}

const STAGE_TABS = [
  { id: "preliminary", label: "Preliminary", defaultFormat: "APF" },
  { id: "team", label: "Team elimination", defaultFormat: "BPF" },
  { id: "solo", label: "Solo elimination", defaultFormat: "LD" },
] as const

const STANDARD_ROUNDS = ["Round 1", "Round 2", "Round 3", "Round 4"] as const
const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2"] as const
export type StageId = (typeof STAGE_TABS)[number]["id"]
export type FormatOption = "APF" | "BPF" | "LD"

const DEFAULT_STAGE_FORMATS: Record<StageId, FormatOption> = STAGE_TABS.reduce((acc, tab) => {
  acc[tab.id] = tab.defaultFormat
  return acc
}, {} as Record<StageId, FormatOption>)

const DEFAULT_ROUND_BY_STAGE: Record<StageId, string> = {
  preliminary: STANDARD_ROUNDS[0],
  team: ELIMINATION_ROUNDS[0],
  solo: ELIMINATION_ROUNDS[0],
}

type MatchDraft = {
  location: string
  judgeId: string
  team1Id: string
  team2Id: string
  team3Id: string
  team4Id: string
}

const toSelectValue = (id?: number | null) => (typeof id === "number" ? String(id) : "")

const toOptionalId = (value: string) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

type ResultScoreSlot =
  | "team1"
  | "team2"
  | "team3"
  | "team4"
  | "debater1"
  | "debater2"

const hasNumericScore = (value: unknown) => typeof value === "number" && Number.isFinite(value)

const hasPersistedScore = (drafts: PersistedResultDrafts, matchId: number, slot: string) => {
  const score = drafts[`${matchId}:${slot}`]?.score
  if (score === undefined || score === null || score === "") return false
  const parsed = Number(score)
  return Number.isFinite(parsed) && parsed >= 0
}

const getPersistedWon = (drafts: PersistedResultDrafts, matchId: number, slot: string) => {
  const result = drafts[`${matchId}:${slot}`]?.result
  if (result === "won") return true
  if (result === "lost") return false
  return null
}

const isMatchCompleteForWorkflow = (
  match: MatchResponse,
  drafts: PersistedResultDrafts,
  teamsById: Map<number, SimpleTeamResponse>,
  format: FormatOption,
) => {
  const teamSlots = [
    { slot: "team1", team: match.team1, score: match.team1Score },
    { slot: "team2", team: match.team2, score: match.team2Score },
    { slot: "team3", team: match.team3, score: match.team3Score },
    { slot: "team4", team: match.team4, score: match.team4Score },
  ] as const

  const scoreSlots: { slot: string; fallbackSlot?: ResultScoreSlot; score?: number | null }[] = []
  const teamResultValues: Array<boolean | null> = []
  teamSlots.forEach(({ slot, team, score }) => {
    if (!team) return
    const currentWon = resolveTeamCurrentWon(match, slot, team.id)
    const persistedWon = getPersistedWon(drafts, match.id, slot)
    teamResultValues.push(typeof currentWon === "boolean" ? currentWon : persistedWon)

    const members = getTeamMembers(team, teamsById)
    if (!members.length) {
      scoreSlots.push({ slot, score })
      return
    }

    members.forEach((member, index) => {
      scoreSlots.push({
        slot: participantScoreSlot(slot, member.id),
        fallbackSlot: slot,
        score: resolveParticipantCurrentScore(match, slot, team.id, member.id, index),
      })
    })
  })
  if (match.debater1) scoreSlots.push({ slot: "debater1", score: match.debater1Score })
  if (match.debater2) scoreSlots.push({ slot: "debater2", score: match.debater2Score })

  const hasValidTeamResults = (() => {
    if (teamResultValues.length === 0) return true

    const isBpfMatch = format === "BPF" || teamResultValues.length >= 4
    const requiredTeamCount = isBpfMatch ? 4 : 2
    const requiredWinnerCount = isBpfMatch ? 2 : 1

    return (
      teamResultValues.length === requiredTeamCount &&
      teamResultValues.every((won) => typeof won === "boolean") &&
      teamResultValues.filter(Boolean).length === requiredWinnerCount
    )
  })()

  return (
    scoreSlots.length > 0 &&
    hasValidTeamResults &&
    scoreSlots.every(({ slot, fallbackSlot, score }) => {
      if (hasNumericScore(score) || hasPersistedScore(drafts, match.id, slot)) return true
      return fallbackSlot ? hasPersistedScore(drafts, match.id, fallbackSlot) : false
    })
  )
}

export function PairingsSection({
  matches,
  rounds,
  teams,
  judges,
  matchesLoading,
  matchesError,
  selectedStage,
  selectedRound,
  selectedRoundNumber,
  currentRoundNumber,
  onSelectStage,
  onSelectRound,
  onProceedToNextRound,
  onRandomizePairings,
  onSubmitPairings,
  onClearMatches,
  stageFormats,
  onUpdateMatchRoom,
  onUpdateMatch,
  savingMatchId,
  resultStorageKey,
}: PairingsSectionProps) {
  const [deleteConfirmStage, setDeleteConfirmStage] = useState<StageId | null>(null)
  const [roomDrafts, setRoomDrafts] = useState<Record<number, string>>({})
  const [persistedResultDrafts, setPersistedResultDrafts] = useState<PersistedResultDrafts>({})
  const [editingMatch, setEditingMatch] = useState<MatchResponse | null>(null)
  const [matchDraft, setMatchDraft] = useState<MatchDraft>({
    location: "",
    judgeId: "",
    team1Id: "",
    team2Id: "",
    team3Id: "",
    team4Id: "",
  })
  const [matchEditError, setMatchEditError] = useState<string | null>(null)
  const matchRows = matches?.content ?? []
  const configuredStageFormats = useMemo<Record<StageId, FormatOption>>(() => ({
    ...DEFAULT_STAGE_FORMATS,
    ...stageFormats,
  }), [stageFormats])
  const selectedStageFormat = configuredStageFormats[selectedStage]
  const teamsById = useMemo(() => {
    return new Map((teams?.content ?? []).map((team) => [team.id, team]))
  }, [teams?.content])
  const hasRoundProgress =
    typeof selectedRoundNumber === "number" &&
    typeof currentRoundNumber === "number"
  const isFutureRound = hasRoundProgress && selectedRoundNumber > currentRoundNumber
  const isPastRound = hasRoundProgress && selectedRoundNumber < currentRoundNumber
  const isCurrentRound = !hasRoundProgress || selectedRoundNumber === currentRoundNumber
  const isEditableRound = isCurrentRound && !isFutureRound && !isPastRound
  const completedMatches = matchRows.filter((match) =>
    isMatchCompleteForWorkflow(match, persistedResultDrafts, teamsById, selectedStageFormat)
  ).length
  const hasMatches = matchRows.length > 0
  const allMatchesCompleted = hasMatches && completedMatches === matchRows.length
  const canEditMatches = Boolean(onUpdateMatch) && isEditableRound
  const canUpdateRooms = Boolean(onUpdateMatchRoom) && isEditableRound
  const canRandomizeSelectedRound = Boolean(onRandomizePairings) && isEditableRound
  const canPublishSelectedRound = Boolean(onSubmitPairings) && isEditableRound && hasMatches
  const canProceedToNextRound = Boolean(onProceedToNextRound) && isCurrentRound && allMatchesCompleted
  const tableColumnCount = canEditMatches ? 5 : 4
  const roundLabels = rounds?.length
    ? rounds.map((round) => round.name)
    : selectedStage === "preliminary"
      ? [...STANDARD_ROUNDS, ...ELIMINATION_ROUNDS]
      : [...ELIMINATION_ROUNDS, ...STANDARD_ROUNDS]

  const currentRoundLabel =
    typeof currentRoundNumber === "number" ? `Round ${currentRoundNumber}` : "the current round"
  const selectedRoundLabel =
    typeof selectedRoundNumber === "number" ? `Round ${selectedRoundNumber}` : selectedRound

  const workflowMessage = (() => {
    if (isFutureRound) {
      return `${selectedRoundLabel} is locked until ${currentRoundLabel} is completed and advanced.`
    }

    if (isPastRound) {
      return `${selectedRoundLabel} is not the active round anymore. Review it here, but manage pairings on ${currentRoundLabel}.`
    }

    if (matchesLoading || matchesError) return null

    if (!hasMatches) {
      return `No pairings yet for ${selectedRound}. Randomize teams, adjust rooms and judges, then publish pairings.`
    }

    if (!allMatchesCompleted) {
      return `Enter results for all matches before proceeding. Completed ${completedMatches} of ${matchRows.length} matches.`
    }

    return "All matches in this round are completed. You can proceed to the next round."
  })()

  const handleSelectStage = (stage: StageId) => {
    onSelectStage(stage)
    onSelectRound(DEFAULT_ROUND_BY_STAGE[stage])
  }

  const handleSelectRound = (round: string) => {
    const isStandardRound = STANDARD_ROUNDS.includes(round as (typeof STANDARD_ROUNDS)[number])
    onSelectRound(round)

    if (isStandardRound) {
      onSelectStage("preliminary")
      return
    }

    if (selectedStage === "preliminary") {
      onSelectStage("team")
    }
  }

  useEffect(() => {
    setRoomDrafts(() => {
      const next: Record<number, string> = {}

      matches?.content.forEach((match) => {
        next[match.id] = match.location ?? ""
      })

      return next
    })
  }, [matches])

  useEffect(() => {
    const refreshPersistedResultDrafts = () => {
      setPersistedResultDrafts(readPersistedResultDrafts(resultStorageKey))
    }
    const handleResultDraftsChanged = (event: Event) => {
      const changedStorageKey =
        event instanceof CustomEvent && typeof event.detail?.storageKey === "string"
          ? event.detail.storageKey
          : event instanceof StorageEvent
            ? event.key
            : null

      if (changedStorageKey && changedStorageKey !== resultStorageKey) return
      refreshPersistedResultDrafts()
    }

    refreshPersistedResultDrafts()
    window.addEventListener(RESULT_DRAFTS_CHANGED_EVENT, handleResultDraftsChanged)
    window.addEventListener("storage", handleResultDraftsChanged)
    return () => {
      window.removeEventListener(RESULT_DRAFTS_CHANGED_EVENT, handleResultDraftsChanged)
      window.removeEventListener("storage", handleResultDraftsChanged)
    }
  }, [matches, resultStorageKey])

  const renderRoomCell = (match: MatchResponse) => {
    if (!canUpdateRooms) {
      return <td className="px-6 py-4 text-sm text-[#7A83A0]">{match.location ?? "-"}</td>
    }

    const draft = roomDrafts[match.id] ?? match.location ?? ""
    const currentRoom = match.location ?? ""
    const isSaving = savingMatchId === match.id
    const isDirty = draft.trim() !== currentRoom.trim()

    return (
      <td className="px-6 py-3">
        <div className="flex min-w-48 items-center gap-2">
          <input
            type="text"
            value={draft}
            aria-label={`Room for match ${match.id}`}
            placeholder="Room"
            disabled={isSaving}
            onChange={(event) => {
              const value = event.target.value
              setRoomDrafts((current) => ({ ...current, [match.id]: value }))
            }}
            className="h-10 w-full rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none transition focus:border-[#2B3F63] disabled:bg-[#F5F7FC]"
          />
          <button
            type="button"
            aria-label={`Save room for match ${match.id}`}
            disabled={!isDirty || isSaving}
            onClick={() => onUpdateMatchRoom?.(match.id, draft)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B1327] text-white transition hover:bg-[#050918] disabled:cursor-not-allowed disabled:bg-[#D5D9E7]"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </td>
    )
  }

  const openMatchEditor = (match: MatchResponse) => {
    setEditingMatch(match)
    setMatchDraft({
      location: match.location ?? "",
      judgeId: toSelectValue(match.judge?.id),
      team1Id: toSelectValue(match.team1?.id),
      team2Id: toSelectValue(match.team2?.id),
      team3Id: toSelectValue(match.team3?.id),
      team4Id: toSelectValue(match.team4?.id),
    })
    setMatchEditError(null)
  }

  const setDraftField = (field: keyof MatchDraft, value: string) => {
    setMatchDraft((current) => ({ ...current, [field]: value }))
  }

  const shouldShowFourTeamSlots = Boolean(
    editingMatch && (
      selectedStageFormat === "BPF" ||
      editingMatch.team3 ||
      editingMatch.team4
    )
  )

  const handleSaveMatchDraft = async () => {
    if (!editingMatch || !onUpdateMatch) return

    const selectedTeamIds = [
      matchDraft.team1Id,
      matchDraft.team2Id,
      shouldShowFourTeamSlots ? matchDraft.team3Id : "",
      shouldShowFourTeamSlots ? matchDraft.team4Id : "",
    ].filter(Boolean)

    if (new Set(selectedTeamIds).size !== selectedTeamIds.length) {
      setMatchEditError("A team can only appear once in the same match.")
      return
    }

    const requiredTeamCount = shouldShowFourTeamSlots ? 4 : selectedStage === "solo" ? 0 : 2
    if (requiredTeamCount > 0 && selectedTeamIds.length !== requiredTeamCount) {
      setMatchEditError(
        shouldShowFourTeamSlots
          ? "BPF matches require exactly four teams."
          : "APF matches require exactly two teams."
      )
      return
    }

    const payload: MatchUpdateRequest = {
      location: matchDraft.location.trim() || null,
      judgeId: toOptionalId(matchDraft.judgeId),
      team1Id: toOptionalId(matchDraft.team1Id),
      team2Id: toOptionalId(matchDraft.team2Id),
    }

    if (shouldShowFourTeamSlots) {
      payload.team3Id = toOptionalId(matchDraft.team3Id)
      payload.team4Id = toOptionalId(matchDraft.team4Id)
    }

    await onUpdateMatch(editingMatch.id, payload)
    setEditingMatch(null)
  }

  const renderRows = () => {
    if (matchesLoading) {
      return (
        <tr>
          <td colSpan={tableColumnCount} className="px-6 py-10 text-center text-[#7A83A0]">
            Loading matches...
          </td>
        </tr>
      )
    }

    if (matchesError) {
      return (
        <tr>
          <td colSpan={tableColumnCount} className="px-6 py-10 text-center text-red-500">
            Failed to load matches
          </td>
        </tr>
      )
    }

    if (!matches || matchRows.length === 0) {
      return (
        <tr>
          <td colSpan={tableColumnCount} className="px-6 py-10 text-center text-[#7A83A0]">
            {isFutureRound
              ? `${selectedRound} will unlock after ${currentRoundLabel} is completed.`
              : `No pairings yet for ${selectedRound}`}
          </td>
        </tr>
      )
    }

    return matchRows.map((match) => (
      <tr key={match.id} className="border-b border-[#E2E6F2] last:border-none">
        <td className="px-6 py-4 text-lg font-semibold text-[#0B1327]">{match.team1?.name ?? "-"}</td>
        <td className="px-6 py-4 text-lg font-semibold text-[#0B1327]">{match.team2?.name ?? "-"}</td>
        {renderRoomCell(match)}
        <td className="px-6 py-4 text-sm text-[#7A83A0]">{match.judge?.fullName ?? "-"}</td>
        {canEditMatches ? (
          <td className="px-6 py-4 text-right">
            <button
              type="button"
              onClick={() => openMatchEditor(match)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D5D9E7] text-[#0B1327] transition hover:bg-[#F5F7FC]"
              aria-label={`Edit match ${match.id}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </td>
        ) : null}
      </tr>
    ))
  }

  return (
    <section className="rounded-3xl border border-[#E2E6F2] bg-white text-[#050A18] shadow-[0_20px_50px_rgba(12,21,44,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E6F2] px-6 py-4">
        <nav className="flex flex-wrap gap-2">
          {STAGE_TABS.map((tab) => {
            const isActive = selectedStage === tab.id
            return (
              <div
                key={tab.id}
                className={`flex items-center gap-2 rounded-2xl text-sm font-semibold transition-colors ${
                  isActive ? "bg-[#0B1327] text-white" : "border border-[#D5D9E7] text-[#0B1327] hover:bg-[#F5F7FC]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectStage(tab.id)}
                  className="px-4 py-2"
                >
                  {tab.label} ({configuredStageFormats[tab.id]})
                </button>
                {isActive && (
                  <div className="relative flex items-center gap-2 pr-3 text-white/80">
                    <span className="h-5 w-px bg-white/30" aria-hidden="true" />
                    <button
                      type="button"
                      className="rounded-full border border-white/30 p-1 transition hover:border-white/60 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!onClearMatches}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (!onClearMatches) return
                        setDeleteConfirmStage(tab.id)
                      }}
                      aria-label="Clear matches"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </header>
      <Dialog open={Boolean(deleteConfirmStage)} onOpenChange={(open) => !open && setDeleteConfirmStage(null)}>
        <DialogContent className="rounded-3xl border border-[#E2E6F2] bg-white p-10 shadow-[0_20px_70px_rgba(6,14,39,0.25)] sm:max-w-md">
          <DialogTitle className="text-center text-lg font-semibold text-[#0B1327]">
            {deleteConfirmStage
              ? `Are you sure you want to delete the pairings for ${STAGE_TABS.find((tab) => tab.id === deleteConfirmStage)?.label ?? "this round"}?`
              : ""}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirm deleting the current pairings before the action is sent to the backend.
          </DialogDescription>
          <DialogFooter className="mt-6 flex w-full flex-row gap-4 px-6">
            <button
              type="button"
              className="flex-1 rounded-2xl border border-[#0B1327] px-6 py-3 text-sm font-semibold text-[#4A5A7A] transition hover:bg-[#EEF2FB]"
              onClick={() => setDeleteConfirmStage(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!onClearMatches}
              className="flex-1 rounded-2xl bg-[#2B3F63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E2D48] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (deleteConfirmStage) {
                  onClearMatches?.(deleteConfirmStage)
                }
                setDeleteConfirmStage(null)
              }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editingMatch)} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent className="rounded-3xl border border-[#E2E6F2] bg-white p-8 shadow-[0_20px_70px_rgba(6,14,39,0.25)] sm:max-w-2xl">
          <DialogTitle className="text-xl font-semibold text-[#0B1327]">
            {editingMatch ? `Edit match ${editingMatch.id}` : "Edit match"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Update teams, room, and judge after randomizing pairings.
          </DialogDescription>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
              Team 1
              <select
                value={matchDraft.team1Id}
                onChange={(event) => setDraftField("team1Id", event.target.value)}
                className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                aria-label="Team 1"
              >
                <option value="">Unassigned</option>
                {teams?.content.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
              Team 2
              <select
                value={matchDraft.team2Id}
                onChange={(event) => setDraftField("team2Id", event.target.value)}
                className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                aria-label="Team 2"
              >
                <option value="">Unassigned</option>
                {teams?.content.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>

            {shouldShowFourTeamSlots ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  Team 3
                  <select
                    value={matchDraft.team3Id}
                    onChange={(event) => setDraftField("team3Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label="Team 3"
                  >
                    <option value="">Unassigned</option>
                    {teams?.content.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  Team 4
                  <select
                    value={matchDraft.team4Id}
                    onChange={(event) => setDraftField("team4Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label="Team 4"
                  >
                    <option value="">Unassigned</option>
                    {teams?.content.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
              Room
              <input
                type="text"
                value={matchDraft.location}
                onChange={(event) => setDraftField("location", event.target.value)}
                placeholder="Room"
                className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                aria-label="Match room"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
              Judge
              <select
                value={matchDraft.judgeId}
                onChange={(event) => setDraftField("judgeId", event.target.value)}
                className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                aria-label="Judge"
              >
                <option value="">Unassigned</option>
                {judges?.content.map((judge) => (
                  <option key={judge.id} value={judge.id}>{judge.fullName}</option>
                ))}
              </select>
            </label>
          </div>

          {matchEditError ? <p className="text-sm text-red-500">{matchEditError}</p> : null}

          <DialogFooter className="mt-2 flex w-full flex-row gap-4">
            <button
              type="button"
              className="flex-1 rounded-2xl border border-[#0B1327] px-6 py-3 text-sm font-semibold text-[#4A5A7A] transition hover:bg-[#EEF2FB]"
              onClick={() => setEditingMatch(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!onUpdateMatch || (editingMatch ? savingMatchId === editingMatch.id : false)}
              className="flex-1 rounded-2xl bg-[#2B3F63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E2D48] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSaveMatchDraft}
            >
              {editingMatch && savingMatchId === editingMatch.id ? "Saving..." : "Save match"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#0B1327] text-xs uppercase tracking-[0.08em] text-white/70">
              <th className="px-6 py-4">Fraction 1</th>
              <th className="px-6 py-4">Fraction 2</th>
              <th className="px-6 py-4">Room</th>
              <th className="px-6 py-4">Judge Name</th>
              {canEditMatches ? <th className="px-6 py-4 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 text-[#0B1327]">
        <div className="flex max-w-2xl flex-col gap-2">
          <button
            type="button"
            className="w-fit rounded-lg border border-[#D5D9E7] px-6 py-3 text-sm font-semibold text-[#0B1327] transition hover:bg-[#F5F7FC] disabled:cursor-not-allowed disabled:text-[#9AA1B9] disabled:opacity-60"
            disabled={!canProceedToNextRound}
            onClick={onProceedToNextRound}
          >
            Proceed to next round
          </button>
          {workflowMessage ? (
            <p className="text-sm text-[#6C738A]" role="status">
              {workflowMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canRandomizeSelectedRound}
            onClick={onRandomizePairings}
            className="rounded-2xl border border-[#D5D9E7] px-6 py-3 text-sm font-semibold text-[#0B1327] hover:bg-[#F5F7FC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Randomize
          </button>
          <button
            type="button"
            disabled={!canPublishSelectedRound}
            onClick={onSubmitPairings}
            className="rounded-2xl bg-[#0B1327] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#050918] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Publish pairings
          </button>
        </div>
      </div>

      <div className="rounded-b-3xl border-t border-white/5 bg-[#040814] px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {roundLabels.map((round) => (
            <button
              key={round}
              type="button"
              onClick={() => handleSelectRound(round)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                selectedRound === round ? "bg-white text-[#050A18]" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {round}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
