"use client"

import { AlertCircle, Calendar, MapPin, RefreshCw } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCurrentUser, useMyTournaments } from "../../hooks/use-api"
import { toBackendDateTime } from "@/lib/datetime"
import { resolveMediaUrl } from "@/lib/media"
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"
import { LoadingState, CardSkeleton } from "../../components/ui/loading"
import { EmptyState } from "../../components/ui/error"

const translations: TranslationCatalog = {
  en: {
    title: "My Tournaments",
    past: "Past",
    ongoing: "Ongoing",
    upcoming: "Upcoming",
    failedPast: "Failed to load past tournaments",
    failedOngoing: "Failed to load ongoing tournaments",
    failedUpcoming: "Failed to load upcoming tournaments",
    noPast: "No past tournaments",
    noPastDescription: "You haven't participated in any tournaments yet.",
    noOngoing: "No ongoing tournaments",
    noOngoingDescription: "You haven't participated in any ongoing tournaments yet.",
    noUpcoming: "No upcoming tournaments",
    noUpcomingDescription: "You haven't registered for any upcoming tournaments yet.",
    browseTournaments: "Browse Tournaments",
    noImage: "No Image",
    tournamentLogoAlt: "{name} tournament logo - debate competition in {location}",
    teams: "Teams",
    status: "Status",
    format: "Format",
    showDetails: "Show Details",
    tryAgain: "Try again",
    somethingWentWrong: "Oops! Something went wrong",
    loading: "Loading tournaments",
    signInTitle: "Sign in to view My Tournaments",
    signInDescription: "Your tournament memberships are available after you sign in.",
    sessionError: "We couldn't verify your session. Please try again.",
    logIn: "Log In",
    unknown: "Unknown",
    statusActive: "Active",
    statusUpcoming: "Upcoming",
    statusCompleted: "Completed",
  },
  ru: {
    title: "Мои турниры",
    past: "Прошедшие",
    ongoing: "Текущие",
    upcoming: "Предстоящие",
    failedPast: "Не удалось загрузить прошедшие турниры",
    failedOngoing: "Не удалось загрузить текущие турниры",
    failedUpcoming: "Не удалось загрузить предстоящие турниры",
    noPast: "Нет прошедших турниров",
    noPastDescription: "Вы ещё не участвовали ни в одном турнире.",
    noOngoing: "Нет текущих турниров",
    noOngoingDescription: "Вы ещё не участвуете ни в одном текущем турнире.",
    noUpcoming: "Нет предстоящих турниров",
    noUpcomingDescription: "Вы ещё не зарегистрировались ни на один предстоящий турнир.",
    browseTournaments: "Все турниры",
    noImage: "Нет изображения",
    tournamentLogoAlt: "Логотип турнира «{name}» — соревнование по дебатам в городе {location}",
    teams: "Команды",
    status: "Статус",
    format: "Формат",
    showDetails: "Подробнее",
    tryAgain: "Повторить",
    somethingWentWrong: "Ой! Что-то пошло не так",
    loading: "Загрузка турниров",
    signInTitle: "Войдите, чтобы открыть «Мои турниры»",
    signInDescription: "Ваши турниры станут доступны после входа в аккаунт.",
    sessionError: "Не удалось проверить сеанс. Попробуйте снова.",
    logIn: "Войти",
    unknown: "Неизвестно",
    statusActive: "Идёт",
    statusUpcoming: "Предстоящий",
    statusCompleted: "Завершённый",
  },
  kk: {
    title: "Менің турнирлерім",
    past: "Өткен",
    ongoing: "Өтіп жатқан",
    upcoming: "Алда болатын",
    failedPast: "Өткен турнирлерді жүктеу мүмкін болмады",
    failedOngoing: "Өтіп жатқан турнирлерді жүктеу мүмкін болмады",
    failedUpcoming: "Алда болатын турнирлерді жүктеу мүмкін болмады",
    noPast: "Өткен турнирлер жоқ",
    noPastDescription: "Сіз әлі ешбір турнирге қатысқан жоқсыз.",
    noOngoing: "Өтіп жатқан турнирлер жоқ",
    noOngoingDescription: "Сіз қазір өтіп жатқан турнирлердің ешқайсысына қатысып жатқан жоқсыз.",
    noUpcoming: "Алда болатын турнирлер жоқ",
    noUpcomingDescription: "Сіз әлі алда болатын турнирлердің ешқайсысына тіркелмедіңіз.",
    browseTournaments: "Турнирлерді көру",
    noImage: "Сурет жоқ",
    tournamentLogoAlt: "{location} қаласындағы пікірсайыс жарысының «{name}» турнир логотипі",
    teams: "Командалар",
    status: "Мәртебе",
    format: "Формат",
    showDetails: "Толығырақ көру",
    tryAgain: "Қайталап көру",
    somethingWentWrong: "Ой! Бірдеңе дұрыс болмады",
    loading: "Турнирлер жүктелуде",
    signInTitle: "Менің турнирлерімді көру үшін жүйеге кіріңіз",
    signInDescription: "Турнир мүшеліктеріңіз жүйеге кіргеннен кейін қолжетімді болады.",
    sessionError: "Сеансты тексеру мүмкін болмады. Қайталап көріңіз.",
    logIn: "Кіру",
    unknown: "Белгісіз",
    statusActive: "Өтіп жатыр",
    statusUpcoming: "Алда болатын",
    statusCompleted: "Аяқталған",
  },
}

const getTagLabel = (tag: { name?: string } | string) => (typeof tag === "string" ? tag : tag.name ?? "")

const tabDefinitions = [
  { value: "Past", key: "past" },
  { value: "Ongoing", key: "ongoing" },
  { value: "Upcoming", key: "upcoming" },
] as const

type TabValue = (typeof tabDefinitions)[number]["value"]

function LocalizedErrorState({
  error,
  message,
  onRetry,
  t,
}: {
  error?: Error | null
  message: string
  onRetry: () => void
  t: (key: string) => string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4" role="alert">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-[#0D1321] mb-2">{t("somethingWentWrong")}</h3>
      <p className="text-[#4a4e69] text-center mb-4 max-w-md">{message || error?.message}</p>
      <button
        type="button"
        onClick={onRetry}
        aria-label={t("tryAgain")}
        className="inline-flex items-center space-x-2 bg-[#3E5C76] text-white px-4 py-2 rounded-lg hover:bg-[#22223b] text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        <span>{t("tryAgain")}</span>
      </button>
    </div>
  )
}

export default function MyTournamentsPage() {
  const { locale } = useLocale()
  const t = useTranslations(translations)
  const {
    user: currentUser,
    isLoading: currentUserLoading,
    error: currentUserError,
  } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<TabValue>('Past')
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})

  // Get current date for filtering
  const currentDate = new Date().toISOString().split('T')[0]

  // API hooks for different tournament types
  const pastParams = { startDateTo: toBackendDateTime(currentDate) }
  const upcomingParams = { startDateFrom: toBackendDateTime(currentDate) }

  const { tournaments: pastTournaments, isLoading: loadingPast, error: errorPast } = useMyTournaments(
    pastParams,
    { page: 0, size: 20, sort: ['startDate,desc'] }
  )

  const { tournaments: upcomingTournaments, isLoading: loadingUpcoming, error: errorUpcoming } = useMyTournaments(
    upcomingParams,
    { page: 0, size: 20, sort: ['startDate,asc'] }
  )

  // For ongoing tournaments, we'll use a broader date range and filter in frontend
  const { tournaments: allTournaments, isLoading: loadingAll, error: errorAll } = useMyTournaments(
    undefined,
    { page: 0, size: 50, sort: ['startDate,desc'] }
  )

  // Filter for ongoing tournaments (started but not yet ended)
  const ongoingTournaments = allTournaments?.content.filter(tournament => {
    const startDate = new Date(tournament.startDate ?? "")
    const endDate = new Date(tournament.endDate || tournament.startDate || "")
    const now = new Date()
    return startDate <= now && endDate >= now
  }) || []

  // Get current data based on active tab
  const getCurrentTournaments = () => {
    switch (activeTab) {
      case 'Past':
        return { tournaments: pastTournaments?.content || [], isLoading: loadingPast, error: errorPast }
      case 'Ongoing':
        return { tournaments: ongoingTournaments, isLoading: loadingAll, error: errorAll }
      case 'Upcoming':
        return { tournaments: upcomingTournaments?.content || [], isLoading: loadingUpcoming, error: errorUpcoming }
      default:
        return { tournaments: [], isLoading: false, error: null }
    }
  }

  const { tournaments, isLoading, error } = getCurrentTournaments()
  const activeTabKey = tabDefinitions.find((tab) => tab.value === activeTab)?.key ?? "past"
  const errorMessageKey = activeTabKey === "past"
    ? "failedPast"
    : activeTabKey === "ongoing"
      ? "failedOngoing"
      : "failedUpcoming"
  const emptyCopy = activeTabKey === "past"
    ? { title: t("noPast"), description: t("noPastDescription") }
    : activeTabKey === "ongoing"
      ? { title: t("noOngoing"), description: t("noOngoingDescription") }
      : { title: t("noUpcoming"), description: t("noUpcomingDescription") }

  const getStatusLabel = (status?: string) => {
    if (status === "ACTIVE") return t("statusActive")
    if (status === "UPCOMING") return t("statusUpcoming")
    if (status === "COMPLETED") return t("statusCompleted")
    return status || t("unknown")
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">

      {/* Page Title */}
      <section className="px-12 py-8">
        <h1 className="text-[#0D1321] text-[48px] font-bold mb-8">{t("title")}</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-8">
          {tabDefinitions.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              aria-label={t(tab.key)}
              className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'text-[#0D1321] border-[#0D1321]'
                  : 'text-[#9a8c98] border-transparent hover:text-[#4a4e69]'
              }`}
            >
              {t(tab.key)}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="px-12 pb-16">
        {/* Tournament Cards */}
        <LoadingState
          isLoading={currentUserLoading || isLoading}
          fallback={
            <div className="space-y-6" role="status" aria-label={t("loading")}>
              {[1, 2, 3].map(i => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {currentUserError ? (
            <LocalizedErrorState
              error={currentUserError}
              onRetry={() => window.location.reload()}
              message={t("sessionError")}
              t={t}
            />
          ) : !currentUser ? (
            <EmptyState
              title={t("signInTitle")}
              description={t("signInDescription")}
              actionText={t("logIn")}
              actionHref="/auth?mode=login"
              prefetch={false}
            />
          ) : error ? (
            <LocalizedErrorState
              error={error}
              onRetry={() => window.location.reload()}
              message={t(errorMessageKey)}
              t={t}
            />
          ) : tournaments.length > 0 ? (
            <div className="space-y-6">
              {tournaments.map((tournament) => {
                const formattedDate = new Date(tournament.startDate ?? "").toLocaleDateString(localeTags[locale])

                return (
                  <div key={tournament.id} className="bg-[#0D1321] rounded-[16px] p-8">
                    {/* Tournament Info */}
                    <div className="flex items-start mb-6">
                      <div className="w-[150px] h-[150px] bg-[#FFFFFF] rounded-full mr-6 overflow-hidden flex-shrink-0 relative">
                        {tournament.imageUrl && !imageErrors[tournament.id] ? (
                          <Image
                            src={resolveMediaUrl(tournament.imageUrl.url) ?? tournament.imageUrl.url}
                            alt={t("tournamentLogoAlt", { name: tournament.name, location: tournament.location ?? "" })}
                            width={150}
                            height={150}
                            className="w-full h-full object-cover"
                            onError={() => setImageErrors(prev => ({ ...prev, [tournament.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                            <span>{t("noImage")}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#FFFFFF] text-[32px] font-medium mb-2">{tournament.name}</h3>
                        <div className="text-[#9a8c98] text-[16px] font-normal space-y-1 mb-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                            <span>{tournament.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tournament.tags.map((tag, index) => (
                            <span key={index} className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">
                              {getTagLabel(tag)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#9a8c98] text-[16px] font-normal mb-4 leading-relaxed">
                      {tournament.description}
                    </p>

                    {/* Tournament Stats */}
                    <div className="flex items-center justify-between mb-4 text-[#9a8c98] text-[14px]">
                      <span>{t("teams")}: {tournament.currentTeamCount}/{tournament.maxTeamCount}</span>
                      <span>{t("status")}: {getStatusLabel(tournament.status)}</span>
                      <span>{t("format")}: {tournament.debateFormat || t("unknown")}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                          tournament.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          tournament.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusLabel(tournament.status)}
                        </span>
                      </div>
                      <Link
                        href={`/tournament/${tournament.id}`}
                        className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal transition-colors"
                      >
                        {t("showDetails")}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title={emptyCopy.title}
              description={emptyCopy.description}
              actionText={t("browseTournaments")}
              actionHref="/tournaments"
            />
          )}
        </LoadingState>
      </div>
    </div>
  )
}
