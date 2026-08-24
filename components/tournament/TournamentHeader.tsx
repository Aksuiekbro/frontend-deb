"use client"

import { Skeleton } from "@/components/ui/loading"
import { Switch } from "@/components/ui/switch"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: { prefix: "Tournament", error: "Error loading data", unknown: "Unknown Tournament", starting: "Starting...", start: "Start tournament", visible: "Visible to participants", hidden: "Hidden from participants", toggle: "Toggle participant visibility", invite: "Invite" },
  ru: { prefix: "Турнир", error: "Ошибка загрузки данных", unknown: "Неизвестный турнир", starting: "Запуск...", start: "Начать турнир", visible: "Виден участникам", hidden: "Скрыт от участников", toggle: "Переключить видимость для участников", invite: "Пригласить" },
  kk: { prefix: "Турнир", error: "Деректерді жүктеу қатесі", unknown: "Белгісіз турнир", starting: "Іске қосылуда...", start: "Турнирді бастау", visible: "Қатысушыларға көрінеді", hidden: "Қатысушылардан жасырын", toggle: "Қатысушыларға көрінуді ауыстыру", invite: "Шақыру" },
}

interface TournamentHeaderProps {
  tournamentName?: string
  tournamentLoading: boolean
  tournamentError?: Error
  isOrganizer: boolean
  isTournamentEnabled: boolean
  toggleTournamentLoading: boolean
  onToggleTournament: (checked: boolean) => void
  onOpenInvite?: () => void
  onStartTournament?: () => void
  startTournamentLoading?: boolean
}

export function TournamentHeader({
  tournamentName,
  tournamentLoading,
  tournamentError,
  isOrganizer,
  isTournamentEnabled,
  toggleTournamentLoading,
  onToggleTournament,
  onOpenInvite,
  onStartTournament,
  startTournamentLoading = false,
}: TournamentHeaderProps) {
  const t = useTranslations(catalog)
  return (
    <section className="px-4 py-6 sm:px-6 lg:px-12 lg:py-8">
      <div className="flex flex-col items-start gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
        {tournamentLoading ? (
          <Skeleton className="h-12 w-96" />
        ) : tournamentError ? (
          <h1 className="text-[#0D1321] text-3xl sm:text-4xl lg:text-[48px] font-bold break-words">{t("prefix")}: {t("error")}</h1>
        ) : (
          <h1 className="text-[#0D1321] text-3xl sm:text-4xl lg:text-[48px] font-bold break-words">{t("prefix")}: {tournamentName || t("unknown")}</h1>
        )}
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:gap-4">
          {isOrganizer && onStartTournament && (
            <button
              type="button"
              onClick={onStartTournament}
              disabled={startTournamentLoading || tournamentLoading}
              className="rounded-lg bg-[#0D1321] px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1D2D44] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startTournamentLoading ? t("starting") : t("start")}
            </button>
          )}
          {isOrganizer && (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm font-medium text-[#0D1321]">
                {isTournamentEnabled ? t("visible") : t("hidden")}
              </span>
              <Switch
                checked={isTournamentEnabled}
                onCheckedChange={onToggleTournament}
                disabled={toggleTournamentLoading || tournamentLoading}
                aria-label={t("toggle")}
              />
            </div>
          )}
          {isOrganizer && onOpenInvite ? (
            <button
              onClick={onOpenInvite}
              className="px-6 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
            >
              {t("invite")}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
