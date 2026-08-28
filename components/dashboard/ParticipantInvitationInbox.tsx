"use client"

import Link from "next/link"
import { Check, LoaderCircle, Mail, RefreshCw, Users, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSWRConfig } from "swr"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { localeTags, useLocale, useTranslations } from "@/lib/i18n"
import type { PageResult } from "@/types/page"
import type { ParticipantInvitationResponse } from "@/types/util/request/invitation"

const translations = {
  en: {
    heading: "Team invitations",
    description: "Review invitations to join a debate team.",
    refresh: "Refresh team invitations",
    loading: "Loading team invitations…",
    loadFailed: "We couldn't load your team invitations.",
    retry: "Try again",
    empty: "No pending team invitations",
    emptyDescription: "New invitations will appear here.",
    unknownTournament: "Tournament not available",
    unknownTeam: "Unnamed team",
    unknownInviter: "Another participant",
    team: "Team: {team}",
    invitedBy: "Invited by {inviter}",
    received: "Received {date}",
    recently: "recently",
    viewTournament: "View tournament",
    accept: "Accept",
    decline: "Decline",
    accepting: "Accepting…",
    declining: "Declining…",
    acceptInvitation: "Accept invitation to {team}",
    declineInvitation: "Decline invitation to {team}",
    accepted: "You joined {team}.",
    declined: "You declined the invitation to {team}.",
    actionFailed: "We couldn't update this invitation. Please try again.",
    stale: "This invitation is no longer available. Refresh to see your latest invitations.",
  },
  ru: {
    heading: "Приглашения в команду",
    description: "Просмотрите приглашения присоединиться к команде дебатёров.",
    refresh: "Обновить приглашения в команду",
    loading: "Загрузка приглашений…",
    loadFailed: "Не удалось загрузить приглашения в команду.",
    retry: "Попробовать снова",
    empty: "Нет ожидающих приглашений",
    emptyDescription: "Новые приглашения появятся здесь.",
    unknownTournament: "Турнир недоступен",
    unknownTeam: "Команда без названия",
    unknownInviter: "Другой участник",
    team: "Команда: {team}",
    invitedBy: "Приглашение от {inviter}",
    received: "Получено: {date}",
    recently: "недавно",
    viewTournament: "Открыть турнир",
    accept: "Принять",
    decline: "Отклонить",
    accepting: "Принимаем…",
    declining: "Отклоняем…",
    acceptInvitation: "Принять приглашение в команду {team}",
    declineInvitation: "Отклонить приглашение в команду {team}",
    accepted: "Вы присоединились к команде {team}.",
    declined: "Вы отклонили приглашение в команду {team}.",
    actionFailed: "Не удалось обновить приглашение. Попробуйте снова.",
    stale: "Это приглашение больше недоступно. Обновите список приглашений.",
  },
  kk: {
    heading: "Командаға шақырулар",
    description: "Пікірсайыс командасына қосылу туралы шақыруларды қарап шығыңыз.",
    refresh: "Команда шақыруларын жаңарту",
    loading: "Шақырулар жүктелуде…",
    loadFailed: "Команда шақыруларын жүктеу мүмкін болмады.",
    retry: "Қайталап көру",
    empty: "Күтудегі шақырулар жоқ",
    emptyDescription: "Жаңа шақырулар осында көрсетіледі.",
    unknownTournament: "Турнир қолжетімсіз",
    unknownTeam: "Атауы жоқ команда",
    unknownInviter: "Басқа қатысушы",
    team: "Команда: {team}",
    invitedBy: "Шақырған: {inviter}",
    received: "Алынған күні: {date}",
    recently: "жуырда",
    viewTournament: "Турнирді ашу",
    accept: "Қабылдау",
    decline: "Қабылдамау",
    accepting: "Қабылдануда…",
    declining: "Қабылданбауда…",
    acceptInvitation: "{team} командасына шақыруды қабылдау",
    declineInvitation: "{team} командасына шақыруды қабылдамау",
    accepted: "Сіз {team} командасына қосылдыңыз.",
    declined: "Сіз {team} командасына шақыруды қабылдамадыңыз.",
    actionFailed: "Шақыруды жаңарту мүмкін болмады. Қайталап көріңіз.",
    stale: "Бұл шақыру енді қолжетімсіз. Соңғы шақыруларды көру үшін тізімді жаңартыңыз.",
  },
} as const

type InvitationAction = "accept" | "decline"

interface InvitationActionState {
  pendingAction?: InvitationAction
  error?: string
  stale?: boolean
}

const INBOX_PAGE_SIZE = 50
const INBOX_SORT = "timestamp,desc"
const STALE_RESPONSE_STATUSES = new Set([404, 409])

function inviterLabel(invitation: ParticipantInvitationResponse, fallback: string) {
  const inviter = invitation.inviter
  if (!inviter) return fallback

  const fullName = [inviter.firstName, inviter.lastName].filter(Boolean).join(" ").trim()
  if (fullName && inviter.username) return `${fullName} (@${inviter.username})`
  if (fullName) return fullName
  if (inviter.username) return `@${inviter.username}`
  return fallback
}

export function ParticipantInvitationInbox({ userId }: { userId: number }) {
  const { locale } = useLocale()
  const t = useTranslations(translations)
  const { mutate: mutateCache } = useSWRConfig()
  const [invitations, setInvitations] = useState<ParticipantInvitationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState("")
  const [actionStates, setActionStates] = useState<Record<number, InvitationActionState>>({})
  const mountedRef = useRef(true)
  const requestSequenceRef = useRef(0)

  const loadInvitations = useCallback(async (initial = false) => {
    const requestId = ++requestSequenceRef.current

    if (initial) setIsLoading(true)
    else setIsRefreshing(true)
    setLoadError(null)

    try {
      const invitationsById = new Map<number, ParticipantInvitationResponse>()
      let pageNumber = 0
      let totalPages = 1

      while (pageNumber < totalPages) {
        const response = await api.getReceivedParticipantInvitations({
          page: pageNumber,
          size: INBOX_PAGE_SIZE,
          sort: INBOX_SORT,
        })
        if (!response.ok) {
          throw new Error(await readResponseError(response, { fallback: t("loadFailed") }))
        }

        const page = await response.json() as PageResult<ParticipantInvitationResponse>
        if (!mountedRef.current || requestId !== requestSequenceRef.current) return false

        if (Array.isArray(page.content)) {
          page.content.forEach((invitation) => invitationsById.set(invitation.id, invitation))
        }

        const reportedTotalPages = Number.isInteger(page.totalPages) && page.totalPages > 0
          ? page.totalPages
          : 1
        totalPages = Math.max(totalPages, reportedTotalPages)
        pageNumber += 1
      }

      const pendingInvitations = Array.from(invitationsById.values())
        .filter((invitation) => invitation.accepted !== true)

      if (!mountedRef.current || requestId !== requestSequenceRef.current) return false

      setInvitations(pendingInvitations)
      setActionStates((current) => {
        const pendingIds = new Set(pendingInvitations.map((invitation) => invitation.id))
        return Object.fromEntries(
          Object.entries(current).filter(([id]) => pendingIds.has(Number(id))),
        )
      })
      return true
    } catch (error) {
      if (!mountedRef.current || requestId !== requestSequenceRef.current) return false
      setLoadError(error instanceof Error ? error.message : t("loadFailed"))
      return false
    } finally {
      if (mountedRef.current && requestId === requestSequenceRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [t])

  useEffect(() => {
    mountedRef.current = true
    void loadInvitations(true)

    return () => {
      mountedRef.current = false
      requestSequenceRef.current += 1
    }
  }, [loadInvitations])

  const handleInvitation = async (
    invitation: ParticipantInvitationResponse,
    action: InvitationAction,
  ) => {
    const invitationId = invitation.id
    const teamName = invitation.team?.name || t("unknownTeam")

    setResultMessage("")
    setActionStates((current) => ({
      ...current,
      [invitationId]: { pendingAction: action },
    }))

    try {
      const response = action === "accept"
        ? await api.acceptParticipantInvitation(invitationId)
        : await api.rejectParticipantInvitation(invitationId)

      if (!response.ok) {
        const stale = STALE_RESPONSE_STATUSES.has(response.status)
        const responseMessage = await readResponseError(response, { fallback: t("actionFailed") })

        if (!mountedRef.current) return
        setActionStates((current) => ({
          ...current,
          [invitationId]: {
            error: stale ? t("stale") : responseMessage,
            stale,
          },
        }))

        if (stale) await loadInvitations()
        return
      }

      if (action === "accept") {
        await mutateCache(
          (key) => Array.isArray(key)
            && (
              (key[0] === "my-tournaments" && key[1] === userId)
              || (key[0] === "tournament-teams" && key[1] === invitation.tournament?.id)
            ),
          undefined,
          { revalidate: true },
        ).catch(() => undefined)
      }

      if (!mountedRef.current) return
      setInvitations((current) => current.filter(({ id }) => id !== invitationId))
      setActionStates((current) => {
        const next = { ...current }
        delete next[invitationId]
        return next
      })
      setResultMessage(t(action === "accept" ? "accepted" : "declined", { team: teamName }))
      await loadInvitations()
    } catch {
      if (!mountedRef.current) return
      setActionStates((current) => ({
        ...current,
        [invitationId]: { error: t("actionFailed") },
      }))
    } finally {
      if (!mountedRef.current) return
      setActionStates((current) => {
        const currentState = current[invitationId]
        if (!currentState?.pendingAction) return current
        return {
          ...current,
          [invitationId]: { ...currentState, pendingAction: undefined },
        }
      })
    }
  }

  return (
    <section className="px-8 py-8" aria-labelledby="team-invitations-heading">
      <div className="rounded-2xl border border-[#D7DCE5] bg-[#F8FAFC] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4EAF1] text-[#3E5C76]" aria-hidden="true">
                <Mail className="h-5 w-5" />
              </span>
              <h2 id="team-invitations-heading" className="text-2xl font-semibold text-[#0D1321] sm:text-3xl">
                {t("heading")}
              </h2>
            </div>
            <p className="mt-2 text-sm text-[#4A5568] sm:ml-[52px]">{t("description")}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadInvitations()}
            disabled={isLoading || isRefreshing}
            aria-label={t("refresh")}
            className="self-start border-[#AAB4C3] bg-white text-[#0D1321] hover:bg-[#E4EAF1]"
          >
            <RefreshCw className={isRefreshing ? "motion-safe:animate-spin" : ""} aria-hidden="true" />
            {t("refresh")}
          </Button>
        </div>

        {resultMessage && (
          <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" aria-live="polite">
            {resultMessage}
          </p>
        )}

        {isLoading ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#D7DCE5] bg-white p-5 text-[#4A5568]" role="status">
            <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />
            <span>{t("loading")}</span>
          </div>
        ) : loadError && invitations.length === 0 ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
            <p className="text-sm text-red-800">{loadError}</p>
            <Button
              type="button"
              size="sm"
              onClick={() => void loadInvitations()}
              className="mt-4 bg-[#3E5C76] text-white hover:bg-[#0D1321]"
            >
              {t("retry")}
            </Button>
          </div>
        ) : invitations.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[#AAB4C3] bg-white px-5 py-8 text-center">
            <Users className="mx-auto h-8 w-8 text-[#748CAB]" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-medium text-[#0D1321]">{t("empty")}</h3>
            <p className="mt-1 text-sm text-[#4A5568]">{t("emptyDescription")}</p>
          </div>
        ) : (
          <>
            {loadError && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {loadError}
              </p>
            )}

            <ul className="mt-6 grid gap-4 lg:grid-cols-2">
              {invitations.map((invitation) => {
                const actionState = actionStates[invitation.id]
                const teamName = invitation.team?.name || t("unknownTeam")
                const tournamentName = invitation.tournament?.name || t("unknownTournament")
                const parsedTimestamp = invitation.timestamp ? new Date(invitation.timestamp) : null
                const receivedDate = parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
                  ? parsedTimestamp.toLocaleDateString(localeTags[locale], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : t("recently")
                const pending = Boolean(actionState?.pendingAction)
                const cardHeadingId = `team-invitation-${invitation.id}`

                return (
                  <li
                    key={invitation.id}
                    className="rounded-xl border border-[#D7DCE5] bg-white p-5 shadow-sm"
                    aria-labelledby={cardHeadingId}
                    aria-busy={pending}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 id={cardHeadingId} className="truncate text-xl font-semibold text-[#0D1321]">
                          {tournamentName}
                        </h3>
                        <p className="mt-2 font-medium text-[#3E5C76]">{t("team", { team: teamName })}</p>
                        <p className="mt-1 text-sm text-[#4A5568]">
                          {t("invitedBy", { inviter: inviterLabel(invitation, t("unknownInviter")) })}
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {t("received", { date: receivedDate })}
                        </p>
                      </div>

                      {invitation.tournament?.id && (
                        <Link
                          href={`/tournament/${invitation.tournament.id}`}
                          className="shrink-0 text-sm font-medium text-[#3E5C76] underline underline-offset-2 hover:text-[#0D1321] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E5C76] focus-visible:ring-offset-2"
                        >
                          {t("viewTournament")}
                        </Link>
                      )}
                    </div>

                    {actionState?.error && (
                      <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                        {actionState.error}
                      </p>
                    )}

                    {!actionState?.stale && (
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          onClick={() => void handleInvitation(invitation, "accept")}
                          disabled={pending}
                          aria-label={t("acceptInvitation", { team: teamName })}
                          className="bg-[#3E5C76] text-white hover:bg-[#0D1321]"
                        >
                          {actionState?.pendingAction === "accept" ? (
                            <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
                          ) : (
                            <Check aria-hidden="true" />
                          )}
                          {actionState?.pendingAction === "accept" ? t("accepting") : t("accept")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleInvitation(invitation, "decline")}
                          disabled={pending}
                          aria-label={t("declineInvitation", { team: teamName })}
                          className="border-[#AAB4C3] bg-white text-[#0D1321] hover:bg-[#F1F5F9]"
                        >
                          {actionState?.pendingAction === "decline" ? (
                            <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
                          ) : (
                            <X aria-hidden="true" />
                          )}
                          {actionState?.pendingAction === "decline" ? t("declining") : t("decline")}
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
