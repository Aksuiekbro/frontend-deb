"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"
import type { TournamentResponse } from "@/types/tournament/tournament"
import type { useToast } from "@/hooks/use-toast"

export type ToastFn = ReturnType<typeof useToast>["toast"]

interface UseTournamentVisibilityParams {
  tournament?: TournamentResponse
  toast?: ToastFn
}

const messages: TranslationCatalog = {
  en: {
    visibilityUpdateFailed: "Failed to update tournament visibility",
    permissionDenied: "You do not have permission to perform this action.",
    serverError: "Server error. Please try again later.",
    tournamentVisible: "Tournament visible",
    tournamentHidden: "Tournament hidden",
    visibleDescription: "{name} is now visible to participants.",
    hiddenDescription: "{name} is now hidden from participants.",
    updateFailed: "Failed to update tournament",
    tryAgain: "Please try again later.",
  },
  ru: {
    visibilityUpdateFailed: "Не удалось изменить видимость турнира",
    permissionDenied: "У вас нет разрешения на выполнение этого действия.",
    serverError: "Ошибка сервера. Повторите попытку позже.",
    tournamentVisible: "Турнир виден",
    tournamentHidden: "Турнир скрыт",
    visibleDescription: "Турнир «{name}» теперь виден участникам.",
    hiddenDescription: "Турнир «{name}» теперь скрыт от участников.",
    updateFailed: "Не удалось обновить турнир",
    tryAgain: "Повторите попытку позже.",
  },
  kk: {
    visibilityUpdateFailed: "Турнирдің көріну күйін жаңарту мүмкін болмады",
    permissionDenied: "Бұл әрекетті орындауға рұқсатыңыз жоқ.",
    serverError: "Сервер қатесі. Кейінірек қайталап көріңіз.",
    tournamentVisible: "Турнир көрінеді",
    tournamentHidden: "Турнир жасырылды",
    visibleDescription: "«{name}» турнирі енді қатысушыларға көрінеді.",
    hiddenDescription: "«{name}» турнирі енді қатысушылардан жасырылды.",
    updateFailed: "Турнирді жаңарту мүмкін болмады",
    tryAgain: "Кейінірек қайталап көріңіз.",
  },
}

export function useTournamentVisibility({ tournament, toast }: UseTournamentVisibilityParams) {
  const t = useTranslations(messages)
  const [isTournamentEnabled, setIsTournamentEnabled] = useState(false)
  const [toggleTournamentLoading, setToggleTournamentLoading] = useState(false)

  useEffect(() => {
    if (typeof tournament?.disabled === "boolean") {
      setIsTournamentEnabled(!tournament.disabled)
    }
  }, [tournament?.disabled])

  const handleTournamentToggle = async (nextValue: boolean) => {
    if (!tournament) return

    const previousValue = isTournamentEnabled
    setIsTournamentEnabled(nextValue)
    setToggleTournamentLoading(true)

    try {
      const response = nextValue
        ? await api.enableTournament(tournament.id)
        : await api.disableTournament(tournament.id)

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: t("visibilityUpdateFailed"),
          unauthorized: t("permissionDenied"),
          serverError: t("serverError"),
        }))
      }

      toast?.({
        title: nextValue ? t("tournamentVisible") : t("tournamentHidden"),
        description: nextValue
          ? t("visibleDescription", { name: tournament.name })
          : t("hiddenDescription", { name: tournament.name }),
      })
    } catch (error) {
      console.error("Failed to toggle tournament status", error)
      setIsTournamentEnabled(previousValue)
      toast?.({
        title: t("updateFailed"),
        description: error instanceof Error ? error.message : t("tryAgain"),
        variant: "destructive",
      })
    } finally {
      setToggleTournamentLoading(false)
    }
  }

  return {
    isTournamentEnabled,
    toggleTournamentLoading,
    handleTournamentToggle,
  }
}
