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
    visibilityUpdateFailed: "Failed to update results visibility",
    permissionDenied: "You do not have permission to perform this action.",
    serverError: "Server error. Please try again later.",
    resultsPublished: "Results published",
    resultsHidden: "Results hidden",
    publishedDescription: "Results for {name} are now visible to participants.",
    hiddenDescription: "Results for {name} are now hidden from participants.",
    updateFailed: "Failed to update results visibility",
    tryAgain: "Please try again later.",
  },
  ru: {
    visibilityUpdateFailed: "Не удалось изменить видимость результатов",
    permissionDenied: "У вас нет разрешения на выполнение этого действия.",
    serverError: "Ошибка сервера. Повторите попытку позже.",
    resultsPublished: "Результаты опубликованы",
    resultsHidden: "Результаты скрыты",
    publishedDescription: "Результаты турнира «{name}» теперь видны участникам.",
    hiddenDescription: "Результаты турнира «{name}» теперь скрыты от участников.",
    updateFailed: "Не удалось изменить видимость результатов",
    tryAgain: "Повторите попытку позже.",
  },
  kk: {
    visibilityUpdateFailed: "Нәтижелердің көрінуін жаңарту мүмкін болмады",
    permissionDenied: "Бұл әрекетті орындауға рұқсатыңыз жоқ.",
    serverError: "Сервер қатесі. Кейінірек қайталап көріңіз.",
    resultsPublished: "Нәтижелер жарияланды",
    resultsHidden: "Нәтижелер жасырылды",
    publishedDescription: "«{name}» турнирінің нәтижелері енді қатысушыларға көрінеді.",
    hiddenDescription: "«{name}» турнирінің нәтижелері енді қатысушылардан жасырылды.",
    updateFailed: "Нәтижелердің көрінуін жаңарту мүмкін болмады",
    tryAgain: "Кейінірек қайталап көріңіз.",
  },
}

export function useTournamentVisibility({ tournament, toast }: UseTournamentVisibilityParams) {
  const t = useTranslations(messages)
  const [areResultsVisible, setAreResultsVisible] = useState(tournament?.disabled !== true)
  const [resultsVisibilityUpdating, setResultsVisibilityUpdating] = useState(false)

  useEffect(() => {
    if (typeof tournament?.disabled === "boolean") {
      setAreResultsVisible(!tournament.disabled)
    }
  }, [tournament?.disabled])

  const handleResultsVisibilityToggle = async (nextValue: boolean) => {
    if (!tournament) return

    const previousValue = areResultsVisible
    setAreResultsVisible(nextValue)
    setResultsVisibilityUpdating(true)

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
        title: nextValue ? t("resultsPublished") : t("resultsHidden"),
        description: nextValue
          ? t("publishedDescription", { name: tournament.name })
          : t("hiddenDescription", { name: tournament.name }),
      })
    } catch (error) {
      console.error("Failed to toggle results visibility", error)
      setAreResultsVisible(previousValue)
      toast?.({
        title: t("updateFailed"),
        description: error instanceof Error ? error.message : t("tryAgain"),
        variant: "destructive",
      })
    } finally {
      setResultsVisibilityUpdating(false)
    }
  }

  return {
    areResultsVisible,
    resultsVisibilityUpdating,
    handleResultsVisibilityToggle,
  }
}
