"use client"

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import type { PageResult } from "@/types/page"
import type { MatchResponse, MatchResultRequest } from "@/types/tournament/match"
import type { SimpleRoundResponse } from "@/types/tournament/round/round"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import { RoundGroupType } from "@/types/tournament/round/round-group"
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
  resolveDebaterCurrentWon,
  resolveParticipantCurrentScore,
  resolveTeamCurrentWon,
  type DebaterSlotName,
  type TeamSlotName,
} from "@/lib/match-result-slots"
import { useActionFeedback } from "@/components/tournament/useActionFeedback"
import { displayRoundLabel } from "@/lib/round-label"
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"

interface ResultsSectionProps {
  selectedResultsOption: string
  resultsSubTab: "Speaker Score" | "Results"
  onResultsSubTabChange: (tab: "Speaker Score" | "Results") => void
  bpfSubTab: string
  activeResultsSection: string
  onActiveResultsSectionChange: (section: string) => void
  selectedRound: string
  onSelectedRoundChange: (round: string) => void
  roundGroupType?: RoundGroupType
  rounds?: SimpleRoundResponse[]
  eliminationRounds?: SimpleRoundResponse[]
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

const KNOWN_ELIMINATION_ROUND_LABELS = ["1/16", "1/8", "1/4", "1/2", "Final"] as const
type ScoreSlotName = string
type OutcomeSlotName = TeamSlotName | DebaterSlotName

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
  currentWon?: boolean | null
}

type ResultSlot = TeamResultSlot | DebaterResultSlot
type ScoreSlot = SpeakerScoreSlot | DebaterResultSlot
type PreliminaryRoundMatches = {
  round: SimpleRoundResponse
  matches: PageResult<MatchResponse>
}
type ResultsView = "entry" | "standings" | "speaker-details" | "win-count"

const RESULTS_VIEW_OPTIONS: ReadonlyArray<{ id: ResultsView; key: string }> = [
  { id: "entry", key: "viewEntry" },
  { id: "standings", key: "viewStandings" },
  { id: "speaker-details", key: "viewSpeakerDetails" },
  { id: "win-count", key: "viewWinCount" },
]

const catalog: TranslationCatalog = {
  en: {
    viewEntry: "Round entry", viewStandings: "Preliminary standings", viewSpeakerDetails: "Speaker details", viewWinCount: "Win count by round",
    round: "Round {number}", round16: "1/16", round8: "1/8", round4: "1/4", round2: "1/2", finalRound: "Final", resultsWord: "results", andSpeakerPoints: " and speaker points", selectResultsRound: "Select results round", selectResultsView: "Select results view",
    match: "Match", side: "Side", result: "Result", speakerPoints: "Speaker points", room: "Room", judge: "Judge", status: "Status",
    loadingTeams: "Loading teams...", failedTeams: "Failed to load teams", noTeams: "No teams found", loadingMatches: "Loading matches...", failedMatches: "Failed to load matches", noMatches: "No matches for this round", noSides: "No sides assigned", noParticipants: "No participants assigned", noMatchesScheduled: "No matches scheduled for this round",
    preliminaryStandings: "Preliminary standings", speakerDetails: "Speaker details", winCountByRound: "Win count by round", noPreliminaryRounds: "No preliminary rounds loaded yet.", noPreliminaryTeamResults: "No preliminary team results yet.", noPreliminarySpeakerPoints: "No preliminary speaker points yet.",
    fractionName: "Fraction Name", speaker: "Speaker", overall: "Overall", selectionResult: "Selection result", overallSelectionResult: "Overall selection result", number: "№", winCount: "Win count", judgeName: "Judge Name", actions: "Actions", fraction1: "Fraction 1", fraction2: "Fraction 2", winner: "Winner", submit: "Submit", deleteTeam: "Delete team {name}", resultsTab: "{format} Results", speakerScoreTab: "{format} Speaker Score",
    winnerMark: "winner", notWinnerMark: "not winner", markWinner: "Mark {name} as winner in match {id}", markNotWinner: "Mark {name} as not winner in match {id}", win: "Win", lose: "Lose", open: "Open", completed: "Completed", needsCorrection: "Needs correction", needsCorrectionNotRepairable: "Needs correction (not repairable)", speakerLabel: "Speaker {number}", debaterLabel: "Debater {id}", matchLabel: "Match {id}", roundLabel: "Round {number}",
    resultForMatch: "Result for {name} in match {id}", speakerPointsForMatch: "Speaker points for {name} in match {id}", submitted: "✓ Submitted", submitting: "Submitting...", submitResults: "Submit results", noOpenMatches: "There are no open matches to submit.", currentRoundOnly: "Only the current round or incomplete past results can be submitted.", addParticipants: "Add participants to every team before submitting speaker points.", ldRequirement: "LD matches need one winner and one loser.", apfBpfRequirement: "APF matches need one winner; BPF matches need two winners.", everySpeakerPoints: "Every speaker also needs points.",
    correctionParticipant: "{count} completed matches have nonrepairable participant scores and cannot be submitted.", correctionParticipantSingle: "This completed match has nonrepairable participant scores and cannot be submitted.", correctionOutcome: "{count} completed matches have an invalid outcome and cannot be submitted.", correctionOutcomeSingle: "This completed match has an invalid outcome and cannot be submitted.", readyMatches: "{ready} of {total} {matchWord} ready to submit", pendingMatches: ". {count} still need {requirement}.", requirementResultPoints: "a result and speaker points", requirementWinLose: "a Win/Lose result", period: ".",
  },
  ru: {
    viewEntry: "Ввод результатов", viewStandings: "Предварительный рейтинг", viewSpeakerDetails: "Данные спикеров", viewWinCount: "Количество побед по раундам",
    round: "Раунд {number}", round16: "1/16", round8: "1/8", round4: "1/4", round2: "1/2", finalRound: "Финал", resultsWord: "результаты", andSpeakerPoints: " и баллы спикеров", selectResultsRound: "Выбор раунда результатов", selectResultsView: "Выбор представления результатов",
    match: "Матч", side: "Сторона", result: "Результат", speakerPoints: "Баллы спикеров", room: "Аудитория", judge: "Судья", status: "Статус",
    loadingTeams: "Загрузка команд...", failedTeams: "Не удалось загрузить команды", noTeams: "Команды не найдены", loadingMatches: "Загрузка матчей...", failedMatches: "Не удалось загрузить матчи", noMatches: "В этом раунде нет матчей", noSides: "Стороны не назначены", noParticipants: "Участники не назначены", noMatchesScheduled: "На этот раунд матчи не запланированы",
    preliminaryStandings: "Предварительный рейтинг", speakerDetails: "Данные спикеров", winCountByRound: "Количество побед по раундам", noPreliminaryRounds: "Предварительные раунды ещё не загружены.", noPreliminaryTeamResults: "Результатов предварительных раундов ещё нет.", noPreliminarySpeakerPoints: "Баллы спикеров за предварительные раунды ещё не внесены.",
    fractionName: "Название фракции", speaker: "Спикер", overall: "Итого", selectionResult: "Результат отбора", overallSelectionResult: "Общий результат отбора", number: "№", winCount: "Количество побед", judgeName: "Имя судьи", actions: "Действия", fraction1: "Фракция 1", fraction2: "Фракция 2", winner: "Победитель", submit: "Отправить", deleteTeam: "Удалить команду {name}", resultsTab: "Результаты {format}", speakerScoreTab: "Баллы спикеров {format}",
    winnerMark: "победителем", notWinnerMark: "не победителем", markWinner: "Отметить {name} победителем в матче {id}", markNotWinner: "Отметить {name} не победителем в матче {id}", win: "Победа", lose: "Поражение", open: "Открыт", completed: "Завершён", needsCorrection: "Требует исправления", needsCorrectionNotRepairable: "Требует исправления (восстановление невозможно)", speakerLabel: "Спикер {number}", debaterLabel: "Дебатёр {id}", matchLabel: "Матч {id}", roundLabel: "Раунд {number}",
    resultForMatch: "Результат {name} в матче {id}", speakerPointsForMatch: "Баллы спикера {name} в матче {id}", submitted: "✓ Отправлено", submitting: "Отправка...", submitResults: "Отправить результаты", noOpenMatches: "Нет открытых матчей для отправки.", currentRoundOnly: "Можно отправлять только результаты текущего раунда или незавершённых прошлых результатов.", addParticipants: "Добавьте участников во все команды перед отправкой баллов спикеров.", ldRequirement: "В матчах LD нужен один победитель и один проигравший.", apfBpfRequirement: "В матчах APF нужен один победитель, а в BPF — два.", everySpeakerPoints: "Каждому спикеру также нужны баллы.",
    correctionParticipant: "У {count} завершённых матчей невосстанавливаемые баллы участников, поэтому их нельзя отправить.", correctionParticipantSingle: "У этого завершённого матча невосстанавливаемые баллы участников, поэтому его нельзя отправить.", correctionOutcome: "У {count} завершённых матчей некорректный исход, поэтому их нельзя отправить.", correctionOutcomeSingle: "У этого завершённого матча некорректный исход, поэтому его нельзя отправить.", readyMatches: "Готово к отправке: {ready} из {total} {matchWord}", pendingMatches: ". Ещё {count} требуют: {requirement}.", requirementResultPoints: "результат и баллы спикеров", requirementWinLose: "результат «Победа/Поражение»", period: ".",
  },
  kk: {
    viewEntry: "Раунд нәтижелерін енгізу", viewStandings: "Алдын ала рейтинг", viewSpeakerDetails: "Спикерлер деректері", viewWinCount: "Раундтар бойынша жеңіс саны",
    round: "{number}-раунд", round16: "1/16", round8: "1/8", round4: "1/4", round2: "1/2", finalRound: "Финал", resultsWord: "нәтижелері", andSpeakerPoints: " және спикер ұпайлары", selectResultsRound: "Нәтиже раундын таңдау", selectResultsView: "Нәтиже көрінісін таңдау",
    match: "Матч", side: "Тарап", result: "Нәтиже", speakerPoints: "Спикер ұпайлары", room: "Аудитория", judge: "Төреші", status: "Мәртебе",
    loadingTeams: "Командалар жүктелуде...", failedTeams: "Командаларды жүктеу мүмкін болмады", noTeams: "Командалар табылмады", loadingMatches: "Матчтар жүктелуде...", failedMatches: "Матчтарды жүктеу мүмкін болмады", noMatches: "Бұл раундта матчтар жоқ", noSides: "Тараптар тағайындалмаған", noParticipants: "Қатысушылар тағайындалмаған", noMatchesScheduled: "Бұл раундқа матчтар жоспарланбаған",
    preliminaryStandings: "Алдын ала рейтинг", speakerDetails: "Спикерлер деректері", winCountByRound: "Раундтар бойынша жеңіс саны", noPreliminaryRounds: "Алдын ала раундтар әлі жүктелмеген.", noPreliminaryTeamResults: "Алдын ала командалық нәтижелер әлі жоқ.", noPreliminarySpeakerPoints: "Алдын ала спикер ұпайлары әлі жоқ.",
    fractionName: "Фракция атауы", speaker: "Спикер", overall: "Жалпы", selectionResult: "Іріктеу нәтижесі", overallSelectionResult: "Жалпы іріктеу нәтижесі", number: "№", winCount: "Жеңіс саны", judgeName: "Төрешінің аты", actions: "Әрекеттер", fraction1: "1-фракция", fraction2: "2-фракция", winner: "Жеңімпаз", submit: "Жіберу", deleteTeam: "{name} командасын жою", resultsTab: "{format} нәтижелері", speakerScoreTab: "{format} спикер ұпайлары",
    winnerMark: "жеңімпаз", notWinnerMark: "жеңімпаз емес", markWinner: "{id}-матчта {name} жеңімпаз деп белгілеу", markNotWinner: "{id}-матчта {name} жеңімпаз емес деп белгілеу", win: "Жеңіс", lose: "Жеңіліс", open: "Ашық", completed: "Аяқталды", needsCorrection: "Түзету қажет", needsCorrectionNotRepairable: "Түзету қажет (қалпына келмейді)", speakerLabel: "{number}-спикер", debaterLabel: "{id}-дебатёр", matchLabel: "{id}-матч", roundLabel: "{number}-раунд",
    resultForMatch: "{id}-матчтағы {name} нәтижесі", speakerPointsForMatch: "{id}-матчтағы {name} спикер ұпайлары", submitted: "✓ Жіберілді", submitting: "Жіберілуде...", submitResults: "Нәтижелерді жіберу", noOpenMatches: "Жіберуге ашық матчтар жоқ.", currentRoundOnly: "Тек ағымдағы раундтың немесе аяқталмаған өткен нәтижелерді жіберуге болады.", addParticipants: "Спикер ұпайларын жібермес бұрын әр командаға қатысушыларды қосыңыз.", ldRequirement: "LD матчында бір жеңімпаз және бір жеңілген болуы керек.", apfBpfRequirement: "APF матчында бір, BPF матчында екі жеңімпаз болуы керек.", everySpeakerPoints: "Әр спикерге ұпай қажет.",
    correctionParticipant: "{count} аяқталған матчта қалпына келмейтін қатысушы ұпайлары бар, сондықтан жіберу мүмкін емес.", correctionParticipantSingle: "Бұл аяқталған матчта қалпына келмейтін қатысушы ұпайлары бар, сондықтан жіберу мүмкін емес.", correctionOutcome: "{count} аяқталған матчта қате нәтиже бар, сондықтан жіберу мүмкін емес.", correctionOutcomeSingle: "Бұл аяқталған матчта қате нәтиже бар, сондықтан жіберу мүмкін емес.", readyMatches: "Жіберуге дайын: {ready}/{total} {matchWord}", pendingMatches: ". Тағы {count} матчқа {requirement} қажет.", requirementResultPoints: "нәтиже және спикер ұпайлары", requirementWinLose: "«Жеңіс/Жеңіліс» нәтижесі", period: ".",
  },
}

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
  roundGroupType,
  rounds,
  eliminationRounds,
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
  const { locale } = useLocale()
  const t = useTranslations(catalog)
  const getLocalizedRoundLabel = (round: string) => {
    const normalized = displayRoundLabel(round)
    const key = normalized === "1/16" ? "round16" : normalized === "1/8" ? "round8" : normalized === "1/4" ? "round4" : normalized === "1/2" ? "round2" : normalized === "Final" ? "finalRound" : null
    return key ? t(key) : normalized
  }
  const isOutcomeOnlyStage =
    roundGroupType === RoundGroupType.TEAM_ELIMINATION ||
    roundGroupType === RoundGroupType.SOLO_ELIMINATION
  const requiresSpeakerPoints = !isOutcomeOnlyStage
  const isSoloElimination = roundGroupType === RoundGroupType.SOLO_ELIMINATION
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
  const configuredEliminationRounds = useMemo(() => {
    if (eliminationRounds) {
      return [...eliminationRounds].sort((a, b) => a.roundNumber - b.roundNumber)
    }
    if (
      roundGroupType === RoundGroupType.TEAM_ELIMINATION ||
      roundGroupType === RoundGroupType.SOLO_ELIMINATION
    ) {
      return [...(rounds ?? [])].sort((a, b) => a.roundNumber - b.roundNumber)
    }

    // Keep the component backwards-compatible for callers that pass only a
    // round list. The page supplies an explicit elimination list, so this
    // fallback can never mix preliminary rounds into the live navigation.
    return (rounds ?? [])
      .filter((round) =>
        KNOWN_ELIMINATION_ROUND_LABELS.includes(displayRoundLabel(round.name) as (typeof KNOWN_ELIMINATION_ROUND_LABELS)[number]),
      )
      .sort((a, b) => a.roundNumber - b.roundNumber)
  }, [eliminationRounds, roundGroupType, rounds])
  const effectiveSelectedRound = useMemo(() => {
    const matchingRound = roundOptions.find(
      (round) => displayRoundLabel(round) === displayRoundLabel(selectedRound),
    )
    return matchingRound ?? roundOptions[0] ?? selectedRound
  }, [roundOptions, selectedRound])

  const hasRoundProgress =
    typeof selectedRoundNumber === "number" &&
    typeof currentRoundNumber === "number"
  const hasOpenMatchesInSelectedRound = matchRows.some((match) =>
    !match.completed && Boolean(match.team1 || match.team2 || match.team3 || match.team4 || match.debater1 || match.debater2),
  )
  const canEditSelectedRound =
    !hasRoundProgress ||
    selectedRoundNumber === currentRoundNumber ||
    hasOpenMatchesInSelectedRound

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
          name: getParticipantName(member, t("speakerLabel", { number: index + 1 })),
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
        name: getParticipantName(debater, t("debaterLabel", { id: debater.id })),
        currentScore: score,
        currentWon: resolveDebaterCurrentWon(match, slot, debater.id),
      })
    })

    return slots
  }, [t, teamsById])

  const scoreKey = useCallback(
    (matchId: number, slot: ScoreSlotName) => `${matchId}:${slot}`,
    []
  )

  const getScoreSlots = useCallback((match: MatchResponse): ScoreSlot[] => {
    return getResultSlots(match).flatMap((slot): ScoreSlot[] => slot.kind === "team" ? slot.speakers : [slot])
  }, [getResultSlots])

  const getDebaterResult = (match: MatchResponse, slot: DebaterSlotName) => {
    const debaterSlots = getResultSlots(match).filter(
      (resultSlot): resultSlot is DebaterResultSlot => resultSlot.kind === "debater",
    )
    const currentSlot = debaterSlots.find((resultSlot) => resultSlot.slot === slot)
    const opponentSlot = debaterSlots.find((resultSlot) => resultSlot.slot !== slot)
    if (!currentSlot || !opponentSlot) return null

    const resolveScore = (resultSlot: DebaterResultSlot) => {
      const draft = scoreDrafts[scoreKey(match.id, resultSlot.slot)]
      return isValidScoreValue(draft) ? Number(draft) : resultSlot.currentScore
    }
    const currentScore = resolveScore(currentSlot)
    const opponentScore = resolveScore(opponentSlot)
    if (typeof currentScore !== "number" || typeof opponentScore !== "number" || currentScore === opponentScore) return null
    return currentScore > opponentScore ? t("win") : t("lose")
  }

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

  const hasValidDebaterResultSet = useCallback((results: ResultDraftValue[]) => {
    return (
      results.length === 2 &&
      results.every(isCompleteResultValue) &&
      results.filter((result) => result === "won").length === 1
    )
  }, [])

  const hasCompletePersistedResult = useCallback((match: MatchResponse, drafts: PersistedResultDrafts) => {
    const slots = getResultSlots(match)
    const teamSlots = slots.filter((slot): slot is TeamResultSlot => slot.kind === "team")
    const debaterSlots = slots.filter((slot): slot is DebaterResultSlot => slot.kind === "debater")

    if (teamSlots.length > 0) {
      const results = teamSlots.map((slot) => getPersistedResult(drafts, match.id, slot.slot))
      if (!hasValidTeamResultSet(teamSlots.length, results)) return false
      if (!requiresSpeakerPoints) return true

      return teamSlots.every((slot) =>
        slot.speakers.length > 0 &&
        slot.speakers.every((speaker) => hasPersistedScore(drafts, match.id, speaker))
      )
    }

    if (!requiresSpeakerPoints) {
      return hasValidDebaterResultSet(
        debaterSlots.map((slot) => toResultDraftValue(drafts[scoreKey(match.id, slot.slot)]?.result)),
      )
    }

    return debaterSlots.length > 0 && debaterSlots.every((slot) => hasPersistedScore(drafts, match.id, slot))
  }, [getPersistedResult, getResultSlots, hasPersistedScore, hasValidDebaterResultSet, hasValidTeamResultSet, requiresSpeakerPoints, scoreKey])

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
      if (!requiresSpeakerPoints) return next
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
          if (slot.kind !== "team" && requiresSpeakerPoints) return
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
  }, [getResultSlots, getScoreSlots, hasCompletePersistedResult, matchRows, requiresSpeakerPoints, resultStorageKey, scoreKey])

  const isMatchDraftComplete = useCallback((match: MatchResponse) => {
    const slots = getResultSlots(match)
    const teamSlots = slots.filter((slot): slot is TeamResultSlot => slot.kind === "team")
    const debaterSlots = slots.filter((slot): slot is DebaterResultSlot => slot.kind === "debater")

    if (teamSlots.length > 0) {
      const results = teamSlots.map((slot) => resultDrafts[scoreKey(match.id, slot.slot)])
      if (!hasValidTeamResultSet(teamSlots.length, results)) return false
      if (!requiresSpeakerPoints) return true

      return teamSlots.every((slot) =>
        slot.speakers.length > 0 &&
        slot.speakers.every((speaker) => hasDraftScore(match.id, speaker))
      )
    }

    if (!requiresSpeakerPoints) {
      return hasValidDebaterResultSet(
        debaterSlots.map((slot) => resultDrafts[scoreKey(match.id, slot.slot)]),
      )
    }

    return debaterSlots.length > 0 && debaterSlots.every((slot) => hasDraftScore(match.id, slot))
  }, [getResultSlots, hasDraftScore, hasValidDebaterResultSet, hasValidTeamResultSet, requiresSpeakerPoints, resultDrafts, scoreKey])

  const isMatchBackendComplete = useCallback((match: MatchResponse) => {
    if (!requiresSpeakerPoints && !canManageTeams && match.completed) return true
    if (requiresSpeakerPoints && match.participantScoresComplete === false) return false

    const slots = getResultSlots(match)
    const teamSlots = slots.filter((slot): slot is TeamResultSlot => slot.kind === "team")
    const debaterSlots = slots.filter((slot): slot is DebaterResultSlot => slot.kind === "debater")

    if (teamSlots.length > 0) {
      const results: ResultDraftValue[] = teamSlots.map((slot) => {
        if (slot.currentWon === true) return "won"
        if (slot.currentWon === false) return "lost"
        return ""
      })
      if (!hasValidTeamResultSet(teamSlots.length, results)) return false
      if (!requiresSpeakerPoints) return true

      return teamSlots.every((slot) =>
        (
          slot.speakers.length > 0 &&
          slot.speakers.every((speaker) => isValidScoreValue(speaker.currentScore))
        ) ||
        isValidScoreValue(getMatchTeamScore(match, slot.slot))
      )
    }

    if (!requiresSpeakerPoints) {
      return hasValidDebaterResultSet(debaterSlots.map((slot) => {
        if (slot.currentWon === true) return "won"
        if (slot.currentWon === false) return "lost"
        return ""
      }))
    }

    return debaterSlots.length > 0 && debaterSlots.every((slot) => isValidScoreValue(slot.currentScore))
  }, [canManageTeams, getResultSlots, hasValidDebaterResultSet, hasValidTeamResultSet, requiresSpeakerPoints])

  const isMatchReadOnly = useCallback((match: MatchResponse) => {
    const canRepairParticipantScores =
      requiresSpeakerPoints &&
      match.completed &&
      match.participantScoresRepairable === true &&
      match.participantScoresComplete !== true
    if (match.completed) return !canRepairParticipantScores
    return Boolean(locallyCompletedMatchIds[match.id]) && isMatchDraftComplete(match)
  }, [isMatchDraftComplete, locallyCompletedMatchIds, requiresSpeakerPoints])

  const editableMatches = useMemo(
    () => matchRows.filter((match) => !isMatchReadOnly(match) && getResultSlots(match).length > 0),
    [getResultSlots, isMatchReadOnly, matchRows]
  )
  const hasRepairableParticipantScoreMatches = editableMatches.some(
    (match) => requiresSpeakerPoints && match.participantScoresRepairable === true && match.participantScoresComplete !== true,
  )
  const canRepairSelectedRound = hasRepairableParticipantScoreMatches

  // Organizers fill results match-by-match as rounds finish, so allow submitting the
  // matches that are fully scored rather than forcing every open match to be ready first.
  const completedDraftMatches = useMemo(
    () => editableMatches.filter((match) => isMatchDraftComplete(match)),
    [editableMatches, isMatchDraftComplete]
  )

  const hasEditableMatches = editableMatches.length > 0
  const readyToSubmitCount = completedDraftMatches.length
  const pendingMatchCount = editableMatches.length - readyToSubmitCount
  const outcomeRequirementMessage = isSoloElimination
    ? t("ldRequirement")
    : t("apfBpfRequirement")
  const hasTeamsWithoutSpeakers = editableMatches.some((match) =>
    requiresSpeakerPoints && getResultSlots(match).some((slot) => slot.kind === "team" && slot.speakers.length === 0)
  )
  const canSubmitMatchResults =
    Boolean(onSubmitResults) &&
    canManageTeams &&
    (canEditSelectedRound || canRepairSelectedRound) &&
    readyToSubmitCount > 0 &&
    !isSubmittingResults
  const shouldRenderMatchResults = matchesLoading || matchesError || Boolean(matches)
  const isRepairableParticipantScoreMatch = (match: MatchResponse) =>
    requiresSpeakerPoints && match.completed && match.participantScoresRepairable === true && match.participantScoresComplete !== true

  const isNonrepairableCorrection = (match: MatchResponse) =>
    match.completed && !isRepairableParticipantScoreMatch(match) && !isMatchBackendComplete(match)

  const getMatchStatusLabel = (match: MatchResponse) => {
    if (isRepairableParticipantScoreMatch(match)) return t("needsCorrection")
    if (isNonrepairableCorrection(match)) return t("needsCorrectionNotRepairable")
    if (match.completed || isMatchReadOnly(match)) return t("completed")
    return t("open")
  }
  const nonrepairableCorrectionCount = matchRows.filter(isNonrepairableCorrection).length
  const summaryRoundMatches = useMemo(() => {
    return [...(preliminaryRoundMatches ?? [])].sort((a, b) => a.round.roundNumber - b.round.roundNumber)
  }, [preliminaryRoundMatches])
  const preliminarySummary = useMemo(() => {
    type TeamStanding = {
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
    }
    type SpeakerStanding = {
      participantId: number
      speakerName: string
      teamId: number
      teamName: string
      aggregateScore: number | null
      total: number
      count: number
      roundScores: Record<number, number[]>
    }
    const teamStandings = new Map<number, TeamStanding>()
    const speakerStandings = new Map<number, SpeakerStanding>()

    const ensureTeam = (team: SimpleTeamResponse) => {
      const existing = teamStandings.get(team.id)
      if (existing) return existing
      const row: TeamStanding = {
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
      const row: SpeakerStanding = {
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
    if (isOutcomeOnlyStage) return RESULTS_VIEW_OPTIONS.filter((option) => option.id === "entry")
    return RESULTS_VIEW_OPTIONS.filter((option) =>
      canManageTeams || option.id === "standings" || option.id === "win-count"
    )
  }, [canManageTeams, isOutcomeOnlyStage])
  const activeResultsView = (() => {
    if (selectedResultsView === "auto") {
      if (isOutcomeOnlyStage) return "entry"
      if (!canManageTeams) return "standings"
      return preliminaryIsComplete ? "standings" : "entry"
    }

    return availableResultsViewOptions.some((option) => option.id === selectedResultsView)
      ? selectedResultsView
      : availableResultsViewOptions[0]?.id ?? "entry"
  })()

  const renderTeamRows = (columnCount: number, renderRow: (team: SimpleTeamResponse) => ReactNode) => {
    if (teamsLoading) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69]">
            {t("loadingTeams")}
          </td>
        </tr>
      )
    }

    if (teamsError) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-red-500">
            {t("failedTeams")}
          </td>
        </tr>
      )
    }

    if (!teamRows.length) {
      return (
        <tr>
          <td colSpan={columnCount} className="border border-gray-300 px-6 py-4 text-center text-[#4a4e69]">
            {t("noTeams")}
          </td>
        </tr>
      )
    }

    return teamRows.map((team) => renderRow(team))
  }

  const buildResultPayload = (): MatchResultRequest[] => {
    return completedDraftMatches.map((match) => {
      const resultSlots = getResultSlots(match)
      const teamResults = resultSlots
        .filter((slot) => slot.kind === "team")
        .map((slot) => ({
          teamId: slot.entityId,
          won: resultDrafts[scoreKey(match.id, slot.slot)] === "won",
          ...(requiresSpeakerPoints ? {
            participantScores: slot.speakers.map((speaker) => ({
              participantId: speaker.entityId,
              score: Number(scoreDrafts[scoreKey(match.id, speaker.slot)]),
            })),
          } : {}),
        }))

      const debaterSlots = resultSlots.filter((slot) => slot.kind === "debater")
      const participantScores = debaterSlots
        .filter((slot) => slot.kind === "debater")
        .map((slot) => ({
          participantId: slot.entityId,
          score: Number(scoreDrafts[scoreKey(match.id, slot.slot)]),
        }))
      const winningDebater = debaterSlots.find(
        (slot) => resultDrafts[scoreKey(match.id, slot.slot)] === "won",
      )

      return {
        matchId: match.id,
        ...(teamResults.length ? { teamResults } : {}),
        ...(requiresSpeakerPoints && participantScores.length ? { participantScores } : {}),
        ...(!requiresSpeakerPoints && winningDebater ? { winnerParticipantId: winningDebater.entityId } : {}),
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
          if (requiresSpeakerPoints) {
            slot.speakers.forEach((speaker) => {
              acc[scoreKey(match.id, speaker.slot)] = {
                score: scoreDrafts[scoreKey(match.id, speaker.slot)] ?? "",
              }
            })
          }
          return
        }

        acc[scoreKey(match.id, slot.slot)] = {
          ...(requiresSpeakerPoints
            ? { score: scoreDrafts[scoreKey(match.id, slot.slot)] ?? "" }
            : { result: resultDrafts[scoreKey(match.id, slot.slot)] ?? "" }),
        }
      })

      return acc
    }, {})
  }

  const handleSubmitMatchResults = async () => {
    if (!onSubmitResults || !canManageTeams) return false

    if (!canEditSelectedRound && !canRepairSelectedRound) {
      setScoreError(t("currentRoundOnly"))
      return false
    }

    if (!hasEditableMatches) {
      setScoreError(t("noOpenMatches"))
      return false
    }

    if (readyToSubmitCount === 0) {
      setScoreError(
        requiresSpeakerPoints && hasTeamsWithoutSpeakers
          ? t("addParticipants")
          : requiresSpeakerPoints
            ? `${outcomeRequirementMessage} ${t("everySpeakerPoints")}`
            : outcomeRequirementMessage
      )
      return false
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
      return false
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
    return true
  }

  const submitResultsFeedback = useActionFeedback(handleSubmitMatchResults)

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

  const updateDebaterResultDraft = useCallback((
    match: MatchResponse,
    selectedSlot: DebaterSlotName,
    value: ResultDraftValue,
  ) => {
    const debaterSlots = getResultSlots(match).filter(
      (slot): slot is DebaterResultSlot => slot.kind === "debater",
    )
    const updates = new Map<OutcomeSlotName, ResultDraftValue>([[selectedSlot, value]])
    const otherSlot = debaterSlots.find((slot) => slot.slot !== selectedSlot)
    if (otherSlot) updates.set(otherSlot.slot, value === "won" ? "lost" : "won")

    setResultDrafts((current) => {
      const next = { ...current }
      updates.forEach((result, slot) => {
        next[scoreKey(match.id, slot)] = result
      })
      return next
    })
    updates.forEach((result, slot) => {
      saveInputDraft(scoreKey(match.id, slot), { result })
    })
  }, [getResultSlots, saveInputDraft, scoreKey])

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
          aria-label={t("speakerPointsForMatch", { name: slot.name, id: match.id })}
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

  const renderOutcomeControl = (
    match: MatchResponse,
    slot: TeamResultSlot | DebaterResultSlot,
    canEditResult: boolean,
  ) => {
    const key = scoreKey(match.id, slot.slot)
    return (
      <div
        role="group"
        aria-label={t("resultForMatch", { name: slot.name, id: match.id })}
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
              aria-label={t(value === "won" ? "markWinner" : "markNotWinner", { name: slot.name, id: match.id })}
              onClick={() => {
                if (slot.kind === "team") {
                  updateTeamResultDraft(match, slot.slot, value)
                } else {
                  updateDebaterResultDraft(match, slot.slot, value)
                }
              }}
              className={`px-3 text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-[#0D1321] text-white"
                  : "text-[#0B1327] hover:bg-[#F5F7FC]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {value === "won" ? t("win") : t("lose")}
            </button>
          )
        })}
      </div>
    )
  }

  const resultTableColumnCount = requiresSpeakerPoints ? 7 : 6

  const renderMatchResultRows = () => {
    if (matchesLoading) {
      return (
        <tr>
          <td colSpan={resultTableColumnCount} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
            {t("loadingMatches")}
          </td>
        </tr>
      )
    }

    if (matchesError) {
      return (
        <tr>
          <td colSpan={resultTableColumnCount} className="border border-gray-300 px-6 py-8 text-center text-red-500">
            {t("failedMatches")}
          </td>
        </tr>
      )
    }

    if (!matchRows.length) {
      return (
        <tr>
          <td colSpan={resultTableColumnCount} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
            {t("noMatches")}
          </td>
        </tr>
      )
    }

    return matchRows.flatMap((match) => {
      const slots = getResultSlots(match)
      if (!slots.length) {
        return (
          <tr key={match.id} className="hover:bg-gray-50">
            <td className="border border-gray-300 px-6 py-4 text-[#0D1321] font-medium">{t("matchLabel", { id: match.id })}</td>
            <td colSpan={resultTableColumnCount - 1} className="border border-gray-300 px-6 py-4 text-[#4a4e69]">{t("noSides")}</td>
          </tr>
        )
      }

      return slots.map((slot, index) => {
        const key = scoreKey(match.id, slot.slot)
        const matchIsReadOnly = isMatchReadOnly(match)
        const canEditResult = canManageTeams && (canEditSelectedRound || isRepairableParticipantScoreMatch(match)) && !matchIsReadOnly
        const statusLabel = getMatchStatusLabel(match)
        return (
          <tr key={key} className="hover:bg-gray-50">
            {index === 0 ? (
              <td rowSpan={slots.length} className="border border-gray-300 px-6 py-4 align-top text-[#0D1321] font-medium">
                Match {match.id}
              </td>
            ) : null}
            <td className="border border-gray-300 px-6 py-4 text-[#0D1321] font-medium">{slot.name}</td>
            <td className="border border-gray-300 px-6 py-4">
              {slot.kind === "team" || !requiresSpeakerPoints ? (
                renderOutcomeControl(match, slot, canEditResult)
              ) : (
                <span className="text-sm text-[#0D1321]">{getDebaterResult(match, slot.slot) ?? "—"}</span>
              )}
            </td>
            {requiresSpeakerPoints ? (
              <td className="border border-gray-300 px-6 py-4">
                {slot.kind === "team" ? (
                  slot.speakers.length > 0 ? (
                    <div className="grid min-w-64 gap-2">
                      {slot.speakers.map((speaker, speakerIndex) =>
                        renderScoreInput(match, speaker, canEditResult, t("speakerLabel", { number: speakerIndex + 1 }))
                      )}
                    </div>
                  ) : (
                        <span className="text-sm text-red-500">{t("noParticipants")}</span>
                  )
                ) : (
                  renderScoreInput(match, slot, canEditResult)
                )}
              </td>
            ) : null}
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

  const formatScore = (score: number) => Number.isInteger(score)
    ? new Intl.NumberFormat(localeTags[locale], { maximumFractionDigits: 0 }).format(score)
    : new Intl.NumberFormat(localeTags[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score)
  const getRoundHeader = (round: SimpleRoundResponse) => t("round", { number: round.roundNumber })
  const getRoundResultValue = (result: string) => {
    if (result === "W") return "1"
    if (result === "L") return "0"
    return "—"
  }

  const renderPreliminarySummaryState = () => {
    if (preliminaryRoundMatchesLoading) {
      return (
        <div className="rounded-lg border border-[#D5D9E7] bg-white px-6 py-5 text-sm text-[#4A5168]">
          {t("loadingMatches")}
        </div>
      )
    }

    if (preliminaryRoundMatchesError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
          {t("failedMatches")}
        </div>
      )
    }

    if (!summaryRoundMatches.length) {
      return (
        <div className="rounded-lg border border-[#D5D9E7] bg-white px-6 py-5 text-sm text-[#4A5168]">
          {t("noPreliminaryRounds")}
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
        <h3 className="mb-4 text-xl font-semibold text-[#0D1321]">{t("preliminaryStandings")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-4 text-center text-[#0D1321] font-medium text-[16px]">№</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("winCount")}</th>
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
                    {t("noPreliminaryTeamResults")}
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
        <h3 className="mb-4 text-xl font-semibold text-[#0D1321]">{t("speakerDetails")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse border border-gray-300 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-4 text-center text-[#0D1321] font-medium text-[16px]">№</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("speaker")}</th>
                {summaryRounds.map((round) => (
                  <th key={round.id} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">
                    {getRoundHeader(round)}
                  </th>
                ))}
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("selectionResult")}</th>
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("overallSelectionResult")}</th>
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
                    {t("noPreliminarySpeakerPoints")}
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
        <h3 className="mb-4 text-xl font-semibold text-[#0D1321]">{t("winCountByRound")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse border border-gray-300 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-4 text-center text-[#0D1321] font-medium text-[16px]">№</th>
                <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                {summaryRounds.map((round) => (
                  <th key={round.id} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">
                    {getRoundHeader(round)}
                  </th>
                ))}
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("selectionResult")}</th>
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
                    {t("noPreliminaryTeamResults")}
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
            {getLocalizedRoundLabel(effectiveSelectedRound)} {t("resultsWord")}{requiresSpeakerPoints ? t("andSpeakerPoints") : ""}
          </h3>
        </div>
        {roundOptions.length > 1 ? (
          <div className="flex flex-wrap gap-2" aria-label={t("selectResultsRound")}>
            {roundOptions.map((round) => (
              <button
                key={round}
                type="button"
                onClick={() => onSelectedRoundChange(round)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  // Compare normalized labels: selection state may hold a clean
                  // "1/16" while the round option is a raw backend "1/16.0".
                  displayRoundLabel(effectiveSelectedRound) === displayRoundLabel(round)
                    ? "bg-[#0D1321] text-white"
                    : "border border-[#D5D9E7] text-[#0D1321] hover:bg-[#F5F7FC]"
                }`}
              >
                {getLocalizedRoundLabel(round)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("match")}</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("side")}</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("result")}</th>
              {requiresSpeakerPoints ? (
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("speakerPoints")}</th>
              ) : null}
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("room")}</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("judge")}</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("status")}</th>
            </tr>
          </thead>
          <tbody>{renderMatchResultRows()}</tbody>
        </table>
      </div>
      {scoreError ? <p className="mt-4 text-sm text-red-500" role="alert">{scoreError}</p> : null}
      {nonrepairableCorrectionCount > 0 ? (
        <p className="mt-4 text-sm text-amber-700" role="status">
          {requiresSpeakerPoints
            ? t(nonrepairableCorrectionCount === 1 ? "correctionParticipantSingle" : "correctionParticipant", { count: nonrepairableCorrectionCount })
            : t(nonrepairableCorrectionCount === 1 ? "correctionOutcomeSingle" : "correctionOutcome", { count: nonrepairableCorrectionCount })}
        </p>
      ) : null}
      {hasEditableMatches ? (
        <p className="mt-4 text-sm text-[#4A5168]">
          {readyToSubmitCount > 0
            ? `${t("readyMatches", { ready: readyToSubmitCount, total: editableMatches.length, matchWord: editableMatches.length === 1 ? t("match") : locale === "ru" ? "матчей" : locale === "kk" ? "матч" : "matches" })}${
                pendingMatchCount > 0
                  ? t("pendingMatches", { count: pendingMatchCount, requirement: requiresSpeakerPoints ? t("requirementResultPoints") : t("requirementWinLose") })
                  : t("period")
              }`
            : requiresSpeakerPoints
              ? `${outcomeRequirementMessage} ${t("everySpeakerPoints")}`
              : outcomeRequirementMessage}
        </p>
      ) : null}
      <div className="mt-6 flex">
        <button
          type="button"
          disabled={!canSubmitMatchResults || submitResultsFeedback.status !== "idle"}
          onClick={() => void submitResultsFeedback.run()}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-8 py-3 text-[16px] font-medium text-white transition-colors disabled:cursor-not-allowed sm:ml-auto sm:w-auto ${
            submitResultsFeedback.isSuccess
              ? "bg-emerald-600"
              : canSubmitMatchResults
                ? "bg-[#3E5C76] hover:bg-[#2D3748]"
                : "bg-[#3E5C76] opacity-50"
          }`}
        >
          {submitResultsFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {submitResultsFeedback.isPending
            ? t("submitting")
            : submitResultsFeedback.isSuccess
              ? t("submitted")
              : t("submitResults")}
        </button>
      </div>
    </>
  )

  const renderResultsWorkspace = () => (
    <>
      {availableResultsViewOptions.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2" aria-label={t("selectResultsView")}>
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
              {t(option.key)}
            </button>
          ))}
        </div>
      ) : null}
      {activeResultsView === "entry" ? renderRoundEntryTable() : null}
      {activeResultsView === "standings" ? renderPreliminaryStandingsTable() : null}
      {activeResultsView === "speaker-details" ? renderSpeakerDetailsTable() : null}
      {activeResultsView === "win-count" ? renderWinCountTable() : null}
    </>
  )

  const renderDeleteButton = (team: SimpleTeamResponse) => (
    <td className="border border-gray-300 px-6 py-4 text-center">
      <button
        aria-label={t("deleteTeam", { name: team.name })}
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

  const isEliminationRound = configuredEliminationRounds.some(
    (round) => displayRoundLabel(round.name) === displayRoundLabel(activeResultsSection),
  )
  const isMatchResultsMode = shouldRenderMatchResults

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
            {t("noMatchesScheduled")}
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
        {isMatchResultsMode ? (
          renderResultsWorkspace()
        ) : isEliminationRound ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-white text-[14px] uppercase tracking-[0.08em] text-[#4A5168]">
                    <th className="border border-gray-300 px-6 py-4 text-left">{t("fraction1")}</th>
                    <th className="border border-gray-300 px-6 py-4 text-left">{t("fraction2")}</th>
                    {hasWinnerData && <th className="border border-gray-300 px-6 py-4 text-left">{t("winner")}</th>}
                  </tr>
                </thead>
                <tbody>{renderEliminationTable()}</tbody>
              </table>
            </div>
            <div className="flex justify-end mt-8 mb-8">
              <button type="button" disabled={submitDisabled} className={submitButtonClass}>
                {t("submit")}
              </button>
            </div>
          </>
        ) : (
          <>
        {selectedResultsOption === "APF" && activeResultsSection === "APF Speaker Score" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("speaker")}</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("roundLabel", { number: index + 1 })}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("overall")}</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("actions")}</th>
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
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("roundLabel", { number: index + 1 })}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("winCount")}</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("judgeName")}</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("actions")}</th>
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
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("speaker")}</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("roundLabel", { number: index + 1 })}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("overall")}</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("actions")}</th>
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
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("roundLabel", { number: index + 1 })}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("winCount")}</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("judgeName")}</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("actions")}</th>
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
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("fractionName")}</th>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <th key={index} className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("roundLabel", { number: index + 1 })}</th>
                  ))}
                  <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("winCount")}</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("judgeName")}</th>
                  {canManageTeams && (
                    <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("actions")}</th>
                  )}
                </tr>
              </thead>
              <tbody>{renderTeamRows(canManageTeams ? 8 : 7, (team) => renderFractionRow(team))}</tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-8 mb-8">
          <button type="button" disabled={submitDisabled} className={submitButtonClass}>
            {t("submit")}
          </button>
        </div>
          </>
        )}

        <div className="bg-[#0D1321] rounded-lg p-4">
            <nav aria-label="Results rounds" className="flex items-center justify-start gap-2 overflow-x-auto sm:justify-center">
              {selectedResultsOption !== "LD" && (
                <>
                  <button
                    className={`shrink-0 whitespace-nowrap px-4 py-2 ${
                      activeResultsSection === `${selectedResultsOption} Results`
                        ? "bg-white text-[#0D1321]"
                        : "text-white hover:bg-[#3E5C76]"
                    } rounded text-[14px] font-medium transition-colors`}
                    onClick={() => {
                      onActiveResultsSectionChange(`${selectedResultsOption} Results`)
                      onResultsSubTabChange("Results")
                    }}
                  >
                    {t("resultsTab", { format: selectedResultsOption })}
                  </button>
                  <button
                    className={`shrink-0 whitespace-nowrap px-4 py-2 ${
                      activeResultsSection === `${selectedResultsOption} Speaker Score`
                        ? "bg-white text-[#0D1321]"
                        : "text-white hover:bg-[#3E5C76]"
                    } rounded text-[14px] font-medium transition-colors`}
                    onClick={() => {
                      onActiveResultsSectionChange(`${selectedResultsOption} Speaker Score`)
                      onResultsSubTabChange("Speaker Score")
                    }}
                  >
                    {t("speakerScoreTab", { format: selectedResultsOption })}
                  </button>
                  <span className="shrink-0 text-white mx-2">|</span>
                </>
              )}

              {configuredEliminationRounds.map((round) => (
                <button
                  key={round.id}
                  className={`shrink-0 whitespace-nowrap px-3 py-2 ${
                    displayRoundLabel(activeResultsSection) === displayRoundLabel(round.name)
                      ? "bg-white text-[#0D1321]"
                      : "text-white hover:bg-[#3E5C76]"
                  } rounded text-[14px] font-medium transition-colors`}
                  onClick={() => {
                    onActiveResultsSectionChange(round.name)
                    onSelectedRoundChange(round.name)
                    onResultsSubTabChange("Results")
                  }}
                >
                  {getLocalizedRoundLabel(round.name)}
                </button>
              ))}
            </nav>
          </div>
      </div>
    </div>
  )
}
