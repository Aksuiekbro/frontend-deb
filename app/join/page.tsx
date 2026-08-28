"use client"

import { Search, MapPin, Calendar, Users, Filter, X } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { useCurrentUser } from "@/hooks/use-api"
import { SimpleTournamentResponse, TournamentGetParams, TournamentLeague } from "@/types/tournament/tournament"
import { toBackendDateTime } from "@/lib/datetime"
import type { PageResult } from "@/types/page"
import { Role } from "@/types/user/user"
import { buildTeamRegistrationPayload, getMaxInvitedParticipants } from "@/lib/team-registration"
import { readResponseError } from "@/lib/http-error"
import { resolveMediaUrl } from "@/lib/media"
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"

const translations: TranslationCatalog = {
  en: {
    exploreDebates: "Explore Debates",
    filters: "Filters",
    startDate: "Start Date:",
    startDateFrom: "Start date from",
    startDateTo: "Start date to",
    registrationDeadline: "Registration Deadline:",
    registrationDeadlineFrom: "Registration deadline from",
    registrationDeadlineTo: "Registration deadline to",
    location: "Location:",
    locationLabel: "Location",
    placeCity: "Place/City",
    league: "League:",
    school: "School",
    university: "University",
    showNonFullDebates: "Show Non-Full Debates",
    searchByName: "Search by name",
    nameAscending: "Name (A-Z)",
    nameDescending: "Name (Z-A)",
    mostRecent: "Most Recent",
    upcoming: "Upcoming",
    noDebates: "No debates found matching your criteria.",
    leagueValue: "League: {league}",
    startDateValue: "Start Date: {date}",
    locationValue: "Location: {location}",
    notAvailable: "N/A",
    more: "More...",
    joinDebates: "Join Debates",
    loadingMore: "Loading more debates...",
    loadMore: "Load More Debates",
    retry: "Try again",
    contactUs: "Contact us: debetter@gmail.com",
    allRightsReserved: "© 2025 all rights reserved",
    privacyPolicy: "Privacy Policy",
    telegram: "Telegram",
    youtube: "YouTube",
    instagram: "Instagram",
    close: "Close",
    registrationSuccessful: "Registration Successful!",
    tournamentRegistration: "Tournament Registration",
    registrationSuccess: "✓ Your team has been registered successfully!",
    confirmationEmail: "You will receive a confirmation email shortly.",
    teamName: "Team Name:",
    enterTeamName: "Enter team name",
    clubName: "Club Name:",
    enterClubName: "Enter club/institution name",
    teammate: "Teammate:",
    secondTeammate: "2nd Teammate:",
    usernameOptional: "Username (optional)",
    teammatesOptional: "• Teammate usernames are optional - you can invite team members later",
    teamAndClubRequired: "• Only team name and club name are required for registration",
    signInBeforeRegistering: "Please sign in before registering a team.",
    logIn: "Log In",
    register: "Register",
    registering: "Registering...",
    registerTeam: "Register Team",
    noTournamentSelected: "No tournament selected",
    teamAndClubRequiredError: "Team name and club name are required",
    signInBeforeRegisteringError: "Please sign in before registering a team",
    participantOnly: "Only participant accounts can register a team",
    missingProfile: "Your participant profile is missing. Please sign in again",
    failedToLoadDebates: "Failed to load debates",
    signInToViewDebates: "Please sign in to view debates.",
    serverError: "Server error. Please try again later.",
    registrationFailed: "Registration failed",
    unexpectedRegistrationError: "An unexpected error occurred. Please try again.",
  },
  ru: {
    exploreDebates: "Исследуйте дебаты",
    filters: "Фильтры",
    startDate: "Дата начала:",
    startDateFrom: "Дата начала от",
    startDateTo: "Дата начала до",
    registrationDeadline: "Крайний срок регистрации:",
    registrationDeadlineFrom: "Крайний срок регистрации от",
    registrationDeadlineTo: "Крайний срок регистрации до",
    location: "Место проведения:",
    locationLabel: "Место проведения",
    placeCity: "Место/город",
    league: "Лига:",
    school: "Школьная",
    university: "Университетская",
    showNonFullDebates: "Показывать дебаты с доступными местами",
    searchByName: "Поиск по названию",
    nameAscending: "Название (А–Я)",
    nameDescending: "Название (Я–А)",
    mostRecent: "Сначала недавние",
    upcoming: "Предстоящие",
    noDebates: "Дебаты, соответствующие критериям, не найдены.",
    leagueValue: "Лига: {league}",
    startDateValue: "Дата начала: {date}",
    locationValue: "Место проведения: {location}",
    notAvailable: "Н/Д",
    more: "Подробнее...",
    joinDebates: "Присоединиться к дебатам",
    loadingMore: "Загрузка дополнительных дебатов...",
    loadMore: "Загрузить ещё дебаты",
    retry: "Попробовать снова",
    contactUs: "Свяжитесь с нами: debetter@gmail.com",
    allRightsReserved: "© 2025 все права защищены",
    privacyPolicy: "Политика конфиденциальности",
    telegram: "Telegram",
    youtube: "YouTube",
    instagram: "Instagram",
    close: "Закрыть",
    registrationSuccessful: "Регистрация прошла успешно!",
    tournamentRegistration: "Регистрация на турнир",
    registrationSuccess: "✓ Ваша команда успешно зарегистрирована!",
    confirmationEmail: "Вскоре вы получите письмо с подтверждением.",
    teamName: "Название команды:",
    enterTeamName: "Введите название команды",
    clubName: "Название клуба:",
    enterClubName: "Введите название клуба/учебного заведения",
    teammate: "Товарищ по команде:",
    secondTeammate: "2-й товарищ по команде:",
    usernameOptional: "Имя пользователя (необязательно)",
    teammatesOptional: "• Имена пользователей товарищей необязательны — их можно пригласить позже",
    teamAndClubRequired: "• Для регистрации обязательны только название команды и клуба",
    signInBeforeRegistering: "Войдите, прежде чем регистрировать команду.",
    logIn: "Войти",
    register: "Зарегистрироваться",
    registering: "Регистрация...",
    registerTeam: "Зарегистрировать команду",
    noTournamentSelected: "Турнир не выбран",
    teamAndClubRequiredError: "Необходимо указать название команды и клуба",
    signInBeforeRegisteringError: "Войдите, прежде чем регистрировать команду",
    participantOnly: "Только участники могут регистрировать команду",
    missingProfile: "Профиль участника не найден. Войдите снова",
    failedToLoadDebates: "Не удалось загрузить дебаты",
    signInToViewDebates: "Войдите, чтобы просмотреть дебаты.",
    serverError: "Ошибка сервера. Попробуйте ещё раз позже.",
    registrationFailed: "Не удалось зарегистрироваться",
    unexpectedRegistrationError: "Произошла непредвиденная ошибка. Попробуйте ещё раз.",
  },
  kk: {
    exploreDebates: "Пікірсайыстарды зерттеу",
    filters: "Сүзгілер",
    startDate: "Басталу күні:",
    startDateFrom: "Басталу күні (бастап)",
    startDateTo: "Басталу күні (дейін)",
    registrationDeadline: "Тіркелудің соңғы мерзімі:",
    registrationDeadlineFrom: "Тіркелудің соңғы мерзімі (бастап)",
    registrationDeadlineTo: "Тіркелудің соңғы мерзімі (дейін)",
    location: "Өтетін орны:",
    locationLabel: "Өтетін орны",
    placeCity: "Орын/қала",
    league: "Лига:",
    school: "Мектеп",
    university: "Университет",
    showNonFullDebates: "Бос орындары бар пікірсайыстарды көрсету",
    searchByName: "Атауы бойынша іздеу",
    nameAscending: "Атауы (А–Я)",
    nameDescending: "Атауы (Я–А)",
    mostRecent: "Ең соңғылары",
    upcoming: "Алда болатын",
    noDebates: "Критерийлеріңізге сәйкес пікірсайыстар табылмады.",
    leagueValue: "Лига: {league}",
    startDateValue: "Басталу күні: {date}",
    locationValue: "Өтетін орны: {location}",
    notAvailable: "Қ/ж",
    more: "Толығырақ...",
    joinDebates: "Пікірсайысқа қосылу",
    loadingMore: "Қосымша пікірсайыстар жүктелуде...",
    loadMore: "Қосымша пікірсайыстарды жүктеу",
    retry: "Қайталап көру",
    contactUs: "Бізбен байланысыңыз: debetter@gmail.com",
    allRightsReserved: "© 2025 барлық құқықтар қорғалған",
    privacyPolicy: "Құпиялылық саясаты",
    telegram: "Telegram",
    youtube: "YouTube",
    instagram: "Instagram",
    close: "Жабу",
    registrationSuccessful: "Тіркелу сәтті аяқталды!",
    tournamentRegistration: "Турнирге тіркелу",
    registrationSuccess: "✓ Командаңыз сәтті тіркелді!",
    confirmationEmail: "Жақында растау хатын аласыз.",
    teamName: "Команда атауы:",
    enterTeamName: "Команда атауын енгізіңіз",
    clubName: "Клуб атауы:",
    enterClubName: "Клуб/мекеме атауын енгізіңіз",
    teammate: "Команда мүшесі:",
    secondTeammate: "2-команда мүшесі:",
    usernameOptional: "Пайдаланушы аты (міндетті емес)",
    teammatesOptional: "• Команда мүшелерінің пайдаланушы аттары міндетті емес — оларды кейін шақыра аласыз",
    teamAndClubRequired: "• Тіркелу үшін тек команда мен клуб атауы қажет",
    signInBeforeRegistering: "Команданы тіркеу үшін жүйеге кіріңіз.",
    logIn: "Кіру",
    register: "Тіркелу",
    registering: "Тіркелу орындалуда...",
    registerTeam: "Команданы тіркеу",
    noTournamentSelected: "Турнир таңдалмады",
    teamAndClubRequiredError: "Команда мен клуб атауын енгізу қажет",
    signInBeforeRegisteringError: "Команданы тіркеу үшін жүйеге кіріңіз",
    participantOnly: "Команданы тек қатысушы аккаунттары тіркей алады",
    missingProfile: "Қатысушы профиліңіз жоқ. Қайта кіріңіз",
    failedToLoadDebates: "Пікірсайыстарды жүктеу мүмкін болмады",
    signInToViewDebates: "Пікірсайыстарды көру үшін жүйеге кіріңіз.",
    serverError: "Сервер қатесі. Кейінірек қайталап көріңіз.",
    registrationFailed: "Тіркелу сәтсіз аяқталды",
    unexpectedRegistrationError: "Күтпеген қате орын алды. Қайталап көріңіз.",
  },
}

export default function JoinDebatesPage() {
  const { locale } = useLocale()
  const t = useTranslations(translations)
  const { user: currentUser, isLoading: currentUserLoading, error: currentUserError } = useCurrentUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null)
  const [tournaments, setTournaments] = useState<SimpleTournamentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [tournamentError, setTournamentError] = useState<string | null>(null)
  const nextPageRef = useRef(0)
  const activeRequestRef = useRef(0)
  const requestInFlightRef = useRef(false)

  // Registration form state
  const [teamName, setTeamName] = useState('')
  const [clubName, setClubName] = useState('')
  const [speakerOneUsername, setSpeakerOneUsername] = useState('')
  const [speakerTwoUsername, setSpeakerTwoUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Filter states
  const [startDateFrom, setStartDateFrom] = useState<string>("")
  const [startDateTo, setStartDateTo] = useState<string>("")
  const [registrationDeadlineFrom, setRegistrationDeadlineFrom] = useState<string>("")
  const [registrationDeadlineTo, setRegistrationDeadlineTo] = useState<string>("")
  const [searchLocation, setSearchLocation] = useState<string>("")
  const [selectedLeagues, setSelectedLeagues] = useState<TournamentLeague[]>([])
  const [searchName, setSearchName] = useState<string>("")
  const [nonFull, setNonFull] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>("startDate,desc") // Default to Most Recent
  const selectedTournament = tournaments.find((tournament) => tournament.id === selectedTournamentId)
  const maxInvitedParticipants = getMaxInvitedParticipants(selectedTournament?.preliminaryFormat)
  const hasResolvedCurrentUser = !currentUserLoading && !currentUserError
  const isGuestRegistration = hasResolvedCurrentUser && !currentUser
  const canRegisterForTournaments = hasResolvedCurrentUser && currentUser?.role !== Role.ORGANIZER
  const formatDate = (date?: string) => {
    if (!date) return t("notAvailable")
    const parsedDate = new Date(date)
    return Number.isNaN(parsedDate.getTime())
      ? t("notAvailable")
      : parsedDate.toLocaleDateString(localeTags[locale])
  }
  const getLeagueLabel = (league: TournamentLeague) =>
    league === TournamentLeague.SCHOOL ? t("school") : t("university")

  // Fetch an explicit page so pagination state cannot retrigger the filter-reset effect.
  const fetchTournamentPage = useCallback(async (pageToLoad: number, replace: boolean) => {
    const requestId = activeRequestRef.current + 1
    activeRequestRef.current = requestId
    requestInFlightRef.current = true
    setLoading(true)
    setTournamentError(null)

    if (replace) {
      nextPageRef.current = 0
      setTournaments([])
      setHasMore(false)
    }

    try {
      const params: TournamentGetParams = {
        searchName: searchName || undefined,
        searchLocation: searchLocation || undefined,
        tags: undefined, // Add state for tags if you implement them in filters
        startDateFrom: toBackendDateTime(startDateFrom),
        startDateTo: toBackendDateTime(startDateTo),
        registrationDeadlineFrom: toBackendDateTime(registrationDeadlineFrom),
        registrationDeadlineTo: toBackendDateTime(registrationDeadlineTo),
        league: selectedLeagues.length > 0 ? selectedLeagues[0] : undefined, // Assuming single league filter for simplicity
        nonFull: nonFull || undefined,
      }
      
      const response = await api.getTournaments(params, { page: pageToLoad, size: 10, sort: sortBy }) // Pass all params directly
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("failedToLoadDebates"),
          unauthorized: t("signInToViewDebates"),
          serverError: t("serverError"),
        }))
      }
      const data: PageResult<SimpleTournamentResponse> = await response.json()

      if (requestId !== activeRequestRef.current) {
        return
      }

      setTournaments((previousTournaments) => {
        if (replace) {
          return data.content
        }

        const knownIds = new Set(previousTournaments.map((tournament) => tournament.id))
        const newTournaments = data.content.filter((tournament) => {
          if (knownIds.has(tournament.id)) {
            return false
          }
          knownIds.add(tournament.id)
          return true
        })
        return [...previousTournaments, ...newTournaments]
      })
      nextPageRef.current = pageToLoad + 1
      setHasMore(pageToLoad + 1 < data.totalPages)
    } catch (error) {
      if (requestId !== activeRequestRef.current) {
        return
      }
      setTournamentError(error instanceof Error ? error.message : t("failedToLoadDebates"))
      console.error("Failed to fetch tournaments:", error)
    } finally {
      if (requestId === activeRequestRef.current) {
        requestInFlightRef.current = false
        setLoading(false)
      }
    }
  }, [
      sortBy, searchName, searchLocation, startDateFrom, startDateTo,
      registrationDeadlineFrom, registrationDeadlineTo, selectedLeagues, nonFull, t
  ])

  const fetchKey = JSON.stringify({
    sortBy,
    searchName,
    searchLocation,
    startDateFrom,
    startDateTo,
    registrationDeadlineFrom,
    registrationDeadlineTo,
    selectedLeagues,
    nonFull,
  })
  const lastFetchKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (lastFetchKeyRef.current === fetchKey) {
      return
    }

    lastFetchKeyRef.current = fetchKey
    void fetchTournamentPage(0, true)
  }, [fetchKey, fetchTournamentPage])

  const handleLoadMore = () => {
    if (hasMore && !requestInFlightRef.current) {
      void fetchTournamentPage(nextPageRef.current, false)
    }
  }

  const handleLeagueChange = (league: TournamentLeague) => {
    setSelectedLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]
    )
  }

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTournamentId) {
      setRegistrationError(t("noTournamentSelected"))
      return
    }

    if (!teamName.trim() || !clubName.trim()) {
      setRegistrationError(t("teamAndClubRequiredError"))
      return
    }

    if (!currentUser?.id) {
      setRegistrationError(t("signInBeforeRegisteringError"))
      return
    }

    if (currentUser.role !== Role.PARTICIPANT) {
      setRegistrationError(t("participantOnly"))
      return
    }

    if (!currentUser.profileId) {
      setRegistrationError(t("missingProfile"))
      return
    }

    setIsRegistering(true)
    setRegistrationError(null)

    try {
      const payload = buildTeamRegistrationPayload(currentUser, {
        teamName,
        clubName,
        speakerOneUsername,
        speakerTwoUsername,
        maxInvitedParticipants,
      })

      const response = await api.registerTeam(selectedTournamentId, payload)

      if (!response.ok) {
        setRegistrationError(await readResponseError(response, {
          fallback: t("registrationFailed"),
          unauthorized: t("signInBeforeRegistering"),
          serverError: t("serverError"),
        }))
        return
      }

      setRegistrationSuccess(true)
      // Reset form
      setTeamName('')
      setClubName('')
      setSpeakerOneUsername('')
      setSpeakerTwoUsername('')

      // Close modal after success message
      setTimeout(() => {
        setIsModalOpen(false)
        setRegistrationSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Registration error:', error)
      setRegistrationError(t("unexpectedRegistrationError"))
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">

      {/* Page Title */}
      <section className="text-center py-8">
        <h1 className="text-[#0D1321] text-[56px] font-bold mb-4">{t("exploreDebates")}</h1>
      </section>

      {/* Main Content */}
      <div className="px-8 pb-16">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-[#0D1321] rounded-[16px] p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <Filter className="w-6 h-6 text-[#FFFFFF] mr-3" />
                <h2 className="text-[#FFFFFF] text-[24px] font-medium">{t("filters")}</h2>
              </div>

              {/* Start Date Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">{t("startDate")}</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="start-date-from" className="sr-only">{t("startDateFrom")}</label>
                    <input
                      id="start-date-from"
                      type="date"
                      placeholder={t("startDateFrom")}
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={startDateFrom}
                      onChange={(e) => setStartDateFrom(e.target.value + "T00:00:00")}
                    />
                  </div>
                  <div>
                    <label htmlFor="start-date-to" className="sr-only">{t("startDateTo")}</label>
                    <input
                      id="start-date-to"
                      type="date"
                      placeholder={t("startDateTo")}
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={startDateTo}
                      onChange={(e) => setStartDateTo(e.target.value + "T23:59:59")}
                    />
                  </div>
                </div>
              </div>

              {/* Registration Deadline Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">{t("registrationDeadline")}</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="reg-deadline-from" className="sr-only">{t("registrationDeadlineFrom")}</label>
                    <input
                      id="reg-deadline-from"
                      type="date"
                      placeholder={t("registrationDeadlineFrom")}
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={registrationDeadlineFrom}
                      onChange={(e) => setRegistrationDeadlineFrom(e.target.value + "T00:00:00")}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-deadline-to" className="sr-only">{t("registrationDeadlineTo")}</label>
                    <input
                      id="reg-deadline-to"
                      type="date"
                      placeholder={t("registrationDeadlineTo")}
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={registrationDeadlineTo}
                      onChange={(e) => setRegistrationDeadlineTo(e.target.value + "T23:59:59")}
                    />
                  </div>
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">{t("location")}</h3>
                <label htmlFor="location" className="sr-only">{t("locationLabel")}</label>
                <input
                  id="location"
                  type="text"
                  placeholder={t("placeCity")}
                  className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              {/* League Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">{t("league")}</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-[#FFFFFF] text-[14px] font-normal">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={selectedLeagues.includes(TournamentLeague.SCHOOL)}
                      onChange={() => handleLeagueChange(TournamentLeague.SCHOOL)}
                    />
                    {t("school")}
                  </label>
                  <label className="flex items-center text-[#FFFFFF] text-[14px] font-normal">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={selectedLeagues.includes(TournamentLeague.UNIVERSITY)}
                      onChange={() => handleLeagueChange(TournamentLeague.UNIVERSITY)}
                    />
                    {t("university")}
                  </label>
                </div>
              </div>

              {/* Non-full Filter */}
              <div className="mb-6">
                <label className="flex items-center text-[#FFFFFF] text-[18px] font-medium">
                  <input
                    type="checkbox"
                    className="mr-3 w-4 h-4"
                    checked={nonFull}
                    onChange={(e) => setNonFull(e.target.checked)}
                  />
                  {t("showNonFullDebates")}
                </label>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search and Sort */}
            <div className="flex items-center justify-between mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9a8c98]" />
                <input
                  type="text"
                  placeholder={t("searchByName")}
                  className="w-full pl-12 pr-40 py-3 rounded-[12px] border border-[#9a8c98] text-[#4a4e69] text-[16px] font-normal"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <select
                    className="appearance-none bg-[#3E5C76] text-white px-4 py-2 rounded-full text-[14px] font-normal pr-8 focus:outline-none cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name,asc">{t("nameAscending")}</option>
                    <option value="name,desc">{t("nameDescending")}</option>
                    <option value="startDate,desc">{t("mostRecent")}</option>
                    <option value="startDate,asc">{t("upcoming")}</option>
                    {/* Note: 'popularity' sorting would require backend support. 
                        If not available, these options will sort by startDate. */}
                  </select>
                  <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Debate Cards */}
            <div className="space-y-6">
              {tournamentError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-[16px] text-red-600">
                  <p>{tournamentError}</p>
                  {tournaments.length === 0 && (
                    <button
                      type="button"
                      onClick={() => void fetchTournamentPage(0, true)}
                      disabled={loading}
                      className="mt-3 rounded-lg bg-[#3E5C76] px-5 py-2 text-sm font-medium text-white hover:bg-[#22223b] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t("retry")}
                    </button>
                  )}
                </div>
              )}
              {tournaments.length === 0 && !loading && !tournamentError && (
                <p className="text-[#0D1321] text-center text-[20px]">{t("noDebates")}</p>
              )}
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="bg-[#0D1321] rounded-[16px] p-8 relative">
                  {/* Debate Info */}
                  <div className="flex items-start mb-6">
                    <div className="w-[150px] h-[150px] bg-[#FFFFFF] rounded-full mr-6 overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={resolveMediaUrl(tournament.imageUrl?.url) || "/the-talking-logo.png"} // Use API image if available
                        alt={tournament.name}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#FFFFFF] text-[32px] font-medium mb-2">{tournament.name}</h3>
                      <div className="text-[#9a8c98] text-[16px] font-normal space-y-1 mb-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{t("leagueValue", { league: getLeagueLabel(tournament.league) })}</span>
                        </div>
                        <div className="flex items-center">
                          {/* As SimpleTournamentResponse does not include startDate or location,
                              these will show N/A. To display actual dates/locations here, 
                              SimpleTournamentResponse would need to be updated on the backend. */}
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{t("startDateValue", { date: formatDate(tournament.startDate) })}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{t("locationValue", { location: tournament.location || t("notAvailable") })}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2"> {/* Use flex-wrap for tags */}
                        {tournament.tags && tournament.tags.map(tag => (
                            <span key={tag.name} className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">
                                {tag.name}
                            </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[#9a8c98] text-[16px] font-normal mb-4 leading-relaxed">
                    {tournament.description.length > 200 ? `${tournament.description.substring(0, 200)}...` : tournament.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link href={`/tournament/${tournament.id}`} className="text-[#FFFFFF] underline hover:text-[#748CAB] text-[14px] font-normal">
                      {t("more")}
                    </Link>
                    {canRegisterForTournaments && (
                      <button
                        onClick={() => {
                          setSelectedTournamentId(tournament.id)
                          setRegistrationError(isGuestRegistration ? t("signInBeforeRegistering") : null)
                          setRegistrationSuccess(false)
                          setSpeakerTwoUsername("")
                          setIsModalOpen(true)
                        }}
                        className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal"
                      >
                        {t("joinDebates")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-[#0D1321] text-center text-[20px]">{t("loadingMore")}</p>
              )}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className="bg-[#3E5C76] text-[#FFFFFF] px-8 py-3 rounded-lg hover:bg-[#22223b] text-[16px] font-normal"
                  disabled={loading}
                >
                  {t("loadMore")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0D1321] text-[#FFFFFF] py-16 mt-16">
        <div className="px-8">
          <div className="text-center mb-8">
            <div className="text-[45px] font-bold font-hikasami mb-4">DB</div>
            <div className="flex justify-center space-x-4 mb-8">
              <a
                href="#"
                aria-label={t("telegram")}
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[36px] h-[36px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label={t("youtube")}
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[24px] h-[24px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label={t("instagram")}
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[24px] h-[24px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex justify-center items-center text-[14px] font-normal relative">
            <div className="absolute left-0">{t("contactUs")}</div>
            <div className="font-medium">{t("allRightsReserved")}</div>
            <div className="absolute right-0">{t("privacyPolicy")}</div>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#F1F1F1] rounded-lg p-8 w-full max-w-md mx-4 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              aria-label={t("close")}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-[#0D1321] text-[32px] font-bold text-center mb-8">
              {registrationSuccess ? t("registrationSuccessful") : t("tournamentRegistration")}
            </h2>

            {registrationSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-600 text-[18px] mb-4">{t("registrationSuccess")}</div>
                <p className="text-[#4a4e69] text-[14px]">{t("confirmationEmail")}</p>
              </div>
            ) : (
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <div className="flex items-center">
                  <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">{t("teamName")}</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                    placeholder={t("enterTeamName")}
                  />
                </div>

                <div className="flex items-center">
                  <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">{t("clubName")}</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                    placeholder={t("enterClubName")}
                  />
                </div>

                <div className="flex items-center">
                  <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">{t("teammate")}</label>
                  <input
                    type="text"
                    value={speakerOneUsername}
                    onChange={(e) => setSpeakerOneUsername(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                    placeholder={t("usernameOptional")}
                  />
                </div>

                {maxInvitedParticipants > 1 && (
                  <div className="flex items-center">
                    <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">{t("secondTeammate")}</label>
                    <input
                      type="text"
                      value={speakerTwoUsername}
                      onChange={(e) => setSpeakerTwoUsername(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                      placeholder={t("usernameOptional")}
                    />
                  </div>
                )}

                <div className="text-[#9a8c98] text-[14px] px-2">
                  <p className="mb-2">{t("teammatesOptional")}</p>
                  <p>{t("teamAndClubRequired")}</p>
                </div>

                {isGuestRegistration && (
                  <div role="alert" className="rounded-md border border-[#CFD6EA] bg-white px-4 py-3 text-center">
                    <p className="text-[#0D1321] text-[14px]">{t("signInBeforeRegistering")}</p>
                    <div className="mt-3 flex justify-center gap-3">
                      <Link href="/auth?mode=login" prefetch={false} className="rounded-md bg-[#3E5C76] px-4 py-2 text-sm text-white hover:bg-[#2D3748]">
                        {t("logIn")}
                      </Link>
                      <Link href="/auth?mode=register" prefetch={false} className="rounded-md border border-[#3E5C76] px-4 py-2 text-sm text-[#0D1321] hover:bg-white">
                        {t("register")}
                      </Link>
                    </div>
                  </div>
                )}

                {registrationError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-[14px]">{registrationError}</p>
                  </div>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isRegistering || currentUserLoading || isGuestRegistration}
                    className="w-full bg-[#3E5C76] text-white py-3 rounded-lg text-[16px] font-medium hover:bg-[#2D3748] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? t("registering") : t("registerTeam")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
