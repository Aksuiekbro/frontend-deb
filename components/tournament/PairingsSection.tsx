"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Pencil, Trash2 } from "lucide-react"

import type { PageResult } from "@/types/page"
import type { MatchResponse, MatchUpdateRequest } from "@/types/tournament/match"
import type { JudgeResponse } from "@/types/tournament/judge"
import type { SimpleRoundResponse } from "@/types/tournament/round/round"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import type { SimpleTournamentParticipantResponse } from "@/types/tournament/tournament-participant"
import {
  readPersistedResultDrafts,
  RESULT_DRAFTS_CHANGED_EVENT,
  type PersistedResultDrafts,
} from "@/lib/tournament-result-drafts"
import {
  getParticipantName,
  getTeamMembers,
  participantScoreSlot,
  resolveDebaterCurrentWon,
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
import { useActionFeedback } from "@/components/tournament/useActionFeedback"
import { displayRoundLabel } from "@/lib/round-label"
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: {
    preliminary: "Preliminary",
    teamElimination: "Team elimination",
    soloElimination: "Solo elimination",
    round: "Round {number}",
    preliminaryRound: "Preliminary {number}",
    semifinal: "Semifinal",
    quarterfinal: "Quarterfinal",
    final: "Final",
    currentRound: "the current round",
    debaters: "debaters",
    teams: "teams",
    lockedRound: "{selected} is locked until {current} is completed and advanced.",
    pastRound: "{selected} is not the active round anymore. Review it here, but manage pairings on {current}.",
    correction: "Some completed matches need correction, but their participant scores cannot be repaired.",
    noPairings: "No pairings yet for {round}. Randomize {kind}, adjust rooms and judges, then publish pairings.",
    resultsPending: "Results are pending. Completed {completed} of {total} matches.",
    enterResults: "Enter results for all matches before proceeding. Completed {completed} of {total} matches.",
    allCompletedNext: "All matches in this round are completed. You can proceed to the next round.",
    allCompleted: "All matches in this round are completed.",
    loading: "Loading matches...",
    loadFailed: "Failed to load matches",
    futureEmpty: "{round} will unlock after {current} is completed.",
    noPairingsShort: "No pairings yet for {round}",
    open: "Open",
    needsCorrection: "Needs correction",
    needsCorrectionNotRepairable: "Needs correction (not repairable)",
    completed: "Completed",
    winner: "Winner",
    loss: "Loss",
    resultPending: "Result pending",
    roomForMatch: "Room for match {id}",
    room: "Room",
    editMatch: "Edit match {id}",
    editMatchTitle: "Edit match {id}",
    editMatchGeneric: "Edit match",
    updateMatchDescription: "Update teams, room, and judge after randomizing pairings.",
    debater: "Debater {number}",
    team: "Team {number}",
    unassigned: "Unassigned",
    judge: "Judge",
    matchRoom: "Match room",
    duplicateDebater: "A debater can only appear once in the same match.",
    exactlyTwoDebaters: "LD matches require exactly two debaters.",
    duplicateTeam: "A team can only appear once in the same match.",
    exactlyFourTeams: "BPF matches require exactly four teams.",
    exactlyTwoTeams: "APF matches require exactly two teams.",
    cancel: "Cancel",
    delete: "Delete",
    saveMatch: "Save match",
    saving: "Saving...",
    startTime: "Start time",
    judgeName: "Judge Name",
    status: "Status",
    actions: "Actions",
    clearMatches: "Clear matches",
    deletePairings: "Are you sure you want to delete the pairings for {stage}?",
    deleteDescription: "Confirm deleting the current pairings before the action is sent to the backend.",
    proceed: "Proceed to next round",
    saveAllRooms: "Save all rooms ({count})",
    savingAllRooms: "Saving all rooms...",
    roomsSaved: "✓ Rooms saved",
    randomize: "Randomize",
    randomizing: "Randomizing...",
    randomized: "✓ Randomized",
    publish: "Publish pairings",
    publishing: "Publishing...",
    published: "✓ Published",
    fraction: "Fraction {number}",
  },
  ru: {
    preliminary: "Предварительный этап",
    teamElimination: "Командная сетка",
    soloElimination: "Личная сетка",
    round: "Раунд {number}",
    preliminaryRound: "Предварительный раунд {number}",
    semifinal: "Полуфинал",
    quarterfinal: "Четвертьфинал",
    final: "Финал",
    currentRound: "текущий раунд",
    debaters: "дебатёров",
    teams: "команд",
    lockedRound: "{selected} заблокирован, пока не будет завершён и пройден этап {current}.",
    pastRound: "{selected} больше не является активным раундом. Просмотрите его здесь, а пары управляйте в разделе {current}.",
    correction: "Некоторые завершённые матчи требуют исправления, но баллы участников восстановить нельзя.",
    noPairings: "Пар пока нет для этапа «{round}». Сформируйте пары для: {kind}, настройте аудитории и судей, затем опубликуйте пары.",
    resultsPending: "Результаты ещё не внесены. Завершено матчей: {completed} из {total}.",
    enterResults: "Внесите результаты всех матчей перед переходом дальше. Завершено матчей: {completed} из {total}.",
    allCompletedNext: "Все матчи этого раунда завершены. Можно перейти к следующему раунду.",
    allCompleted: "Все матчи этого раунда завершены.",
    loading: "Загрузка матчей...",
    loadFailed: "Не удалось загрузить матчи",
    futureEmpty: "{round} откроется после завершения этапа {current}.",
    noPairingsShort: "Пар для этапа «{round}» пока нет",
    open: "Открыт",
    needsCorrection: "Требует исправления",
    needsCorrectionNotRepairable: "Требует исправления (восстановление невозможно)",
    completed: "Завершён",
    winner: "Победитель",
    loss: "Поражение",
    resultPending: "Результат ожидается",
    roomForMatch: "Аудитория для матча {id}",
    room: "Аудитория",
    editMatch: "Изменить матч {id}",
    editMatchTitle: "Изменить матч {id}",
    editMatchGeneric: "Изменить матч",
    updateMatchDescription: "После формирования пар измените команды, аудиторию и судью.",
    debater: "Дебатёр {number}",
    team: "Команда {number}",
    unassigned: "Не назначен",
    judge: "Судья",
    matchRoom: "Аудитория матча",
    duplicateDebater: "Один дебатёр может участвовать в матче только один раз.",
    exactlyTwoDebaters: "Для матчей LD требуется ровно два дебатёра.",
    duplicateTeam: "Одна команда может участвовать в матче только один раз.",
    exactlyFourTeams: "Для матчей BPF требуется ровно четыре команды.",
    exactlyTwoTeams: "Для матчей APF требуется ровно две команды.",
    cancel: "Отмена",
    delete: "Удалить",
    saveMatch: "Сохранить матч",
    saving: "Сохранение...",
    startTime: "Время начала",
    judgeName: "Имя судьи",
    status: "Статус",
    actions: "Действия",
    clearMatches: "Очистить пары",
    deletePairings: "Вы уверены, что хотите удалить пары для этапа «{stage}»?",
    deleteDescription: "Подтвердите удаление текущих пар перед отправкой действия на сервер.",
    proceed: "Перейти к следующему раунду",
    saveAllRooms: "Сохранить все аудитории ({count})",
    savingAllRooms: "Сохранение аудиторий...",
    roomsSaved: "✓ Аудитории сохранены",
    randomize: "Сформировать пары",
    randomizing: "Формирование пар...",
    randomized: "✓ Пары сформированы",
    publish: "Опубликовать пары",
    publishing: "Публикация...",
    published: "✓ Опубликовано",
    fraction: "Фракция {number}",
  },
  kk: {
    preliminary: "Алдын ала кезең",
    teamElimination: "Командалық іріктеу",
    soloElimination: "Жеке іріктеу",
    round: "{number}-раунд",
    preliminaryRound: "Алдын ала раунд {number}",
    semifinal: "Жартылай финал",
    quarterfinal: "Ширек финал",
    final: "Финал",
    currentRound: "ағымдағы раунд",
    debaters: "дебатшыларды",
    teams: "командаларды",
    lockedRound: "{selected} {current} аяқталып, келесі кезеңге өткенше құлыптаулы.",
    pastRound: "{selected} енді белсенді раунд емес. Оны осы жерден көріңіз, ал жұптарды {current} кезеңінде басқарыңыз.",
    correction: "Кейбір аяқталған матчтарды түзету қажет, бірақ қатысушылар ұпайларын қалпына келтіру мүмкін емес.",
    noPairings: "{round} үшін жұптар әлі жоқ. {kind} жұптарын кездейсоқ құрып, аудиториялар мен төрешілерді реттеп, жұптарды жариялаңыз.",
    resultsPending: "Нәтижелер күтілуде. Аяқталған матчтар: {completed}/{total}.",
    enterResults: "Жалғастырмас бұрын барлық матчтың нәтижесін енгізіңіз. Аяқталған матчтар: {completed}/{total}.",
    allCompletedNext: "Бұл раундтағы барлық матч аяқталды. Келесі раундқа өтуге болады.",
    allCompleted: "Бұл раундтағы барлық матч аяқталды.",
    loading: "Матчтар жүктелуде...",
    loadFailed: "Матчтарды жүктеу мүмкін болмады",
    futureEmpty: "{current} аяқталғаннан кейін {round} ашылады.",
    noPairingsShort: "{round} үшін жұптар әлі жоқ",
    open: "Ашық",
    needsCorrection: "Түзету қажет",
    needsCorrectionNotRepairable: "Түзету қажет (қалпына келмейді)",
    completed: "Аяқталды",
    winner: "Жеңімпаз",
    loss: "Жеңіліс",
    resultPending: "Нәтиже күтілуде",
    roomForMatch: "{id}-матч аудиториясы",
    room: "Аудитория",
    editMatch: "{id}-матчты өзгерту",
    editMatchTitle: "{id}-матчты өзгерту",
    editMatchGeneric: "Матчты өзгерту",
    updateMatchDescription: "Жұптарды кездейсоқ құрғаннан кейін командаларды, аудиторияны және төрешіні өзгертіңіз.",
    debater: "{number}-дебатшы",
    team: "{number}-команда",
    unassigned: "Тағайындалмаған",
    judge: "Төреші",
    matchRoom: "Матч аудиториясы",
    duplicateDebater: "Бір дебатшы бір матчта бір рет қана қатыса алады.",
    exactlyTwoDebaters: "LD матчтарына дәл екі дебатшы қажет.",
    duplicateTeam: "Бір команда бір матчта бір рет қана қатыса алады.",
    exactlyFourTeams: "BPF матчтарына дәл төрт команда қажет.",
    exactlyTwoTeams: "APF матчтарына дәл екі команда қажет.",
    cancel: "Бас тарту",
    delete: "Жою",
    saveMatch: "Матчты сақтау",
    saving: "Сақталуда...",
    startTime: "Басталу уақыты",
    judgeName: "Төрешінің аты",
    status: "Мәртебе",
    actions: "Әрекеттер",
    clearMatches: "Жұптарды тазарту",
    deletePairings: "«{stage}» кезеңінің жұптарын жоюға сенімдісіз бе?",
    deleteDescription: "Әрекетті серверге жібермес бұрын ағымдағы жұптарды жоюды растаңыз.",
    proceed: "Келесі раундқа өту",
    saveAllRooms: "Барлық аудиторияны сақтау ({count})",
    savingAllRooms: "Аудиториялар сақталуда...",
    roomsSaved: "✓ Аудиториялар сақталды",
    randomize: "Жұптарды құру",
    randomizing: "Жұптар құрылуда...",
    randomized: "✓ Жұптар құрылды",
    publish: "Жұптарды жариялау",
    publishing: "Жариялануда...",
    published: "✓ Жарияланды",
    fraction: "{number}-фракция",
  },
}

interface PairingsSectionProps {
  matches?: PageResult<MatchResponse>
  rounds?: SimpleRoundResponse[]
  teams?: PageResult<SimpleTeamResponse>
  participants?: PageResult<SimpleTournamentParticipantResponse>
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
  onRandomizePairings?: () => Promise<boolean | void>
  onSubmitPairings?: () => Promise<boolean | void>
  onClearMatches?: (stage: StageId) => void
  availableStages?: readonly StageDescriptor[]
  stageFormats?: Partial<Record<StageId, FormatOption>>
  onSaveAllRooms?: (entries: { matchId: number; location: string }[]) => Promise<boolean | void>
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
const ELIMINATION_ROUNDS = ["1/16", "1/8", "1/4", "1/2", "Final"] as const
const BACKEND_PRELIMINARY_ROUND_PATTERN = /^Preliminary\s+\d+(?:\.0)?$/
export type StageId = (typeof STAGE_TABS)[number]["id"]
export type FormatOption = "APF" | "BPF" | "LD"
export type StageDescriptor = {
  id: StageId
  label: string
  format: FormatOption
  defaultRound?: string
}

const DEFAULT_STAGE_FORMATS: Record<StageId, FormatOption> = STAGE_TABS.reduce((acc, tab) => {
  acc[tab.id] = tab.defaultFormat
  return acc
}, {} as Record<StageId, FormatOption>)

const DEFAULT_ROUND_BY_STAGE: Record<StageId, string> = {
  preliminary: STANDARD_ROUNDS[0],
  team: ELIMINATION_ROUNDS[0],
  solo: ELIMINATION_ROUNDS[0],
}

type Translate = (key: string, values?: Record<string, string | number>) => string

const translateStageLabel = (label: string, t: Translate) => {
  if (label === "Preliminary") return t("preliminary")
  if (label === "Team elimination") return t("teamElimination")
  if (label === "Solo elimination") return t("soloElimination")
  return label
}

const translateRoundLabel = (round: string, t: Translate) => {
  const displayedRound = displayRoundLabel(round)
  const standardRound = displayedRound.match(/^Round (\d+)$/)
  if (standardRound) return t("round", { number: standardRound[1] })

  const preliminaryRound = displayedRound.match(/^Preliminary (\d+)$/)
  if (preliminaryRound) return t("preliminaryRound", { number: preliminaryRound[1] })
  if (displayedRound === "Semifinal") return t("semifinal")
  if (displayedRound === "Quarterfinal") return t("quarterfinal")
  if (displayedRound === "Final") return t("final")
  return displayedRound
}

type MatchDraft = {
  location: string
  judgeId: string
  team1Id: string
  team2Id: string
  team3Id: string
  team4Id: string
  debater1Id: string
  debater2Id: string
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
  stage: StageId,
) => {
  if (stage === "preliminary" && match.completed && match.participantScoresComplete === false) return false

  if (stage === "solo") {
    if (!match.debater1 || !match.debater2) return false
    const results = ([
      { slot: "debater1", debater: match.debater1 },
      { slot: "debater2", debater: match.debater2 },
    ] as const).map(({ slot, debater }) => {
      const currentWon = resolveDebaterCurrentWon(match, slot, debater.id)
      return typeof currentWon === "boolean" ? currentWon : getPersistedWon(drafts, match.id, slot)
    })
    return results.every((won) => typeof won === "boolean") && results.filter(Boolean).length === 1
  }

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

    if (hasNumericScore(score)) {
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

  if (stage === "team") return teamResultValues.length > 0 && hasValidTeamResults

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
  participants,
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
  availableStages,
  stageFormats,
  onSaveAllRooms,
  onUpdateMatch,
  savingMatchId,
  resultStorageKey,
}: PairingsSectionProps) {
  const t = useTranslations(catalog)
  const { locale } = useLocale()
  const [isHydrated, setIsHydrated] = useState(false)
  const [deleteConfirmStage, setDeleteConfirmStage] = useState<StageId | null>(null)
  const [roomDrafts, setRoomDrafts] = useState<Record<number, string>>({})
  const serverRoomsRef = useRef<Record<number, string>>({})
  const [persistedResultDrafts, setPersistedResultDrafts] = useState<PersistedResultDrafts>({})
  const [editingMatch, setEditingMatch] = useState<MatchResponse | null>(null)
  const [matchDraft, setMatchDraft] = useState<MatchDraft>({
    location: "",
    judgeId: "",
    team1Id: "",
    team2Id: "",
    team3Id: "",
    team4Id: "",
    debater1Id: "",
    debater2Id: "",
  })
  const [matchEditError, setMatchEditError] = useState<string | null>(null)
  const matchRows = matches?.content ?? []
  const dirtyRoomEntries = matchRows.flatMap((match) => {
    const draft = roomDrafts[match.id] ?? match.location ?? ""
    const currentRoom = match.location ?? ""
    return draft.trim() === currentRoom.trim() ? [] : [{ matchId: match.id, location: draft }]
  })
  const randomizeFeedback = useActionFeedback(async () => {
    if (!onRandomizePairings) return false
    return onRandomizePairings()
  })
  const publishFeedback = useActionFeedback(async () => {
    if (!onSubmitPairings) return false
    return onSubmitPairings()
  })
  const saveRoomsFeedback = useActionFeedback(async () => {
    if (!onSaveAllRooms || !dirtyRoomEntries.length) return false
    return onSaveAllRooms(dirtyRoomEntries)
  })
  const configuredStageFormats = useMemo<Record<StageId, FormatOption>>(() => ({
    ...DEFAULT_STAGE_FORMATS,
    ...stageFormats,
  }), [stageFormats])
  const stageDescriptors = useMemo<readonly StageDescriptor[]>(() => (
    availableStages ?? STAGE_TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      format: configuredStageFormats[tab.id],
      defaultRound: DEFAULT_ROUND_BY_STAGE[tab.id],
    }))
  ), [availableStages, configuredStageFormats])
  const selectedStageFormat = stageDescriptors.find(({ id }) => id === selectedStage)?.format
    ?? configuredStageFormats[selectedStage]
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
  const canManageWorkflow = Boolean(onProceedToNextRound || onRandomizePairings || onSubmitPairings)
  const completedMatches = matchRows.filter((match) =>
    (!canManageWorkflow && selectedStage !== "preliminary" && match.completed) ||
    isMatchCompleteForWorkflow(match, persistedResultDrafts, teamsById, selectedStageFormat, selectedStage)
  ).length
  const hasMatches = matchRows.length > 0
  const allMatchesCompleted = hasMatches && completedMatches === matchRows.length
  const hasNonrepairableMatches = matchRows.some((match) =>
    selectedStage === "preliminary" &&
    match.completed &&
    match.participantScoresComplete === false &&
    match.participantScoresRepairable !== true,
  )
  const canEditMatches = Boolean(onUpdateMatch) && isEditableRound
  const canUpdateRooms = Boolean(onSaveAllRooms) && isEditableRound
  const canRandomizeSelectedRound = Boolean(onRandomizePairings) && isEditableRound
  const canPublishSelectedRound = Boolean(onSubmitPairings) && isEditableRound && hasMatches
  const canProceedToNextRound = Boolean(onProceedToNextRound) && isCurrentRound && allMatchesCompleted
  const isSoloStage = selectedStage === "solo"
  const teamSlotsToRender = selectedStageFormat === "BPF" || matchRows.some((match) => match.team3 || match.team4)
    ? (["team1", "team2", "team3", "team4"] as const)
    : (["team1", "team2"] as const)
  const debaterSlotsToRender = ["debater1", "debater2"] as const
  const pairSlotCount = isSoloStage ? debaterSlotsToRender.length : teamSlotsToRender.length
  const tableColumnCount = pairSlotCount + 4 + (canEditMatches ? 1 : 0)
  const tableMinWidthClass = isSoloStage ? "min-w-[760px]" : "min-w-[960px]"
  const roundLabels = rounds?.length
    ? rounds.map((round) => round.name)
    : selectedStage === "preliminary"
      ? [...STANDARD_ROUNDS, ...ELIMINATION_ROUNDS]
      : [...ELIMINATION_ROUNDS, ...STANDARD_ROUNDS]

  const currentRoundLabel =
    typeof currentRoundNumber === "number" ? t("round", { number: currentRoundNumber }) : t("currentRound")
  const selectedRoundLabel =
    typeof selectedRoundNumber === "number" ? t("round", { number: selectedRoundNumber }) : translateRoundLabel(selectedRound, t)

  const workflowMessage = (() => {
    if (isFutureRound) {
      return t("lockedRound", { selected: selectedRoundLabel, current: currentRoundLabel })
    }

    if (isPastRound) {
      return t("pastRound", { selected: selectedRoundLabel, current: currentRoundLabel })
    }

    if (matchesLoading || matchesError) return null

    if (hasNonrepairableMatches) {
      return t("correction")
    }

    if (!hasMatches) {
      return t("noPairings", {
        round: translateRoundLabel(selectedRound, t),
        kind: isSoloStage ? t("debaters") : t("teams"),
      })
    }

    if (!allMatchesCompleted) {
      if (!canManageWorkflow) {
        return t("resultsPending", { completed: completedMatches, total: matchRows.length })
      }
      return t("enterResults", { completed: completedMatches, total: matchRows.length })
    }

    return canManageWorkflow
      ? t("allCompletedNext")
      : t("allCompleted")
  })()

  const handleSelectStage = (stage: StageId) => {
    onSelectStage(stage)
    const descriptor = stageDescriptors.find(({ id }) => id === stage)
    onSelectRound(descriptor?.defaultRound ?? DEFAULT_ROUND_BY_STAGE[stage])
  }

  const handleSelectRound = (round: string) => {
    const isStandardRound = STANDARD_ROUNDS.includes(round as (typeof STANDARD_ROUNDS)[number])
    const isBackendPreliminaryRound = BACKEND_PRELIMINARY_ROUND_PATTERN.test(round)
    onSelectRound(round)

    if (isStandardRound || isBackendPreliminaryRound) {
      onSelectStage("preliminary")
      return
    }

    if (selectedStage === "preliminary") {
      onSelectStage("team")
    }
  }

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    setRoomDrafts((current) => {
      const next: Record<number, string> = {}
      const previousServerRooms = serverRoomsRef.current
      const nextServerRooms: Record<number, string> = {}

      matches?.content.forEach((match) => {
        const serverValue = match.location ?? ""
        nextServerRooms[match.id] = serverValue

        // A draft is unsaved when it differs from the server value it was typed
        // over, so a refetch (e.g. after saving a neighbouring row) keeps it.
        const draft = current[match.id]
        const previousServerValue = previousServerRooms[match.id] ?? ""
        const hasUnsavedEdit = draft !== undefined && draft.trim() !== previousServerValue.trim()
        next[match.id] = hasUnsavedEdit ? draft : serverValue
      })

      serverRoomsRef.current = nextServerRooms
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

    return (
      <td className="px-6 py-3">
        <div className="min-w-48">
          <input
            type="text"
            value={draft}
            aria-label={t("roomForMatch", { id: match.id })}
            placeholder={t("room")}
            onChange={(event) => {
              const value = event.target.value
              setRoomDrafts((current) => ({ ...current, [match.id]: value }))
            }}
            className="h-10 w-full rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none transition focus:border-[#2B3F63] disabled:bg-[#F5F7FC]"
          />
        </div>
      </td>
    )
  }

  const formatMatchStartTime = (value?: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(localeTags[locale], { dateStyle: "medium", timeStyle: "short" })
  }

  const getMatchStatus = (match: MatchResponse) => {
    if (!match.completed) return t("open")
    if (selectedStage === "preliminary" && match.participantScoresComplete === false) {
      return match.participantScoresRepairable === true
        ? t("needsCorrection")
        : t("needsCorrectionNotRepairable")
    }
    return t("completed")
  }

  const renderTeamCell = (match: MatchResponse, slot: (typeof teamSlotsToRender)[number]) => {
    const team = match[slot]
    if (!team) {
      return <td key={slot} className="px-6 py-4 text-lg font-semibold text-[#7A83A0]">-</td>
    }

    const won = resolveTeamCurrentWon(match, slot, team.id) ?? getPersistedWon(persistedResultDrafts, match.id, slot)
    const resultLabel = won === true ? t("winner") : won === false ? t("loss") : t("resultPending")

    return (
      <td key={slot} className="px-6 py-4 text-lg font-semibold text-[#0B1327]">
        <div>{team.name}</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[#6C738A]">{resultLabel}</div>
      </td>
    )
  }

  const renderDebaterCell = (match: MatchResponse, slot: (typeof debaterSlotsToRender)[number]) => {
    const debater = match[slot]
    if (!debater) {
      return <td key={slot} className="px-6 py-4 text-lg font-semibold text-[#7A83A0]">-</td>
    }

    const won = resolveDebaterCurrentWon(match, slot, debater.id) ?? getPersistedWon(persistedResultDrafts, match.id, slot)
    const resultLabel = won === true ? t("winner") : won === false ? t("loss") : t("resultPending")

    return (
      <td key={slot} className="px-6 py-4 text-lg font-semibold text-[#0B1327]">
        <div>{getParticipantName(debater, t("debater", { number: debater.id }))}</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[#6C738A]">{resultLabel}</div>
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
      debater1Id: toSelectValue(match.debater1?.id),
      debater2Id: toSelectValue(match.debater2?.id),
    })
    setMatchEditError(null)
  }

  const setDraftField = (field: keyof MatchDraft, value: string) => {
    setMatchDraft((current) => ({ ...current, [field]: value }))
  }

  const shouldShowFourTeamSlots = Boolean(
    editingMatch && !isSoloStage && (
      selectedStageFormat === "BPF" ||
      editingMatch.team3 ||
      editingMatch.team4
    )
  )

  const handleSaveMatchDraft = async () => {
    if (!editingMatch || !onUpdateMatch) return

    if (isSoloStage) {
      const selectedDebaterIds = [matchDraft.debater1Id, matchDraft.debater2Id].filter(Boolean)

      if (new Set(selectedDebaterIds).size !== selectedDebaterIds.length) {
        setMatchEditError(t("duplicateDebater"))
        return
      }

      if (selectedDebaterIds.length !== 2) {
        setMatchEditError(t("exactlyTwoDebaters"))
        return
      }

      await onUpdateMatch(editingMatch.id, {
        location: matchDraft.location.trim() || null,
        judgeId: toOptionalId(matchDraft.judgeId),
        debater1Id: toOptionalId(matchDraft.debater1Id),
        debater2Id: toOptionalId(matchDraft.debater2Id),
      })
      setEditingMatch(null)
      return
    }

    const selectedTeamIds = [
      matchDraft.team1Id,
      matchDraft.team2Id,
      shouldShowFourTeamSlots ? matchDraft.team3Id : "",
      shouldShowFourTeamSlots ? matchDraft.team4Id : "",
    ].filter(Boolean)

    if (new Set(selectedTeamIds).size !== selectedTeamIds.length) {
      setMatchEditError(t("duplicateTeam"))
      return
    }

    const requiredTeamCount = shouldShowFourTeamSlots ? 4 : 2
    if (selectedTeamIds.length !== requiredTeamCount) {
      setMatchEditError(
        shouldShowFourTeamSlots
          ? t("exactlyFourTeams")
          : t("exactlyTwoTeams")
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
            {t("loading")}
          </td>
        </tr>
      )
    }

    if (matchesError) {
      return (
        <tr>
          <td colSpan={tableColumnCount} className="px-6 py-10 text-center text-red-500">
            {t("loadFailed")}
          </td>
        </tr>
      )
    }

    if (!matches || matchRows.length === 0) {
      return (
        <tr>
          <td colSpan={tableColumnCount} className="px-6 py-10 text-center text-[#7A83A0]">
            {isFutureRound
              ? t("futureEmpty", { round: translateRoundLabel(selectedRound, t), current: currentRoundLabel })
              : t("noPairingsShort", { round: translateRoundLabel(selectedRound, t) })}
          </td>
        </tr>
      )
    }

    return matchRows.map((match) => (
      <tr key={match.id} className="border-b border-[#E2E6F2] last:border-none">
        {isSoloStage
          ? debaterSlotsToRender.map((slot) => renderDebaterCell(match, slot))
          : teamSlotsToRender.map((slot) => renderTeamCell(match, slot))}
        {renderRoomCell(match)}
        <td className="px-6 py-4 text-sm text-[#7A83A0]">{formatMatchStartTime(match.startTime)}</td>
        <td className="px-6 py-4 text-sm text-[#7A83A0]">{match.judge?.fullName ?? "-"}</td>
        <td className="px-6 py-4 text-sm text-[#4A5168]">{getMatchStatus(match)}</td>
        {canEditMatches ? (
          <td className="px-6 py-4 text-right">
            <button
              type="button"
              onClick={() => openMatchEditor(match)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D5D9E7] text-[#0B1327] transition hover:bg-[#F5F7FC]"
              aria-label={t("editMatch", { id: match.id })}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </td>
        ) : null}
      </tr>
    ))
  }

  return (
    <section
      data-pairings-hydrated={isHydrated ? "true" : "false"}
      className="rounded-3xl border border-[#E2E6F2] bg-white text-[#050A18] shadow-[0_20px_50px_rgba(12,21,44,0.08)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E6F2] px-6 py-4">
        <nav className="flex flex-wrap gap-2">
          {stageDescriptors.map((stage) => {
            const isActive = selectedStage === stage.id
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-2 rounded-2xl text-sm font-semibold transition-colors ${
                  isActive ? "bg-[#0B1327] text-white" : "border border-[#D5D9E7] text-[#0B1327] hover:bg-[#F5F7FC]"
                }`}
              >
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectStage(stage.id)}
                  className="px-4 py-2"
                >
                  {translateStageLabel(stage.label, t)} ({stage.format})
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
                        setDeleteConfirmStage(stage.id)
                      }}
                      aria-label={t("clearMatches")}
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
              ? t("deletePairings", {
                stage: translateStageLabel(stageDescriptors.find(({ id }) => id === deleteConfirmStage)?.label ?? t("currentRound"), t),
              })
              : ""}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("deleteDescription")}
          </DialogDescription>
          <DialogFooter className="mt-6 flex w-full flex-row gap-4 px-6">
            <button
              type="button"
              className="flex-1 rounded-2xl border border-[#0B1327] px-6 py-3 text-sm font-semibold text-[#4A5A7A] transition hover:bg-[#EEF2FB]"
              onClick={() => setDeleteConfirmStage(null)}
            >
              {t("cancel")}
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
              {t("delete")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editingMatch)} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent className="rounded-3xl border border-[#E2E6F2] bg-white p-8 shadow-[0_20px_70px_rgba(6,14,39,0.25)] sm:max-w-2xl">
          <DialogTitle className="text-xl font-semibold text-[#0B1327]">
            {editingMatch ? t("editMatchTitle", { id: editingMatch.id }) : t("editMatchGeneric")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("updateMatchDescription")}
          </DialogDescription>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            {isSoloStage ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  {t("debater", { number: 1 })}
                  <select
                    value={matchDraft.debater1Id}
                    onChange={(event) => setDraftField("debater1Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label={t("debater", { number: 1 })}
                  >
                    <option value="">{t("unassigned")}</option>
                    {participants?.content.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {getParticipantName(participant, `Debater ${participant.id}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  {t("debater", { number: 2 })}
                  <select
                    value={matchDraft.debater2Id}
                    onChange={(event) => setDraftField("debater2Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label={t("debater", { number: 2 })}
                  >
                    <option value="">{t("unassigned")}</option>
                    {participants?.content.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {getParticipantName(participant, `Debater ${participant.id}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  {t("team", { number: 1 })}
                  <select
                    value={matchDraft.team1Id}
                    onChange={(event) => setDraftField("team1Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label={t("team", { number: 1 })}
                  >
                    <option value="">{t("unassigned")}</option>
                    {teams?.content.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  {t("team", { number: 2 })}
                  <select
                    value={matchDraft.team2Id}
                    onChange={(event) => setDraftField("team2Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label={t("team", { number: 2 })}
                  >
                    <option value="">{t("unassigned")}</option>
                    {teams?.content.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {shouldShowFourTeamSlots ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  {t("team", { number: 3 })}
                  <select
                    value={matchDraft.team3Id}
                    onChange={(event) => setDraftField("team3Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label={t("team", { number: 3 })}
                  >
                    <option value="">{t("unassigned")}</option>
                    {teams?.content.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
                  {t("team", { number: 4 })}
                  <select
                    value={matchDraft.team4Id}
                    onChange={(event) => setDraftField("team4Id", event.target.value)}
                    className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                    aria-label={t("team", { number: 4 })}
                  >
                    <option value="">{t("unassigned")}</option>
                    {teams?.content.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
              {t("room")}
              <input
                type="text"
                value={matchDraft.location}
                onChange={(event) => setDraftField("location", event.target.value)}
                placeholder={t("room")}
                className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                aria-label={t("matchRoom")}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#4A5168]">
              {t("judge")}
              <select
                value={matchDraft.judgeId}
                onChange={(event) => setDraftField("judgeId", event.target.value)}
                className="h-10 rounded-lg border border-[#D5D9E7] px-3 text-sm text-[#0B1327] outline-none focus:border-[#2B3F63]"
                aria-label={t("judge")}
              >
                <option value="">{t("unassigned")}</option>
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
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={!onUpdateMatch || (editingMatch ? savingMatchId === editingMatch.id : false)}
              className="flex-1 rounded-2xl bg-[#2B3F63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E2D48] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSaveMatchDraft}
            >
              {editingMatch && savingMatchId === editingMatch.id ? t("saving") : t("saveMatch")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className={`w-full ${tableMinWidthClass} text-left text-sm`}>
          <thead>
            <tr className="bg-[#0B1327] text-xs uppercase tracking-[0.08em] text-white/70">
              {isSoloStage
                ? debaterSlotsToRender.map((slot, index) => (
                    <th key={slot} className="px-6 py-4">{t("debater", { number: index + 1 })}</th>
                  ))
                : teamSlotsToRender.map((slot, index) => (
                    <th key={slot} className="px-6 py-4">{t("fraction", { number: index + 1 })}</th>
                  ))}
              <th className="px-6 py-4">{t("room")}</th>
              <th className="px-6 py-4">{t("startTime")}</th>
              <th className="px-6 py-4">{t("judgeName")}</th>
              <th className="px-6 py-4">{t("status")}</th>
              {canEditMatches ? <th className="px-6 py-4 text-right">{t("actions")}</th> : null}
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
            {t("proceed")}
          </button>
          {workflowMessage ? (
            <p className="text-sm text-[#6C738A]" role="status">
              {workflowMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {onSaveAllRooms ? (
            <button
              type="button"
              disabled={!canUpdateRooms || dirtyRoomEntries.length === 0 || saveRoomsFeedback.status !== "idle"}
              onClick={() => void saveRoomsFeedback.run()}
              className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                saveRoomsFeedback.isSuccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-[#D5D9E7] text-[#0B1327] hover:bg-[#F5F7FC]"
              }`}
            >
              {saveRoomsFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {saveRoomsFeedback.isPending
                ? t("savingAllRooms")
                : saveRoomsFeedback.isSuccess
                  ? t("roomsSaved")
                  : t("saveAllRooms", { count: dirtyRoomEntries.length })}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canRandomizeSelectedRound || randomizeFeedback.status !== "idle"}
            onClick={() => void randomizeFeedback.run()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              randomizeFeedback.isSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[#D5D9E7] text-[#0B1327] hover:bg-[#F5F7FC]"
            }`}
          >
            {randomizeFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {randomizeFeedback.isPending ? t("randomizing") : randomizeFeedback.isSuccess ? t("randomized") : t("randomize")}
          </button>
          <button
            type="button"
            disabled={!canPublishSelectedRound || publishFeedback.status !== "idle"}
            onClick={() => void publishFeedback.run()}
            className={`inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              publishFeedback.isSuccess ? "bg-emerald-600" : "bg-[#0B1327] hover:bg-[#050918]"
            }`}
          >
            {publishFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {publishFeedback.isPending ? t("publishing") : publishFeedback.isSuccess ? t("published") : t("publish")}
          </button>
        </div>
      </div>

      <div className="rounded-b-3xl border-t border-white/5 bg-[#040814] px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {roundLabels.map((round) => (
            <button
              key={round}
              type="button"
              aria-pressed={selectedRound === round}
              onClick={() => handleSelectRound(round)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                selectedRound === round ? "bg-white text-[#050A18]" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {translateRoundLabel(round, t)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
