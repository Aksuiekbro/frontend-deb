"use client"

import { useState, useEffect, useMemo, useRef, type FormEvent } from "react"
import { useParams } from "next/navigation"
import { AddJudgeModal } from "@/components/tournament/AddJudgeModal"
import { AddPostModal } from "@/components/tournament/AddPostModal"
import { FeedbackSection } from "@/components/tournament/FeedbackSection"
import { InviteModal } from "@/components/tournament/InviteModal"
import { JudgesSection } from "@/components/tournament/JudgesSection"
import { MainInfoSection } from "@/components/tournament/MainInfoSection"
import { NewsSection } from "@/components/tournament/NewsSection"
import { PairingsSection } from "@/components/tournament/PairingsSection"
import type {
  StageDescriptor as PairingStageDescriptor,
  StageId as PairingStageId,
} from "@/components/tournament/PairingsSection"
import { ResultsSection } from "@/components/tournament/ResultsSection"
import { TeamsSection } from "@/components/tournament/TeamsSection"
import { TournamentHeader } from "@/components/tournament/TournamentHeader"
import { TournamentTabs } from "@/components/tournament/TournamentTabs"
import { EditTeamModal } from "@/components/tournament/EditTeamModal"
import { useTournamentVisibility } from "@/hooks/tournament/useTournamentVisibility"
import { useImageUpload } from "@/hooks/tournament/useImageUpload"
import { useRoundSelection } from "@/hooks/tournament/useRoundSelection"
import {
  useTournament,
  useTournamentParticipants,
  useTournamentTeams,
  useTournamentAnnouncements,
  useTournamentSchedules,
  useTournamentJudges,
  useTournamentOrganizers,
  useTournamentMainOrganizer,
  useTournamentFeedbacks,
  useNews,
  useCurrentUser,
  useRoundMatches,
} from "@/hooks/use-api"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { useToast } from "@/hooks/use-toast"
import type { MatchResultRequest, MatchUpdateRequest } from "@/types/tournament/match"
import type { SimpleTeamResponse, TeamResponse, TeamUpdateOrganizerRequest } from "@/types/tournament/team"
import type { JudgeRequest, JudgeResponse } from "@/types/tournament/judge"
import type { NewsRequest } from "@/types/news"
import type { AnnouncementRequest, AnnouncementResponse } from "@/types/tournament/announcement/announcement"
import type { ScheduleRequest } from "@/types/tournament/schedule"
import { DebateFormat } from "@/types/tournament/tournament"
import { RoundGroupType, type RoundGroupResponse } from "@/types/tournament/round/round-group"
import { displayRoundLabel } from "@/lib/round-label"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"
import type { SimpleUserResponse } from "@/types/user/user"

const catalog: TranslationCatalog = {
  en: {
    preliminary: "Preliminary", teamElimination: "Team elimination", soloElimination: "Solo elimination",
    mapUnavailable: "Map uploads are not supported by the backend yet.", mapUnavailableTitle: "Map upload unavailable",
    requiredPost: "Please add a title and description.", requiredImage: "Please add an image.",
    tooManyNewsImages: "A News post can contain one cover image and at most 10 gallery photos.",
    permission: "You do not have permission to perform this action.", server: "Server error. Please try again later.",
    missingInfo: "Missing information", judgeFields: "Please fill in name, email, and phone.", tryLater: "Please try again later.",
    selectRound: "Select a round first", loadingRound: "Round data is still loading.", noResults: "No results to submit",
    enterScores: "Enter scores for the current round before submitting.", startFirst: "Start tournament first",
    randomizeBefore: "Start the tournament before randomizing pairings.", publishBefore: "Start the tournament before publishing pairings.",
    confirmDelete: "Are you sure you want to delete {name}?", noClub: "No club", duplicate: "Duplicate participant",
    duplicateDescription: "A participant can only appear once in the same team.", missingParticipants: "Missing participants",
    addParticipant: "Add at least one participant before saving.", noChanges: "No changes to save",
    updateDetails: "Update the team details before saving.", saveChanges: "Save changes", submit: "Submit",
    editJudge: "Edit Judge", addJudge: "Add Judge", saveJudge: "Save Judge",
    failedUpdateAnnouncement: "Failed to update announcement", failedAddAnnouncement: "Failed to add announcement",
    announcementUpdated: "Announcement updated", contentSubmitted: "Content submitted", announcementUpdatedDescription: "{title} has been updated.",
    contentAddedDescription: "{title} has been added.",
    failedUpdateJudge: "Failed to update judge", failedAddJudge: "Failed to add judge", judgeUpdated: "Judge updated",
    judgeSubmitted: "Judge submitted", judgeDetailsUpdated: "The judge details have been updated.", judgeAddedRoster: "The judge has been added to the roster.",
    failedCheckJudgeIn: "Failed to check judge in", failedUncheckJudge: "Failed to uncheck judge", judgeCheckedIn: "Judge checked in",
    judgeUnchecked: "Judge unchecked", judgeCheckedInDescription: "{name} has been checked in.", judgeUncheckedDescription: "{name} has been unchecked.",
    failedRemoveJudge: "Failed to remove judge", judgeRemoved: "Judge removed", judgeRemovedDescription: "{name} has been removed.",
    failedAddComment: "Failed to add comment", commentAdded: "Comment added", commentAddedDescription: "Your comment has been added.",
    failedCheckTeamIn: "Failed to check team in", failedUncheckTeam: "Failed to uncheck team", teamCheckedIn: "Team checked in",
    teamUnchecked: "Team unchecked", teamCheckedInDescription: "The team has been checked in.", teamUncheckedDescription: "The team has been unchecked.",
    failedDisqualifyTeam: "Failed to disqualify team", teamDisqualified: "Team disqualified", teamDisqualifiedDescription: "The team has been disqualified.",
    failedRequalifyTeam: "Failed to requalify team", teamRequalified: "Team requalified", teamRestoredDescription: "The team has been restored.",
    tournamentStarted: "Tournament started", proceed: "Pairings and tournament workflow can now proceed.",
    failedStartTournament: "Failed to start tournament", failedProceedNextRound: "Failed to proceed to the next round",
    roundAdvanced: "Round advanced", failedAdvanceRound: "Failed to advance round", nextActive: "{name} is now active. Randomize it when you are ready.",
    proceeded: "The tournament has proceeded to the next round.", failedSubmitResults: "Failed to submit results", resultsSubmitted: "Results submitted",
    currentRoundResultsSaved: "The current round results have been saved.", failedRandomizePairings: "Failed to randomize pairings",
    pairingsRandomized: "Pairings randomized", pairingsRegenerated: "The selected round pairings have been regenerated.",
    failedPublishPairings: "Failed to publish pairings", pairingsPublished: "Pairings published", pairingsVisible: "The selected round pairings are now visible.",
    failedSaveRooms: "Failed to save rooms", roomsSaved: "{count} rooms saved", failedUpdateMatch: "Failed to update match",
    matchUpdated: "Match updated", matchChangesSaved: "The match changes have been saved.", failedClearMatches: "Failed to clear matches",
    matchesCleared: "Matches cleared", roundMatchesRemoved: "The selected round matches have been removed.", failedRemoveTeam: "Failed to remove team",
    teamRemoved: "Team removed", teamRemovedDescription: "{name} has been removed.", failedUpdateTeam: "Failed to update team",
    teamUpdated: "Team updated", teamUpdatedDescription: "{name} ({club}) has been updated.",
  },
  ru: {
    preliminary: "Отборочный этап", teamElimination: "Командная сетка", soloElimination: "Индивидуальная сетка",
    mapUnavailable: "Загрузка карты пока не поддерживается сервером.", mapUnavailableTitle: "Загрузка карты недоступна",
    requiredPost: "Добавьте заголовок и описание.", requiredImage: "Добавьте изображение.",
    tooManyNewsImages: "Новостной пост может содержать одну обложку и не более 10 фотографий в галерее.", permission: "У вас нет прав для выполнения этого действия.",
    server: "Ошибка сервера. Повторите попытку позже.", missingInfo: "Недостаточно данных", judgeFields: "Заполните имя, электронную почту и телефон.",
    tryLater: "Повторите попытку позже.", selectRound: "Сначала выберите раунд", loadingRound: "Данные раунда ещё загружаются.",
    noResults: "Нет результатов для отправки", enterScores: "Введите баллы текущего раунда перед отправкой.", startFirst: "Сначала начните турнир",
    randomizeBefore: "Начните турнир перед созданием жеребьёвки.", publishBefore: "Начните турнир перед публикацией жеребьёвки.",
    confirmDelete: "Удалить {name}?", noClub: "Без клуба", duplicate: "Повторный участник", duplicateDescription: "Участник может встречаться в команде только один раз.",
    missingParticipants: "Нет участников", addParticipant: "Добавьте хотя бы одного участника перед сохранением.", noChanges: "Нет изменений для сохранения",
    updateDetails: "Обновите данные команды перед сохранением.", saveChanges: "Сохранить изменения", submit: "Отправить",
    editJudge: "Изменить судью", addJudge: "Добавить судью", saveJudge: "Сохранить судью",
    failedUpdateAnnouncement: "Не удалось обновить объявление", failedAddAnnouncement: "Не удалось добавить объявление",
    announcementUpdated: "Объявление обновлено", contentSubmitted: "Материал отправлен", announcementUpdatedDescription: "{title} обновлено.", contentAddedDescription: "{title} добавлено.",
    failedUpdateJudge: "Не удалось обновить судью", failedAddJudge: "Не удалось добавить судью", judgeUpdated: "Судья обновлён", judgeSubmitted: "Судья добавлен",
    judgeDetailsUpdated: "Данные судьи обновлены.", judgeAddedRoster: "Судья добавлен в список.", failedCheckJudgeIn: "Не удалось отметить явку судьи",
    failedUncheckJudge: "Не удалось снять отметку явки судьи", judgeCheckedIn: "Судья отмечен", judgeUnchecked: "Отметка судьи снята",
    judgeCheckedInDescription: "{name} отмечен.", judgeUncheckedDescription: "С {name} снята отметка.", failedRemoveJudge: "Не удалось удалить судью",
    judgeRemoved: "Судья удалён", judgeRemovedDescription: "{name} удалён.", failedAddComment: "Не удалось добавить комментарий",
    commentAdded: "Комментарий добавлен", commentAddedDescription: "Ваш комментарий добавлен.", failedCheckTeamIn: "Не удалось отметить команду",
    failedUncheckTeam: "Не удалось снять отметку команды", teamCheckedIn: "Команда отмечена", teamUnchecked: "Отметка команды снята",
    teamCheckedInDescription: "Команда отмечена.", teamUncheckedDescription: "С команды снята отметка.", failedDisqualifyTeam: "Не удалось дисквалифицировать команду",
    teamDisqualified: "Команда дисквалифицирована", teamDisqualifiedDescription: "Команда дисквалифицирована.", failedRequalifyTeam: "Не удалось восстановить команду",
    teamRequalified: "Команда восстановлена", teamRestoredDescription: "Команда восстановлена.", tournamentStarted: "Турнир начат",
    proceed: "Теперь можно продолжить жеребьёвку и работу турнира.", failedStartTournament: "Не удалось начать турнир", failedProceedNextRound: "Не удалось перейти к следующему раунду",
    roundAdvanced: "Раунд продвинут", failedAdvanceRound: "Не удалось продвинуть раунд", nextActive: "{name} активирован. Создайте жеребьёвку, когда будете готовы.",
    proceeded: "Турнир перешёл к следующему раунду.", failedSubmitResults: "Не удалось отправить результаты", resultsSubmitted: "Результаты отправлены",
    currentRoundResultsSaved: "Результаты текущего раунда сохранены.", failedRandomizePairings: "Не удалось создать жеребьёвку", pairingsRandomized: "Жеребьёвка создана",
    pairingsRegenerated: "Жеребьёвка выбранного раунда создана заново.", failedPublishPairings: "Не удалось опубликовать жеребьёвку", pairingsPublished: "Жеребьёвка опубликована",
    pairingsVisible: "Жеребьёвка выбранного раунда теперь видна.", failedSaveRooms: "Не удалось сохранить аудитории", roomsSaved: "Сохранено аудиторий: {count}",
    failedUpdateMatch: "Не удалось обновить матч", matchUpdated: "Матч обновлён", matchChangesSaved: "Изменения матча сохранены.", failedClearMatches: "Не удалось очистить матчи",
    matchesCleared: "Матчи очищены", roundMatchesRemoved: "Матчи выбранного раунда удалены.", failedRemoveTeam: "Не удалось удалить команду", teamRemoved: "Команда удалена",
    teamRemovedDescription: "{name} удалена.", failedUpdateTeam: "Не удалось обновить команду", teamUpdated: "Команда обновлена", teamUpdatedDescription: "Команда {name} ({club}) обновлена.",
  },
  kk: {
    preliminary: "Іріктеу кезеңі", teamElimination: "Командалық тор", soloElimination: "Жеке тор", mapUnavailable: "Картаны жүктеуге сервер әзірге қолдау көрсетпейді.",
    mapUnavailableTitle: "Картаны жүктеу қолжетімсіз", requiredPost: "Тақырып пен сипаттаманы қосыңыз.", requiredImage: "Сурет қосыңыз.",
    tooManyNewsImages: "Жаңалық жазбасында бір мұқаба және галереяда ең көбі 10 фотосурет болуы мүмкін.",
    permission: "Бұл әрекетті орындауға құқықтарыңыз жоқ.", server: "Сервер қатесі. Кейінірек қайталап көріңіз.", missingInfo: "Ақпарат жеткіліксіз",
    judgeFields: "Аты-жөнін, электрондық поштаны және телефонды толтырыңыз.", tryLater: "Кейінірек қайталап көріңіз.", selectRound: "Алдымен раундты таңдаңыз",
    loadingRound: "Раунд деректері әлі жүктелуде.", noResults: "Жіберетін нәтиже жоқ", enterScores: "Жібермес бұрын ағымдағы раундтың ұпайларын енгізіңіз.", startFirst: "Алдымен турнирді бастаңыз",
    randomizeBefore: "Жеребе жасамас бұрын турнирді бастаңыз.", publishBefore: "Жеребені жарияламас бұрын турнирді бастаңыз.", confirmDelete: "{name} өшірілсін бе?", noClub: "Клуб жоқ",
    duplicate: "Қайталанған қатысушы", duplicateDescription: "Қатысушы бір командада бір рет қана болуы мүмкін.", missingParticipants: "Қатысушылар жоқ", addParticipant: "Сақтамас бұрын кемінде бір қатысушы қосыңыз.",
    noChanges: "Сақтайтын өзгеріс жоқ", updateDetails: "Сақтамас бұрын команда мәліметтерін жаңартыңыз.", saveChanges: "Өзгерістерді сақтау", submit: "Жіберу",
    editJudge: "Судьяны өзгерту", addJudge: "Судья қосу", saveJudge: "Судьяны сақтау", failedUpdateAnnouncement: "Хабарландыруды жаңарту мүмкін болмады", failedAddAnnouncement: "Хабарландыруды қосу мүмкін болмады",
    announcementUpdated: "Хабарландыру жаңартылды", contentSubmitted: "Материал жіберілді", announcementUpdatedDescription: "{title} жаңартылды.", contentAddedDescription: "{title} қосылды.",
    failedUpdateJudge: "Судьяны жаңарту мүмкін болмады", failedAddJudge: "Судьяны қосу мүмкін болмады", judgeUpdated: "Судья жаңартылды", judgeSubmitted: "Судья қосылды",
    judgeDetailsUpdated: "Судья мәліметтері жаңартылды.", judgeAddedRoster: "Судья тізімге қосылды.", failedCheckJudgeIn: "Судьяны белгілеу мүмкін болмады", failedUncheckJudge: "Судья белгісін алып тастау мүмкін болмады",
    judgeCheckedIn: "Судья белгіленді", judgeUnchecked: "Судья белгісі алынды", judgeCheckedInDescription: "{name} белгіленді.", judgeUncheckedDescription: "{name} белгісі алынды.",
    failedRemoveJudge: "Судьяны өшіру мүмкін болмады", judgeRemoved: "Судья өшірілді", judgeRemovedDescription: "{name} өшірілді.", failedAddComment: "Пікірді қосу мүмкін болмады",
    commentAdded: "Пікір қосылды", commentAddedDescription: "Пікіріңіз қосылды.", failedCheckTeamIn: "Команданы белгілеу мүмкін болмады", failedUncheckTeam: "Команда белгісін алып тастау мүмкін болмады",
    teamCheckedIn: "Команда белгіленді", teamUnchecked: "Команда белгісі алынды", teamCheckedInDescription: "Команда белгіленді.", teamUncheckedDescription: "Команда белгісі алынды.",
    failedDisqualifyTeam: "Команданы дисквалификациялау мүмкін болмады", teamDisqualified: "Команда дисквалификацияланды", teamDisqualifiedDescription: "Команда дисквалификацияланды.",
    failedRequalifyTeam: "Команданы қалпына келтіру мүмкін болмады", teamRequalified: "Команда қалпына келтірілді", teamRestoredDescription: "Команда қалпына келтірілді.",
    tournamentStarted: "Турнир басталды", proceed: "Енді жеребе мен турнир жұмысын жалғастыруға болады.", failedStartTournament: "Турнирді бастау мүмкін болмады", failedProceedNextRound: "Келесі раундқа өту мүмкін болмады",
    roundAdvanced: "Раунд жылжытылды", failedAdvanceRound: "Раундты жылжыту мүмкін болмады", nextActive: "{name} белсенді. Дайын болғанда жеребе жасаңыз.", proceeded: "Турнир келесі раундқа өтті.",
    failedSubmitResults: "Нәтижелерді жіберу мүмкін болмады", resultsSubmitted: "Нәтижелер жіберілді", currentRoundResultsSaved: "Ағымдағы раунд нәтижелері сақталды.",
    failedRandomizePairings: "Жеребе жасау мүмкін болмады", pairingsRandomized: "Жеребе жасалды", pairingsRegenerated: "Таңдалған раунд жеребесі қайта жасалды.",
    failedPublishPairings: "Жеребені жариялау мүмкін болмады", pairingsPublished: "Жеребе жарияланды", pairingsVisible: "Таңдалған раунд жеребесі енді көрінеді.",
    failedSaveRooms: "Аудиторияларды сақтау мүмкін болмады", roomsSaved: "Сақталған аудитория саны: {count}", failedUpdateMatch: "Матчты жаңарту мүмкін болмады",
    matchUpdated: "Матч жаңартылды", matchChangesSaved: "Матч өзгерістері сақталды.", failedClearMatches: "Матчтарды тазалау мүмкін болмады", matchesCleared: "Матчтар тазартылды", roundMatchesRemoved: "Таңдалған раунд матчтары өшірілді.",
    failedRemoveTeam: "Команданы өшіру мүмкін болмады", teamRemoved: "Команда өшірілді", teamRemovedDescription: "{name} өшірілді.", failedUpdateTeam: "Команданы жаңарту мүмкін болмады", teamUpdated: "Команда жаңартылды", teamUpdatedDescription: "{name} ({club}) жаңартылды.",
  },
}

const STAGE_BY_ROUND_GROUP_TYPE: Partial<Record<RoundGroupType, PairingStageId>> = {
  [RoundGroupType.PRELIMINARY]: "preliminary",
  [RoundGroupType.TEAM_ELIMINATION]: "team",
  [RoundGroupType.SOLO_ELIMINATION]: "solo",
}

const PAIRING_FORMAT_BY_DEBATE_FORMAT: Partial<Record<DebateFormat, PairingStageDescriptor["format"]>> = {
  [DebateFormat.APF]: "APF",
  [DebateFormat.BPF]: "BPF",
  [DebateFormat.LD]: "LD",
}

type ResultsFormat = "APF" | "BPF" | "LD"
const RESULTS_FORMAT_ORDER: readonly ResultsFormat[] = ["APF", "BPF", "LD"]

const PAIRING_STAGE_ORDER: PairingStageId[] = ["preliminary", "team", "solo"]
const PAIRING_STAGE_LABELS: Record<PairingStageId, string> = {
  preliminary: "Preliminary",
  team: "Team elimination",
  solo: "Solo elimination",
}

function firstConfiguredRoundName(group?: RoundGroupResponse) {
  return group?.rounds
    ?.slice()
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]?.name
}

function resultsRoundGroup(
  roundGroups: readonly RoundGroupResponse[] | null | undefined,
  format: ResultsFormat,
) {
  const preferredType = format === "LD"
    ? RoundGroupType.SOLO_ELIMINATION
    : RoundGroupType.PRELIMINARY
  const preferred = roundGroups?.find(
    (group) => group.type === preferredType && String(group.format) === format,
  )
  return preferred
    ?? roundGroups?.find((group) => String(group.format) === format)
    ?? roundGroups?.find((group) => group.type === RoundGroupType.PRELIMINARY)
}

function resultsStageForRoundGroup(group: RoundGroupResponse | undefined, format: ResultsFormat): PairingStageId {
  return (group ? STAGE_BY_ROUND_GROUP_TYPE[group.type] : undefined)
    ?? (format === "LD" ? "solo" : "preliminary")
}

function getAvailablePairingStageDescriptors(
  roundGroups: readonly RoundGroupResponse[] | null | undefined,
): PairingStageDescriptor[] {
  return PAIRING_STAGE_ORDER.flatMap((stage) => {
    const group = roundGroups?.find((candidate) => STAGE_BY_ROUND_GROUP_TYPE[candidate.type] === stage)
    const format = group ? PAIRING_FORMAT_BY_DEBATE_FORMAT[group.format] : undefined

    if (!group || !format) return []

    return [{
      id: stage,
      label: PAIRING_STAGE_LABELS[stage],
      format,
      defaultRound: group.rounds
        ?.slice()
        .sort((a, b) => a.roundNumber - b.roundNumber)[0]?.name,
    }]
  })
}

const TOURNAMENT_ROSTER_PAGEABLE = { page: 0, size: 100 }

export default function TournamentDetailPage() {
  const t = useTranslations(catalog)
  const params = useParams()
  const tournamentId = parseInt(params.id as string)
  const { user: currentUser } = useCurrentUser()
  const { toast } = useToast()

  // API hooks
  const { tournament, isLoading: tournamentLoading, error: tournamentError, mutate: mutateTournament } = useTournament(tournamentId)
  const { participants } = useTournamentParticipants(tournamentId, undefined, TOURNAMENT_ROSTER_PAGEABLE)
  const { teams, isLoading: teamsLoading, error: teamsError, mutate: mutateTeams } = useTournamentTeams(
    tournamentId,
    TOURNAMENT_ROSTER_PAGEABLE
  )
  const {
    announcements,
    isLoading: announcementsLoading,
    error: announcementsError,
    mutate: mutateAnnouncements,
  } = useTournamentAnnouncements(tournamentId)
  const {
    schedules,
    isLoading: schedulesLoading,
    error: schedulesError,
    mutate: mutateSchedules,
  } = useTournamentSchedules(tournamentId)
  const { judges, isLoading: judgesLoading, error: judgesError, mutate: mutateJudges } = useTournamentJudges(
    tournamentId,
    undefined,
    TOURNAMENT_ROSTER_PAGEABLE
  )
  const { organizers, isLoading: organizersLoading } = useTournamentOrganizers(tournamentId)
  const { mainOrganizer } = useTournamentMainOrganizer(tournamentId)
  const inviteExistingOrganizers = useMemo<SimpleUserResponse[]>(() => {
    const organizersById = new Map<number, SimpleUserResponse>()
    if (mainOrganizer) organizersById.set(mainOrganizer.id, mainOrganizer)
    organizers?.forEach((organizer) => {
      if (organizer) organizersById.set(organizer.id, organizer)
    })
    return Array.from(organizersById.values())
  }, [mainOrganizer, organizers])
  const { feedbacks, isLoading: feedbacksLoading, error: feedbacksError, mutate: mutateFeedbacks } = useTournamentFeedbacks(
    tournamentId,
    undefined,
    { page: 0, size: 20, sort: ['timestamp,desc'] }
  )

  const [activeTab, setActiveTab] = useState('Main Info')
  const [isMainInfoDropdownOpen, setIsMainInfoDropdownOpen] = useState(false)
  const [selectedMainInfoOption, setSelectedMainInfoOption] = useState<'Announcements' | 'Schedule' | 'Map'>('Announcements')
  const [isResultsDropdownOpen, setIsResultsDropdownOpen] = useState(false)
  const [selectedResultsOption, setSelectedResultsOption] = useState<'APF' | 'BPF' | 'LD'>('APF')
  const [resultsSubTab, setResultsSubTab] = useState<'Speaker Score' | 'Results'>('Speaker Score')
  const [selectedPairingStage, setSelectedPairingStage] = useState<PairingStageId>('preliminary')
  const [selectedPairingRound, setSelectedPairingRound] = useState('Round 1')
  const [selectedResultsStage, setSelectedResultsStage] = useState<PairingStageId>('preliminary')
  const [selectedResultsRound, setSelectedResultsRound] = useState('Round 1')
  const [bpfSubTab] = useState('BPF Results')
  const [activeResultsSection, setActiveResultsSection] = useState('APF Speaker Score')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [teamEditModalData, setTeamEditModalData] = useState<{ id: number; name: string; club: string; speakerUsernames: string[] } | null>(null)
  const [isSavingTeam, setIsSavingTeam] = useState(false)
  const [startingTournament, setStartingTournament] = useState(false)

  const {
    imagePreviews,
    uploadErrors,
    postImages,
    dzAnimate,
    formatBytes,
    handleImageUpload,
    handleDragOver,
    handleDrop,
    removeImageByKey,
    resetUploads,
  } = useImageUpload()

  const tournamentMembers = participants?.content.slice(0, 5) ?? []
  const [inviteModalTab, setInviteModalTab] = useState<'invite' | 'copy-link'>('invite')  
  const [checkInStatus, setCheckInStatus] = useState<{[key: number]: boolean}>({})
  
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false)
  const [isAddJudgeModalOpen, setIsAddJudgeModalOpen] = useState(false)
  const [modalContext, setModalContext] = useState<'announcements' | 'schedule' | 'map' | 'news' | ''>('')
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementResponse | null>(null)
  const [postTitle, setPostTitle] = useState('')
  const [postDescription, setPostDescription] = useState('')
  const [postSubmitting, setPostSubmitting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [judgeModalMode, setJudgeModalMode] = useState<'add' | 'edit'>('add')
  const [judgeForm, setJudgeForm] = useState<JudgeRequest>({ fullName: '', email: '', phoneNumber: '' })
  const [editingJudge, setEditingJudge] = useState<JudgeResponse | null>(null)
  const [judgeSubmitting, setJudgeSubmitting] = useState(false)
  const [judgeError, setJudgeError] = useState<string | null>(null)
  const [updatingJudgeId, setUpdatingJudgeId] = useState<number | null>(null)
  const [deletingJudgeId, setDeletingJudgeId] = useState<number | null>(null)
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null)
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null)
  const [submittingResults, setSubmittingResults] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsDropdownRef = useRef<HTMLDivElement>(null)
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<'Important' | 'Update' | 'Info'>('Info')

  const { isTournamentEnabled, toggleTournamentLoading, handleTournamentToggle } = useTournamentVisibility({
    tournament,
    toast,
  })

  const effectiveStage: PairingStageId = activeTab === 'Results and Statistics'
    ? selectedResultsStage
    : selectedPairingStage
  const effectiveSelectedRound = activeTab === 'Results and Statistics'
    ? selectedResultsRound
    : selectedPairingRound

  const {
    selectedRoundGroupId,
    selectedRoundId,
    selectedRoundNumber,
    currentRoundNumber,
    selectedRoundGroup,
    selectedRound: selectedRoundRecord,
    rounds,
    matches,
    isLoading: matchesLoading,
    error: matchesError,
    mutate: mutateMatches,
    mutateRoundGroups,
    mutateRounds,
    roundGroups,
  } = useRoundSelection({
    tournamentId,
    selectedStage: effectiveStage,
    selectedRoundLabel: effectiveSelectedRound,
    pageable: { page: 0, size: 50 },
  })
  const {
    roundMatches: preliminaryRoundMatches,
    isLoading: preliminaryRoundMatchesLoading,
    error: preliminaryRoundMatchesError,
    mutate: mutatePreliminaryRoundMatches,
  } = useRoundMatches(tournamentId, selectedRoundGroupId ?? undefined, rounds, { page: 0, size: 100 })

  const resultStorageKey =
    typeof selectedRoundGroupId === 'number' && typeof selectedRoundId === 'number'
      ? `tournament:${tournamentId}:round-group:${selectedRoundGroupId}:round:${selectedRoundId}:match-results`
      : undefined

  const availablePairingStages = useMemo(
    () => getAvailablePairingStageDescriptors(roundGroups).map((stage) => ({
      ...stage,
      label: t(stage.id === "preliminary" ? "preliminary" : stage.id === "team" ? "teamElimination" : "soloElimination"),
    })),
    [roundGroups, t],
  )
  const effectivePairingStage = selectedRoundGroup
    ? STAGE_BY_ROUND_GROUP_TYPE[selectedRoundGroup.type] ?? selectedPairingStage
    : selectedPairingStage
  const effectivePairingRound = selectedRoundRecord?.name
    ?? (typeof currentRoundNumber === "number" ? `Round ${currentRoundNumber}` : selectedPairingRound)

  const teamEliminationRounds = roundGroups?.find(
    (group) => group.type === RoundGroupType.TEAM_ELIMINATION && String(group.format) === selectedResultsOption,
  )?.rounds ?? []
  const soloEliminationRounds = roundGroups?.find(
    (group) => group.type === RoundGroupType.SOLO_ELIMINATION && String(group.format) === "LD",
  )?.rounds ?? []
  const resultsEliminationRounds = selectedResultsOption === "LD"
    ? soloEliminationRounds
    : teamEliminationRounds

  const stageForResultsSection = (section: string): PairingStageId => {
    if (selectedResultsOption === "LD") return "solo"

    const isFormatSection = section === `${selectedResultsOption} Results`
      || section === `${selectedResultsOption} Speaker Score`
    if (isFormatSection) {
      return resultsStageForRoundGroup(
        resultsRoundGroup(roundGroups, selectedResultsOption),
        selectedResultsOption,
      )
    }

    const sectionLabel = displayRoundLabel(section)
    const isConfiguredTeamRound = teamEliminationRounds.some(
      (round) => displayRoundLabel(round.name) === sectionLabel,
    )
    const isLegacyEliminationRound = new Set(["1/16", "1/8", "1/4", "1/2", "Final"]).has(sectionLabel)
    return isConfiguredTeamRound || (teamEliminationRounds.length > 0 && isLegacyEliminationRound)
      ? "team"
      : "preliminary"
  }

  const handleActiveResultsSectionChange = (section: string) => {
    setActiveResultsSection(section)
    setSelectedResultsStage(stageForResultsSection(section))
  }

  const handleSelectedResultsRoundChange = (round: string) => {
    setSelectedResultsRound(round)
  }

  useEffect(() => {
    if (activeTab !== "Results and Statistics" || !selectedRoundRecord) return

    if (displayRoundLabel(selectedResultsRound) !== displayRoundLabel(selectedRoundRecord.name)) {
      setSelectedResultsRound(selectedRoundRecord.name)
    }

    const isResultsFormatSection =
      activeResultsSection === `${selectedResultsOption} Results` ||
      activeResultsSection === `${selectedResultsOption} Speaker Score`
    if (
      !isResultsFormatSection &&
      displayRoundLabel(activeResultsSection) !== displayRoundLabel(selectedRoundRecord.name)
    ) {
      setActiveResultsSection(selectedRoundRecord.name)
    }
  }, [activeResultsSection, activeTab, selectedResultsOption, selectedResultsRound, selectedRoundRecord])

  const resultsFormatOptions = useMemo<ResultsFormat[]>(() => {
    const configuredFormats = new Set(roundGroups?.map((group) => String(group.format)) ?? [])
    return RESULTS_FORMAT_ORDER.filter((format) => configuredFormats.has(format))
  }, [roundGroups])

  const handleAddPost = async () => {
    const isAnnouncement = modalContext === 'announcements'
    const isSchedule = modalContext === 'schedule'
    const isMap = modalContext === 'map'
    const isNews = modalContext === 'news'
    const isEditingAnnouncement = isAnnouncement && editingAnnouncement
    const title = postTitle.trim()
    const description = postDescription.trim()
    const [primaryImage, ...extraImages] = postImages

    if (isMap) {
      const message = t("mapUnavailable")
      setPostError(message)
      toast({
        title: t("mapUnavailableTitle"),
        description: message,
        variant: 'destructive',
      })
      return
    }

    if (!title || !description) {
      setPostError(t("requiredPost"))
      return
    }

    if (!primaryImage && !isEditingAnnouncement) {
      setPostError(t("requiredImage"))
      return
    }

    if (isNews && extraImages.length > 10) {
      setPostError(t("tooManyNewsImages"))
      return
    }

    try {
      setPostSubmitting(true)
      setPostError(null)

      if (isAnnouncement) {
        const body: AnnouncementRequest = { title, content: description, tags: [selectedNewsCategory] }
        const response = isEditingAnnouncement
          ? await api.updateAnnouncement(tournamentId, editingAnnouncement.id, body, primaryImage)
          : await api.createAnnouncement(tournamentId, body, primaryImage)
        if (!response.ok) throw new Error(await readResponseError(response, {
          fallback: isEditingAnnouncement ? t("failedUpdateAnnouncement") : t("failedAddAnnouncement"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
        await mutateAnnouncements()
      } else if (isSchedule) {
        const body: ScheduleRequest = { name: title, description }
        const response = await api.addSchedule(tournamentId, body, primaryImage)
        if (!response.ok) throw new Error(await readResponseError(response, {
          fallback: t("server"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
        await mutateSchedules()
      } else if (isNews) {
        const body: NewsRequest = {
          title,
          content: description,
          tags: [`tournament:${tournamentId}`],
        }
        const response = await api.createNews(body, primaryImage, extraImages)
        if (!response.ok) throw new Error(await readResponseError(response, {
          fallback: t("server"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
        await mutateNews()
      } else {
        return
      }

      toast({
        title: isEditingAnnouncement ? t("announcementUpdated") : t("contentSubmitted"),
        description: isEditingAnnouncement
          ? t("announcementUpdatedDescription", { title })
          : t("contentAddedDescription", { title }),
      })
      setPostTitle('')
      setPostDescription('')
      setEditingAnnouncement(null)
      resetUploads()
      setIsAddPostModalOpen(false)
      setModalContext('')
    } catch (e) {
      const message = e instanceof Error ? e.message : t("server")
      setPostError(message)
      console.error('Failed to submit content', e)
      toast({
        title: t("server"),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setPostSubmitting(false)
    }
  }

  const handleSubmitJudge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { fullName, email, phoneNumber } = judgeForm
    const hasAllFields = [fullName, email, phoneNumber].every((value) => Boolean(value && value.trim()))

    if (!hasAllFields) {
      toast({
        title: t("missingInfo"),
        description: t("judgeFields"),
        variant: 'destructive'
      })
      return
    }

    setJudgeSubmitting(true)
    setJudgeError(null)

    try {
      const judgePayload = {
        fullName: fullName?.trim(),
        email: email?.trim(),
        phoneNumber: phoneNumber?.trim(),
        ...(judgeModalMode === 'edit' && editingJudge ? { checkedIn: editingJudge.checkedIn } : {}),
      }
      const response = judgeModalMode === 'edit' && editingJudge
        ? await api.updateJudge(tournamentId, editingJudge.id, judgePayload)
        : await api.addJudge(tournamentId, judgePayload)

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: judgeModalMode === 'edit' ? t("failedUpdateJudge") : t("failedAddJudge"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      toast({
        title: judgeModalMode === 'edit' ? t("judgeUpdated") : t("judgeSubmitted"),
        description: judgeModalMode === 'edit' ? t("judgeDetailsUpdated") : t("judgeAddedRoster"),
      })

      await mutateJudges()
      setJudgeForm({ fullName: '', email: '', phoneNumber: '' })
      setEditingJudge(null)
      setJudgeModalMode('add')
      setIsAddJudgeModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : t("server")
      setJudgeError(message)
      toast({
        title: judgeModalMode === 'edit' ? t("failedUpdateJudge") : t("failedAddJudge"),
        description: message,
        variant: 'destructive'
      })
    } finally {
      setJudgeSubmitting(false)
    }
  }

  const openAddJudgeModal = () => {
    setJudgeModalMode('add')
    setEditingJudge(null)
    setJudgeForm({ fullName: '', email: '', phoneNumber: '' })
    setJudgeError(null)
    setIsAddJudgeModalOpen(true)
  }

  const openEditJudgeModal = (judge: JudgeResponse) => {
    setJudgeModalMode('edit')
    setEditingJudge(judge)
    setJudgeForm({
      fullName: judge.fullName,
      email: judge.email || '',
      phoneNumber: judge.phoneNumber || '',
    })
    setJudgeError(null)
    setIsAddJudgeModalOpen(true)
  }

  const handleToggleJudgeCheckIn = async (judge: JudgeResponse) => {
    if (!isOrganizer) {
      toast({
        title: t("permission"),
        description: t("permission"),
        variant: 'destructive',
      })
      return
    }

    const nextCheckedIn = !judge.checkedIn

    try {
      setUpdatingJudgeId(judge.id)
      const response = await api.updateJudge(tournamentId, judge.id, {
        fullName: judge.fullName,
        email: judge.email || undefined,
        phoneNumber: judge.phoneNumber || undefined,
        checkedIn: nextCheckedIn,
      })

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: nextCheckedIn ? t("failedCheckJudgeIn") : t("failedUncheckJudge"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateJudges()
      toast({
        title: nextCheckedIn ? t("judgeCheckedIn") : t("judgeUnchecked"),
        description: nextCheckedIn
          ? t("judgeCheckedInDescription", { name: judge.fullName })
          : t("judgeUncheckedDescription", { name: judge.fullName }),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to update judge check-in', error)
      toast({
        title: nextCheckedIn ? t("failedCheckJudgeIn") : t("failedUncheckJudge"),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setUpdatingJudgeId(null)
    }
  }

  const handleDeleteJudge = async (judge: JudgeResponse) => {
    if (!isOrganizer) {
      toast({
        title: t("permission"),
        description: t("permission"),
        variant: 'destructive',
      })
      return
    }

    const confirmed = window.confirm(t("confirmDelete", { name: judge.fullName }))
    if (!confirmed) return

    try {
      setDeletingJudgeId(judge.id)
      const response = await api.deleteJudge(tournamentId, judge.id)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedRemoveJudge"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateJudges()
      toast({
        title: t("judgeRemoved"),
        description: t("judgeRemovedDescription", { name: judge.fullName }),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to remove judge', error)
      toast({
        title: t("failedRemoveJudge"),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setDeletingJudgeId(null)
    }
  }

  const handleAddAnnouncementComment = async (announcementId: number, content: string) => {
    const trimmedContent = content.trim()
    if (!trimmedContent) return

    try {
      const response = await api.addAnnouncementComment(tournamentId, announcementId, { content: trimmedContent })
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedAddComment"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateAnnouncements()
      toast({
        title: t("commentAdded"),
        description: t("commentAddedDescription"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("failedAddComment")
      console.error('Failed to add announcement comment', error)
      toast({
        title: t("failedAddComment"),
        description: message,
        variant: 'destructive',
      })
      throw error
    }
  }


  const isOrganizer = Boolean(
    currentUser &&
    organizers?.some((organizer) => organizer?.id === currentUser.id)
  )
  const canControlVisibility = Boolean(
    currentUser && mainOrganizer?.id === currentUser.id
  )
  const canManageTeams = isOrganizer

  useEffect(() => {
    if (!teams?.content) return

    setCheckInStatus((prev) => {
      let changed = false
      const next = { ...prev }

      teams.content.forEach((team) => {
        const teamWithCheckIn = team as SimpleTeamResponse & { checkedIn?: boolean }
        const nextValue = typeof teamWithCheckIn.checkedIn === 'boolean'
          ? teamWithCheckIn.checkedIn
          : (prev[team.id] ?? false)

        if (next[team.id] !== nextValue) {
          next[team.id] = nextValue
          changed = true
        }
      })

      return changed ? next : prev
    })
  }, [teams?.content])

  const handleToggleCheckIn = async (teamId: number) => {
    if (!canManageTeams) {
      toast({
        title: t("permission"),
        description: t("permission"),
        variant: 'destructive',
      })
      return
    }

    const wasCheckedIn = checkInStatus[teamId] ?? false
    const nextCheckedIn = !wasCheckedIn

    setCheckInStatus((prev) => ({
      ...prev,
      [teamId]: nextCheckedIn,
    }))

    try {
      const response = nextCheckedIn
        ? await api.checkInTeam(tournamentId, teamId)
        : await api.uncheckInTeam(tournamentId, teamId)

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: nextCheckedIn ? t("failedCheckTeamIn") : t("failedUncheckTeam"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateTeams()
      toast({
        title: nextCheckedIn ? t("teamCheckedIn") : t("teamUnchecked"),
        description: nextCheckedIn ? t("teamCheckedInDescription") : t("teamUncheckedDescription"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      setCheckInStatus((prev) => ({
        ...prev,
        [teamId]: wasCheckedIn,
      }))
      console.error('Failed to update team check-in', error)
      toast({
        title: nextCheckedIn ? t("failedCheckTeamIn") : t("failedUncheckTeam"),
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleDisqualifyTeam = async (teamId: number) => {
    if (!canManageTeams) {
      toast({
        title: t("permission"),
        description: t("permission"),
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.disqualifyTeam(tournamentId, teamId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedDisqualifyTeam"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateTeams()
      toast({
        title: t("teamDisqualified"),
        description: t("teamDisqualifiedDescription"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to disqualify team', error)
      toast({
        title: t("failedDisqualifyTeam"),
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleRequalifyTeam = async (teamId: number) => {
    if (!canManageTeams) {
      toast({
        title: t("permission"),
        description: t("permission"),
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.requalifyTeam(tournamentId, teamId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedRequalifyTeam"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateTeams()
      toast({
        title: t("teamRequalified"),
        description: t("teamRestoredDescription"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to requalify team', error)
      toast({
        title: t("failedRequalifyTeam"),
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleStartTournament = async () => {
    if (!isOrganizer || startingTournament) return

    try {
      setStartingTournament(true)
      const response = await api.startTournament(tournamentId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedStartTournament"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      toast({
        title: t("tournamentStarted"),
        description: t("proceed"),
      })
      await Promise.all([
        mutateTournament?.(),
        mutateMatches?.(),
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to start tournament', error)
      toast({
        title: t("failedStartTournament"),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setStartingTournament(false)
    }
  }

  const handleProceedToNextRound = async () => {
    if (!isOrganizer) return

    if (typeof selectedRoundGroupId !== 'number') {
      toast({
        title: t("selectRound"),
        description: t("loadingRound"),
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.proceedToNextRound(tournamentId, selectedRoundGroupId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedProceedNextRound"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      const nextRoundNumber = (currentRoundNumber ?? selectedRoundNumber ?? 0) + 1
      const nextRound = rounds?.find((round) => round.roundNumber === nextRoundNumber)

      await Promise.all([
        mutateRoundGroups?.(),
        mutateRounds?.(),
        mutateMatches?.(),
      ])

      if (nextRound) {
        setSelectedPairingRound(nextRound.name)
      }

      toast({
        title: t("roundAdvanced"),
        description: nextRound
          ? t("nextActive", { name: nextRound.name })
          : t("proceeded"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to proceed to next round', error)
      toast({
        title: t("failedAdvanceRound"),
        description: message,
        variant: 'destructive',
      })
    }
  }

  const getSelectedRoundIds = () => {
    if (typeof selectedRoundGroupId === 'number' && typeof selectedRoundId === 'number') {
      return { roundGroupId: selectedRoundGroupId, roundId: selectedRoundId }
    }

    toast({
      title: t("selectRound"),
      description: t("loadingRound"),
      variant: 'destructive',
    })
    return null
  }

  const handleSubmitResults = async (results: MatchResultRequest[]) => {
    if (!isOrganizer || submittingResults) return false

    if (!results.length) {
      toast({
        title: t("noResults"),
        description: t("enterScores"),
        variant: 'destructive',
      })
      return false
    }

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return false

    try {
      setSubmittingResults(true)
      const response = await api.submitMatchResults(
        tournamentId,
        selectedIds.roundGroupId,
        selectedIds.roundId,
        results,
      )

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedSubmitResults"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await Promise.all([
        mutateMatches?.(),
        mutateRoundGroups?.(),
        mutateRounds?.(),
        mutatePreliminaryRoundMatches?.(),
      ])
      toast({
        title: t("resultsSubmitted"),
        description: t("currentRoundResultsSaved"),
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to submit match results', error)
      toast({
        title: t("failedSubmitResults"),
        description: message,
        variant: 'destructive',
      })
      return false
    } finally {
      setSubmittingResults(false)
    }
  }

  const handleRandomizePairings = async () => {
    if (!isOrganizer) return false

    if (!tournament?.started) {
      toast({
        title: t("startFirst"),
        description: t("randomizeBefore"),
        variant: 'destructive',
      })
      return false
    }

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return false

    try {
      const response = await api.randomizeMatches(tournamentId, selectedIds.roundGroupId, selectedIds.roundId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedRandomizePairings"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateMatches?.()
      toast({
        title: t("pairingsRandomized"),
        description: t("pairingsRegenerated"),
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to randomize pairings', error)
      toast({
        title: t("failedRandomizePairings"),
        description: message,
        variant: 'destructive',
      })
      return false
    }
  }

  const handleSubmitPairings = async () => {
    if (!isOrganizer) return false

    if (!tournament?.started) {
      toast({
        title: t("startFirst"),
        description: t("publishBefore"),
        variant: 'destructive',
      })
      return false
    }

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return false

    try {
      const response = await api.publishMatches(tournamentId, selectedIds.roundGroupId, selectedIds.roundId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedPublishPairings"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateMatches?.()
      toast({
        title: t("pairingsPublished"),
        description: t("pairingsVisible"),
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to publish pairings', error)
      toast({
        title: t("failedPublishPairings"),
        description: message,
        variant: 'destructive',
      })
      return false
    }
  }

  const handleSaveAllRooms = async (entries: { matchId: number; location: string }[]) => {
    if (!isOrganizer || !entries.length) return false

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return false

    const normalizedEntries = entries.map(({ matchId, location }) => ({
      matchId,
      location: location.trim() || null,
    }))

    try {
      const response = await api.updateMatchLocations(
        tournamentId,
        selectedIds.roundGroupId,
        selectedIds.roundId,
        normalizedEntries,
      )
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedSaveRooms"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateMatches?.()
      toast({
        title: t("roomsSaved", { count: entries.length }),
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to save match rooms', error)
      toast({
        title: t("failedSaveRooms"),
        description: message,
        variant: 'destructive',
      })
      return false
    }
  }

  const handleUpdateMatch = async (
    matchId: number,
    payload: MatchUpdateRequest,
    successTitle = t("matchUpdated"),
    successDescription = t("matchChangesSaved"),
  ) => {
    if (!isOrganizer) return

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return

    try {
      setSavingMatchId(matchId)
      const response = await api.updateMatch(tournamentId, selectedIds.roundGroupId, selectedIds.roundId, matchId, payload)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedUpdateMatch"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateMatches?.()
      toast({
        title: successTitle,
        description: successDescription,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to update match', error)
      toast({
        title: t("failedUpdateMatch"),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSavingMatchId(null)
    }
  }

  const handleClearMatches = async () => {
    if (!isOrganizer) return

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return

    try {
      const response = await api.clearMatches(tournamentId, selectedIds.roundGroupId, selectedIds.roundId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedClearMatches"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }

      await mutateMatches?.()
      toast({
        title: t("matchesCleared"),
        description: t("roundMatchesRemoved"),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to clear matches', error)
      toast({
        title: t("failedClearMatches"),
        description: message,
        variant: 'destructive',
      })
    }
  }

  const closeJudgeModal = () => {
    setIsAddJudgeModalOpen(false)
    setJudgeModalMode('add')
    setEditingJudge(null)
    setJudgeForm({ fullName: '', email: '', phoneNumber: '' })
    setJudgeError(null)
  }

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!canManageTeams) {
      toast({
        title: t("permission"),
        description: t("permission"),
        variant: 'destructive'
      })
      return
    }

    const confirmed = window.confirm(t("confirmDelete", { name: teamName }))
    if (!confirmed) return

    try {
      setDeletingTeamId(teamId)
      const response = await api.removeTeam(tournamentId, teamId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedRemoveTeam"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }
      await mutateTeams()
      toast({
        title: t("teamRemoved"),
        description: t("teamRemovedDescription", { name: teamName }),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to remove team', error)
      toast({
        title: t("failedRemoveTeam"),
        description: message,
        variant: 'destructive'
      })
    } finally {
      setDeletingTeamId(null)
    }
  }

  const handleEditTeam = (team: SimpleTeamResponse) => {
    const detailedTeam = team as TeamResponse
    const speakerUsernames = Array.isArray(detailedTeam.members)
      ? detailedTeam.members.map((member) => member.user.username)
      : []

    setTeamEditModalData({
      id: team.id,
      name: team.name,
      club: team.club?.name ?? "",
      speakerUsernames,
    })
  }

  const handleSaveEditedTeam = async ({ name, club, speakerUsernames }: { name: string; club: string; speakerUsernames: string[] }) => {
    if (!teamEditModalData || isSavingTeam) return

    const trimmedName = name.trim()
    const trimmedClub = club.trim()
    const trimmedSpeakers = speakerUsernames.map((speaker) => speaker.trim()).filter(Boolean)
    const currentSpeakers = teamEditModalData.speakerUsernames.map((speaker) => speaker.trim()).filter(Boolean)
    const payload: TeamUpdateOrganizerRequest = {}

    if (trimmedName && trimmedName !== teamEditModalData.name) {
      payload.name = trimmedName
    }

    if (trimmedClub !== teamEditModalData.club) {
      payload.club = trimmedClub
    }

    if (trimmedSpeakers.join('\n') !== currentSpeakers.join('\n')) {
      if (new Set(trimmedSpeakers).size !== trimmedSpeakers.length) {
        toast({
          title: t("duplicate"),
          description: t("duplicateDescription"),
          variant: 'destructive',
        })
        return
      }

      if (trimmedSpeakers.length === 0) {
        toast({
          title: t("missingParticipants"),
          description: t("addParticipant"),
          variant: 'destructive',
        })
        return
      }

      payload.members = trimmedSpeakers
    }

    if (!Object.keys(payload).length) {
      toast({
        title: t("noChanges"),
        description: t("updateDetails"),
      })
      return
    }

    try {
      setIsSavingTeam(true)
      const response = await api.updateTeam_Organizer(tournamentId, teamEditModalData.id, payload)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedUpdateTeam"),
          unauthorized: t("permission"),
          serverError: t("server"),
        }))
      }
      await mutateTeams()
      toast({
        title: t("teamUpdated"),
        description: t("teamUpdatedDescription", {
          name: payload.name ?? teamEditModalData.name,
          club: trimmedClub || t("noClub"),
        }),
      })
      setTeamEditModalData(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tryLater")
      console.error('Failed to update team', error)
      toast({
        title: t("failedUpdateTeam"),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingTeam(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMainInfoDropdownOpen(false)
      }
      if (resultsDropdownRef.current && !resultsDropdownRef.current.contains(event.target as Node)) {
        setIsResultsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Tournament-specific news
  const { news, isLoading: newsLoading, error: newsError, mutate: mutateNews } = useNews(
    { tags: [`tournament:${tournamentId}`] },
    { page: 0, size: 20, sort: ['timestamp,desc'] }
  )

  const handleMainInfoOptionSelect = (option: 'Announcements' | 'Schedule' | 'Map') => {
    setSelectedMainInfoOption(option)
    setIsMainInfoDropdownOpen(false)
    setActiveTab('Main Info')
  }

  const handleResultsOptionSelect = (option: ResultsFormat) => {
    setSelectedResultsOption(option)
    setIsResultsDropdownOpen(false)
    setActiveTab('Results and Statistics')

    const configuredRoundGroup = resultsRoundGroup(roundGroups, option)
    const configuredRound = firstConfiguredRoundName(configuredRoundGroup)
    const fallbackRound = `Round ${currentRoundNumber ?? selectedRoundNumber ?? 1}`
    const nextRound = configuredRound ?? fallbackRound
    const nextStage = resultsStageForRoundGroup(configuredRoundGroup, option)

    if (option === 'LD') {
      setActiveResultsSection(nextRound)
      setSelectedResultsStage(nextStage)
      setSelectedResultsRound(nextRound)
    } else {
      setActiveResultsSection(`${option} Speaker Score`)
      setResultsSubTab('Speaker Score')
      setSelectedResultsStage(nextStage)
      setSelectedResultsRound(nextRound)
    }
  }

  useEffect(() => {
    const nextResultsFormat = resultsFormatOptions[0]
    if (!nextResultsFormat || resultsFormatOptions.includes(selectedResultsOption)) return

    setSelectedResultsOption(nextResultsFormat)
    const configuredRoundGroup = resultsRoundGroup(roundGroups, nextResultsFormat)
    const configuredRound = firstConfiguredRoundName(configuredRoundGroup)
    const fallbackRound = `Round ${currentRoundNumber ?? selectedRoundNumber ?? 1}`
    const nextRound = configuredRound ?? fallbackRound
    const nextStage = resultsStageForRoundGroup(configuredRoundGroup, nextResultsFormat)
    if (nextResultsFormat === DebateFormat.LD) {
      setActiveResultsSection(nextRound)
      setResultsSubTab('Results')
      setSelectedResultsStage(nextStage)
      setSelectedResultsRound(nextRound)
      return
    }

    setActiveResultsSection(`${nextResultsFormat} Speaker Score`)
    setResultsSubTab('Speaker Score')
    setSelectedResultsStage(nextStage)
    setSelectedResultsRound(nextRound)
  }, [currentRoundNumber, resultsFormatOptions, roundGroups, selectedResultsOption, selectedRoundNumber])

  const openContentModal = (context: 'announcements' | 'schedule' | 'map' | 'news') => {
    if (context === 'map') {
      toast({
        title: t("mapUnavailableTitle"),
        description: t("mapUnavailable"),
        variant: 'destructive',
      })
      return
    }

    setPostError(null)
    setEditingAnnouncement(null)
    setPostTitle('')
    setPostDescription('')
    setSelectedNewsCategory('Info')
    resetUploads()
    setModalContext(context)
    setIsAddPostModalOpen(true)
  }

  const openEditAnnouncementModal = (announcement: AnnouncementResponse) => {
    setPostError(null)
    resetUploads()
    setModalContext('announcements')
    setEditingAnnouncement(announcement)
    setPostTitle(announcement.title ?? '')
    setPostDescription(announcement.content ?? '')
    const existingCategory = (announcement.tags ?? [])
      .map((tag) => tag.name)
      .find((name): name is 'Important' | 'Update' | 'Info' =>
        name === 'Important' || name === 'Update' || name === 'Info')
    setSelectedNewsCategory(existingCategory ?? 'Info')
    setIsAddPostModalOpen(true)
  }

  const closeAddPostModal = () => {
    setIsAddPostModalOpen(false)
    setModalContext('')
    setEditingAnnouncement(null)
    setPostTitle('')
    setPostDescription('')
    setPostError(null)
    resetUploads()
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">

      <TournamentHeader
        tournamentName={tournament?.name}
        tournamentLoading={tournamentLoading}
        tournamentError={tournamentError}
        isOrganizer={isOrganizer}
        canControlVisibility={canControlVisibility}
        isTournamentEnabled={isTournamentEnabled}
        toggleTournamentLoading={toggleTournamentLoading}
        onToggleTournament={handleTournamentToggle}
        onOpenInvite={isOrganizer ? () => setIsInviteModalOpen(true) : undefined}
        onStartTournament={isOrganizer && !tournament?.started ? handleStartTournament : undefined}
        startTournamentLoading={startingTournament}
      />

      <section className="px-4 sm:px-6 lg:px-12">
        <TournamentTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedMainInfoOption={selectedMainInfoOption}
          isMainInfoDropdownOpen={isMainInfoDropdownOpen}
          onToggleMainInfoDropdown={() => setIsMainInfoDropdownOpen((prev) => !prev)}
          onMainInfoOptionSelect={handleMainInfoOptionSelect}
          mainInfoDropdownRef={dropdownRef}
          selectedResultsOption={selectedResultsOption}
          resultsOptions={resultsFormatOptions}
          isResultsDropdownOpen={isResultsDropdownOpen}
          onToggleResultsDropdown={() => setIsResultsDropdownOpen((prev) => !prev)}
          onResultsOptionSelect={handleResultsOptionSelect}
          resultsDropdownRef={resultsDropdownRef}
        />
      </section>

      <div className="px-4 pb-16 sm:px-6 lg:px-12">
        {activeTab === 'Main Info' && (
          <MainInfoSection
            selectedOption={selectedMainInfoOption}
            tournament={tournament}
            tournamentLoading={tournamentLoading}
            tournamentError={tournamentError}
            announcements={announcements}
            announcementsLoading={announcementsLoading}
            announcementsError={announcementsError}
            schedules={schedules}
            schedulesLoading={schedulesLoading}
            schedulesError={schedulesError}
            onOpenModal={isOrganizer ? openContentModal : undefined}
            onEditAnnouncement={isOrganizer ? openEditAnnouncementModal : undefined}
            onAddAnnouncementComment={currentUser ? handleAddAnnouncementComment : undefined}
          />
        )}

        {activeTab === 'Teams' && (
          <TeamsSection
            teams={teams}
            teamsLoading={teamsLoading}
            teamsError={teamsError}
            checkInStatus={checkInStatus}
            onToggleCheckIn={canManageTeams ? handleToggleCheckIn : undefined}
            onDeleteTeam={canManageTeams ? (teamId => {
              const team = teams?.content.find((t) => t.id === teamId)
              if (team) {
                void handleDeleteTeam(teamId, team.name)
              }
            }) : undefined}
            onEditTeam={canManageTeams ? handleEditTeam : undefined}
            onDisqualifyTeam={canManageTeams ? handleDisqualifyTeam : undefined}
            onRequalifyTeam={canManageTeams ? handleRequalifyTeam : undefined}
          />
        )}

        {activeTab === 'Judges' && (
          <JudgesSection
            judges={judges}
            judgesLoading={judgesLoading}
            judgesError={judgesError}
            showContactDetails={isOrganizer}
            onAddJudge={isOrganizer ? openAddJudgeModal : undefined}
            onToggleJudgeCheckIn={isOrganizer ? handleToggleJudgeCheckIn : undefined}
            onEditJudge={isOrganizer ? openEditJudgeModal : undefined}
            onDeleteJudge={isOrganizer ? handleDeleteJudge : undefined}
            updatingJudgeId={updatingJudgeId}
            deletingJudgeId={deletingJudgeId}
          />
        )}

        {activeTab === 'Pairing and Matches' && (
          <PairingsSection
            matches={matches}
            rounds={rounds}
            teams={teams}
            participants={participants}
            judges={judges}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            selectedStage={effectivePairingStage}
            selectedRound={effectivePairingRound}
            selectedRoundNumber={selectedRoundNumber}
            currentRoundNumber={currentRoundNumber}
            onSelectStage={setSelectedPairingStage}
            onSelectRound={setSelectedPairingRound}
            onProceedToNextRound={isOrganizer ? handleProceedToNextRound : undefined}
            onRandomizePairings={isOrganizer ? handleRandomizePairings : undefined}
            onSubmitPairings={isOrganizer ? handleSubmitPairings : undefined}
            onClearMatches={isOrganizer ? handleClearMatches : undefined}
            availableStages={availablePairingStages}
            onSaveAllRooms={isOrganizer ? handleSaveAllRooms : undefined}
            onUpdateMatch={isOrganizer ? handleUpdateMatch : undefined}
            savingMatchId={savingMatchId}
            resultStorageKey={resultStorageKey}
          />
        )}

        {activeTab === 'Results and Statistics' && (
          <ResultsSection
            selectedResultsOption={selectedResultsOption}
            resultsSubTab={resultsSubTab}
            onResultsSubTabChange={setResultsSubTab}
            bpfSubTab={bpfSubTab}
            activeResultsSection={activeResultsSection}
            onActiveResultsSectionChange={handleActiveResultsSectionChange}
            selectedRound={selectedResultsRound}
            onSelectedRoundChange={handleSelectedResultsRoundChange}
            roundGroupType={selectedRoundGroup?.type}
            rounds={rounds}
            eliminationRounds={resultsEliminationRounds}
            teams={teams}
            teamsLoading={teamsLoading}
            teamsError={teamsError}
            matches={matches}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            selectedRoundNumber={selectedRoundNumber}
            currentRoundNumber={currentRoundNumber}
            canManageTeams={!!canManageTeams}
            onDeleteTeam={handleDeleteTeam}
            deletingTeamId={deletingTeamId}
            onSubmitResults={isOrganizer ? handleSubmitResults : undefined}
            isSubmittingResults={submittingResults}
            resultStorageKey={resultStorageKey}
            preliminaryRoundMatches={preliminaryRoundMatches}
            preliminaryRoundMatchesLoading={preliminaryRoundMatchesLoading}
            preliminaryRoundMatchesError={preliminaryRoundMatchesError}
          />
        )}

        {activeTab === 'News' && (
          <NewsSection
            news={news}
            newsLoading={newsLoading}
            newsError={newsError}
            onAddNews={isOrganizer ? () => openContentModal('news') : undefined}
          />
        )}

        {activeTab === 'Feedback' && (
          <FeedbackSection
            tournamentId={tournamentId}
            feedbacks={feedbacks}
            feedbacksLoading={feedbacksLoading}
            feedbacksError={feedbacksError}
            onFeedbackAdded={mutateFeedbacks}
          />
        )}
      </div>

      <EditTeamModal
        isOpen={!!teamEditModalData}
        teamName={teamEditModalData?.name}
        clubName={teamEditModalData?.club}
        speakerUsernames={teamEditModalData?.speakerUsernames}
        isSaving={isSavingTeam}
        onClose={() => setTeamEditModalData(null)}
        onSave={handleSaveEditedTeam}
      />

      <AddPostModal
        isOpen={isAddPostModalOpen}
        modalContext={modalContext}
        mode={editingAnnouncement ? 'edit' : 'add'}
        postTitle={postTitle}
        postDescription={postDescription}
        selectedNewsCategory={selectedNewsCategory}
        currentImageUrl={editingAnnouncement?.imageUrl?.url}
        imagePreviews={imagePreviews}
        uploadErrors={uploadErrors}
        isSubmitting={postSubmitting}
        errorMessage={postError}
        submitLabel={editingAnnouncement ? t("saveChanges") : t("submit")}
        dzAnimate={dzAnimate}
        formatBytes={formatBytes}
        onClose={closeAddPostModal}
        onSubmit={handleAddPost}
        onTitleChange={setPostTitle}
        onDescriptionChange={setPostDescription}
        onCategoryChange={setSelectedNewsCategory}
        onImageUpload={handleImageUpload}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onRemoveImage={removeImageByKey}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        members={tournamentMembers}
        activeTab={inviteModalTab}
        onTabChange={setInviteModalTab}
        onClose={() => setIsInviteModalOpen(false)}
        tournamentId={tournamentId}
        currentUserId={currentUser?.id}
        existingOrganizers={inviteExistingOrganizers}
        existingOrganizersLoading={organizersLoading}
        canInviteOrganizers={canControlVisibility}
      />

      <AddJudgeModal
        isOpen={isAddJudgeModalOpen}
        form={judgeForm}
        onClose={closeJudgeModal}
        onSubmit={handleSubmitJudge}
        onChange={(field, value) => setJudgeForm((prev) => ({ ...prev, [field]: value }))}
        isSubmitting={judgeSubmitting}
        errorMessage={judgeError}
        title={judgeModalMode === 'edit' ? t("editJudge") : t("addJudge")}
        submitLabel={judgeModalMode === 'edit' ? t("saveJudge") : t("submit")}
      />
    </div>
  )
}
