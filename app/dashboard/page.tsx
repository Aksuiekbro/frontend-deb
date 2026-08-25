"use client"

import Link from "next/link"
import { useCurrentUser, useUpcomingTournaments, useTournaments } from "../../hooks/use-api"
import { LoadingState, CardSkeleton, LoadingSpinner } from "../../components/ui/loading"
import { ErrorState, EmptyState } from "../../components/ui/error"
import { resolveMediaUrl } from "@/lib/media"
import { localeTags, useLocale, useTranslations } from "@/lib/i18n"
import { ParticipantInvitationInbox } from "@/components/dashboard/ParticipantInvitationInbox"
import { OrganizerInvitationInbox } from "@/components/dashboard/OrganizerInvitationInbox"
import { Role } from "@/types/user/user"

const translations = {
  en: {
    welcome: "Welcome to DeBetter",
    welcomeBack: "Welcome back, {name}!",
    debateOrganisation: "website for debates organisation",
    joinDebates: "Join Debates",
    hostDebate: "Host Debate",
    welcomeBackHeading: "Welcome Back",
    profileAlt: "{name} profile",
    myProfile: "My Profile",
    myTournaments: "My Tournaments",
    yourStats: "Your Stats",
    tournaments: "Tournaments",
    upcoming: "Upcoming",
    rating: "Rating",
    ranking: "Ranking",
    userFallback: "User",
    failedUser: "Failed to load user profile",
    loginWelcome: "Welcome to DeBetter!",
    loginDescription: "Please log in to view your personalized dashboard",
    login: "Login",
    upcomingDebates: "Upcoming Debates",
    failedUpcoming: "Failed to load upcoming tournaments",
    dateTba: "Date TBA",
    more: "More...",
    noUpcoming: "No upcoming tournaments",
    noUpcomingDescription: "Check back later for new tournaments to join",
    browseTournaments: "Browse All Tournaments",
    pastDebates: "Past debates",
    failedPast: "Failed to load past tournaments",
    format: "Format",
    teams: "Teams",
    viewDetails: "View Details",
    noPast: "No past tournaments",
    noPastDescription: "Your tournament history will appear here",
    joinTournament: "Join a Tournament",
    communityHighlights: "Community Highlights",
    communityDescription: "Community highlights will appear here as users participate in tournaments",
    leaderboard: "Leader Board",
    viewLeaderboard: "View Full Leaderboard",
    leaderboardDisabled: "Leaderboard is disabled until ratings are supported.",
  },
  ru: {
    welcome: "Добро пожаловать в DeBetter",
    welcomeBack: "С возвращением, {name}!",
    debateOrganisation: "сайт для организации дебатов",
    joinDebates: "Присоединиться к дебатам",
    hostDebate: "Организовать дебаты",
    welcomeBackHeading: "С возвращением",
    profileAlt: "Профиль: {name}",
    myProfile: "Мой профиль",
    myTournaments: "Мои турниры",
    yourStats: "Ваша статистика",
    tournaments: "Турниры",
    upcoming: "Предстоящие",
    rating: "Рейтинг",
    ranking: "Место в рейтинге",
    userFallback: "пользователь",
    failedUser: "Не удалось загрузить профиль пользователя",
    loginWelcome: "Добро пожаловать в DeBetter!",
    loginDescription: "Войдите, чтобы просмотреть персональную панель управления",
    login: "Войти",
    upcomingDebates: "Предстоящие дебаты",
    failedUpcoming: "Не удалось загрузить предстоящие турниры",
    dateTba: "Дата уточняется",
    more: "Подробнее...",
    noUpcoming: "Нет предстоящих турниров",
    noUpcomingDescription: "Зайдите позже, чтобы найти новые турниры",
    browseTournaments: "Все турниры",
    pastDebates: "Прошедшие дебаты",
    failedPast: "Не удалось загрузить прошедшие турниры",
    format: "Формат",
    teams: "Команды",
    viewDetails: "Подробнее",
    noPast: "Нет прошедших турниров",
    noPastDescription: "Здесь появится история ваших турниров",
    joinTournament: "Присоединиться к турниру",
    communityHighlights: "События сообщества",
    communityDescription: "Здесь появятся события сообщества по мере участия пользователей в турнирах",
    leaderboard: "Таблица лидеров",
    viewLeaderboard: "Полная таблица лидеров",
    leaderboardDisabled: "Таблица лидеров недоступна, пока не поддерживаются рейтинги.",
  },
  kk: {
    welcome: "DeBetter-ге қош келдіңіз",
    welcomeBack: "Қайта қош келдіңіз, {name}!",
    debateOrganisation: "пікірсайыстарды ұйымдастыруға арналған сайт",
    joinDebates: "Пікірсайысқа қосылу",
    hostDebate: "Пікірсайыс ұйымдастыру",
    welcomeBackHeading: "Қайта қош келдіңіз",
    profileAlt: "{name} профилі",
    myProfile: "Менің профилім",
    myTournaments: "Менің турнирлерім",
    yourStats: "Статистикаңыз",
    tournaments: "Турнирлер",
    upcoming: "Алда болатын",
    rating: "Рейтинг",
    ranking: "Рейтингтегі орын",
    userFallback: "пайдаланушы",
    failedUser: "Пайдаланушы профилін жүктеу мүмкін болмады",
    loginWelcome: "DeBetter-ге қош келдіңіз!",
    loginDescription: "Жекелендірілген басқару тақтасын көру үшін жүйеге кіріңіз",
    login: "Кіру",
    upcomingDebates: "Алда болатын пікірсайыстар",
    failedUpcoming: "Алда болатын турнирлерді жүктеу мүмкін болмады",
    dateTba: "Күні нақтылануда",
    more: "Толығырақ...",
    noUpcoming: "Алда болатын турнирлер жоқ",
    noUpcomingDescription: "Қосылатын жаңа турнирлерді кейінірек тексеріңіз",
    browseTournaments: "Барлық турнирлерді көру",
    pastDebates: "Өткен пікірсайыстар",
    failedPast: "Өткен турнирлерді жүктеу мүмкін болмады",
    format: "Формат",
    teams: "Командалар",
    viewDetails: "Толығырақ көру",
    noPast: "Өткен турнирлер жоқ",
    noPastDescription: "Турнирлер тарихыңыз осында көрсетіледі",
    joinTournament: "Турнирге қосылу",
    communityHighlights: "Қауымдастық жаңалықтары",
    communityDescription: "Пайдаланушылар турнирлерге қатысқан сайын қауымдастық жаңалықтары осында көрсетіледі",
    leaderboard: "Көшбасшылар кестесі",
    viewLeaderboard: "Көшбасшылар кестесін толық көру",
    leaderboardDisabled: "Рейтингтерге қолдау көрсетілгенше көшбасшылар кестесі өшірулі.",
  },
} as const

const getTagLabel = (tag: { name?: string } | string) => (typeof tag === "string" ? tag : tag.name ?? "")

export default function Dashboard() {
  const { locale } = useLocale()
  const t = useTranslations(translations)
  const isPreview = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_PREVIEW_MODE === "true"
  const formatTournamentDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString(localeTags[locale]) : t("dateTba")

  // API hooks
  const { user: currentUser, isLoading: userLoading, error: userError } = useCurrentUser()
  const { upcomingTournaments, isLoading: upcomingLoading, error: upcomingError } = useUpcomingTournaments(6)

  // Get past tournaments
  const currentDate = new Date().toISOString().slice(0,19)
  const { tournaments: pastTournamentsData, isLoading: pastLoading, error: pastError } = useTournaments(
    { startDateTo: currentDate },
    { page: 0, size: 6, sort: ['startDate,desc'] }
  )

  return (
    <div className="min-h-screen bg-white font-hikasami">

      {/* Hero Section with User Welcome */}
      <section className="text-center py-8">
        <LoadingState
          isLoading={userLoading}
          fallback={<div className="h-16 bg-gray-200 animate-pulse mx-8 rounded"></div>}
        >
          {userError ? (
            <h1 className="text-[#0D1321] text-3xl sm:text-4xl lg:text-[56px] font-bold mb-8">{t("welcome")}</h1>
          ) : (
            <h1 className="text-[#0D1321] text-3xl sm:text-4xl lg:text-[56px] font-bold mb-8">
              {t("welcomeBack", { name: currentUser?.firstName || t("userFallback") })}
            </h1>
          )}
        </LoadingState>

        <div className="bg-[#0D1321] rounded-[16px] mx-8 py-16 px-8 relative">
          <h2 className="text-[#FFFFFF] text-2xl sm:text-3xl lg:text-[46px] font-semibold mb-8">
            <span className="text-[#748CAB] font-hikasami text-inherit font-semibold">DeBetter</span> - {t("debateOrganisation")}
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4 mb-8">
            <Link href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal text-center">
              {t("joinDebates")}
            </Link>
            <Link href="/create-tournament" className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal text-center">
              {t("hostDebate")}
            </Link>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-[8px] h-[8px] bg-[#4a4e69] rounded-full"></div>
            <div className="w-[8px] h-[8px] bg-[#FFFFFF] rounded-full"></div>
            <div className="w-[8px] h-[8px] bg-[#4a4e69] rounded-full"></div>
          </div>
        </div>
      </section>

      {/* User Welcome Back Section */}
      <section className="px-8 py-8">
        <div className="bg-gradient-to-r from-[#0D1321] to-[#3E5C76] rounded-[16px] p-8 relative overflow-hidden">
          <div className="relative z-10">
            <LoadingState
              isLoading={userLoading}
            fallback={<LoadingSpinner size="lg" />}
            >
              {userError ? (
                <ErrorState
                  error={userError}
                  onRetry={() => window.location.reload()}
                  message={t("failedUser")}
                />
              ) : currentUser ? (
                <>
                  <div className="flex items-center space-x-4 mb-6">
                    {currentUser.imageUrl ? (
                      <img
                        src={resolveMediaUrl(currentUser.imageUrl.url)}
                        alt={t("profileAlt", { name: `${currentUser.firstName} ${currentUser.lastName}` })}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[#c9ada7] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                      </div>
                    )}
                    <h3 className="text-[#FFFFFF] text-[36px] font-semibold">
                      {t("welcomeBackHeading")} <span className="text-[#748CAB]">{currentUser.firstName} {currentUser.lastName}!</span>
                    </h3>
                  </div>

                  <div className="flex space-x-4 mb-8">
                    <Link href={`/profile/${currentUser.id}`} className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal">
                      {t("myProfile")}
                    </Link>
                    <Link href="/my-tournaments" className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal">
                      {t("myTournaments")}
                    </Link>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-[#FFFFFF] text-[24px] font-medium mb-4">{t("yourStats")}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                        </div>
                        <div>
                          <div className="text-[#FFFFFF] text-[20px] font-medium">0</div>
                          <div className="text-[#9a8c98] text-[14px]">{t("tournaments")}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                        </div>
                        <div>
                          <div className="text-[#FFFFFF] text-[20px] font-medium">{upcomingTournaments?.content?.length || 0}</div>
                          <div className="text-[#9a8c98] text-[14px]">{t("upcoming")}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                        </div>
                        <div>
                          <div className="text-[#FFFFFF] text-[20px] font-medium">0</div>
                          <div className="text-[#9a8c98] text-[14px]">{t("rating")}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                        </div>
                        <div>
                          <div className="text-[#FFFFFF] text-[20px] font-medium">-</div>
                          <div className="text-[#9a8c98] text-[14px]">{t("ranking")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title={t("loginWelcome")}
                  description={t("loginDescription")}
                  actionText={t("login")}
                  actionHref="/auth?mode=login"
                  prefetch={false}
                />
              )}
            </LoadingState>
          </div>
        </div>
      </section>

      {!isPreview && currentUser?.role === Role.PARTICIPANT && (
        <ParticipantInvitationInbox key={currentUser.id} userId={currentUser.id} />
      )}
      {!isPreview && currentUser?.role === Role.ORGANIZER && (
        <OrganizerInvitationInbox key={currentUser.id} />
      )}

      {/* Upcoming Debates */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8">{t("upcomingDebates")}</h3>

        <LoadingState
          isLoading={upcomingLoading}
          fallback={
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2].map(i => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {upcomingError ? (
            <ErrorState
              error={upcomingError}
              onRetry={() => window.location.reload()}
              message={t("failedUpcoming")}
            />
          ) : upcomingTournaments && upcomingTournaments.content.length > 0 ? (
            <div className="relative">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {upcomingTournaments.content.slice(0, 2).map((tournament) => {
                  const formattedDate = formatTournamentDate(tournament.startDate)

                  return (
                    <div key={tournament.id} className="bg-[#0D1321] rounded-[12px] p-6 min-w-0">
                      <h4 className="text-[#FFFFFF] text-[30px] font-medium mb-2">{tournament.name}</h4>
                      <p className="text-[#9a8c98] mb-1 text-[16px] font-normal">{tournament.location}</p>
                      <p className="text-[#9a8c98] mb-4 text-[16px] font-normal">{formattedDate}</p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {tournament.tags.map((tag, index) => (
                          <span key={index} className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">
                            {getTagLabel(tag)}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-start">
                          <Link href={`/tournament/${tournament.id}`} className="text-[#FFFFFF] underline hover:text-[#83c5be] text-[14px] font-normal">
                            {t("more")}
                          </Link>
                        </div>
                        <div className="flex justify-start">
                          <Link href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#748cab] text-[14px] font-normal text-center">
                            {t("joinDebates")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title={t("noUpcoming")}
              description={t("noUpcomingDescription")}
              actionText={t("browseTournaments")}
              actionHref="/tournaments"
            />
          )}
        </LoadingState>
      </section>

      {/* Past Debates Section */}
      <section className="px-8 py-12">
        <div className="bg-[#3E5C76] rounded-[16px] p-8 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <h3 className="text-[#748CAB] text-[120px] font-bold opacity-30 select-none">
              {t("pastDebates")}
            </h3>
          </div>

          <div className="relative z-10">
            <LoadingState
              isLoading={pastLoading}
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-300 animate-pulse rounded-[12px] h-48"></div>
                  ))}
                </div>
              }
            >
              {pastError ? (
                <ErrorState
                  error={pastError}
                  onRetry={() => window.location.reload()}
                  message={t("failedPast")}
                />
              ) : pastTournamentsData && pastTournamentsData.content.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pastTournamentsData.content.slice(0, 3).map((tournament, index) => {
                    const gradients = [
                      'from-orange-500 to-red-600',
                      'from-green-500 to-teal-600',
                      'from-purple-500 to-blue-600',
                      'from-pink-500 to-rose-600',
                      'from-blue-500 to-indigo-600',
                      'from-yellow-500 to-orange-600'
                    ]
                    const gradient = gradients[index % gradients.length]
                    const formattedDate = formatTournamentDate(tournament.startDate)

                    return (
                      <div key={tournament.id} className={`bg-gradient-to-br ${gradient} rounded-[12px] p-6 h-48 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        <div className="relative z-10">
                          <h4 className="text-white text-[24px] font-semibold mb-2">{tournament.name}</h4>
                          <p className="text-white/80 text-[14px] mb-1">{tournament.location}</p>
                          <p className="text-white/80 text-[14px] mb-4">{formattedDate}</p>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex flex-wrap gap-1 mb-4">
                              <span className="bg-white text-black px-2 py-1 rounded text-[12px]">{t("format")}: {tournament.debateFormat}</span>
                              <span className="bg-white text-black px-2 py-1 rounded text-[12px]">{t("teams")}: {tournament.currentTeamCount}</span>
                            </div>
                            <Link
                              href={`/tournament/${tournament.id}`}
                              className="text-white underline hover:text-white/80 text-[12px]"
                            >
                              {t("viewDetails")}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  title={t("noPast")}
                  description={t("noPastDescription")}
                  actionText={t("joinTournament")}
                  actionHref="/tournaments"
                />
              )}
            </LoadingState>
          </div>
        </div>
      </section>

      {/* Testimonials (Leaderboard disabled) */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8">{t("communityHighlights")}</h3>
        <div className="bg-white border border-[#9a8c98] rounded-[12px] py-8 px-6 text-center">
          <p className="text-[#0D1321] text-[16px] font-normal">{t("communityDescription")}</p>
        </div>
      </section>

      {/* Leader Board (disabled) */}
      <section className="px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[#0D1321] text-[38px] font-semibold">{t("leaderboard")}</h3>
          <Link href="/rating" className="text-[#4a4e69] underline hover:text-[#748CAB] text-[16px] font-normal">
            {t("viewLeaderboard")}
          </Link>
        </div>
        <div className="bg-white border border-[#9a8c98] rounded-[12px] py-16 px-6 text-center">
          <p className="text-[#0D1321] text-[16px] font-normal">{t("leaderboardDisabled")}</p>
        </div>
      </section>
    </div>
  )
}
