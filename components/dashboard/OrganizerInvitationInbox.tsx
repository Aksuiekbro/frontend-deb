"use client"

import { Check, LoaderCircle, Mail, RefreshCw, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { useTranslations } from "@/lib/i18n"
import type { PageResult } from "@/types/page"
import type { OrganizerInvitationResponse } from "@/types/util/request/invitation"

const translations = {
  en: {
    heading: "Organizer invitations", description: "Review invitations to co-organize a tournament.", refresh: "Refresh organizer invitations", loading: "Loading organizer invitations…",
    loadFailed: "We couldn't load your organizer invitations.", actionFailed: "We couldn't update this invitation.", empty: "No organizer invitations",
    invitedBy: "Invited by {inviter}", unknownInviter: "Another organizer", unknownTournament: "Tournament unavailable", viewTournament: "View tournament",
    pending: "Pending", accepted: "Accepted", declined: "Declined", accept: "Accept", decline: "Decline",
    acceptInvitation: "Accept invitation to {tournament}", declineInvitation: "Decline invitation to {tournament}",
  },
  ru: {
    heading: "Приглашения организатора", description: "Просмотрите приглашения стать соорганизатором турнира.", refresh: "Обновить приглашения организатора", loading: "Загрузка приглашений…",
    loadFailed: "Не удалось загрузить приглашения организатора.", actionFailed: "Не удалось обновить приглашение.", empty: "Нет приглашений организатора",
    invitedBy: "Приглашение от {inviter}", unknownInviter: "Другой организатор", unknownTournament: "Турнир недоступен", viewTournament: "Открыть турнир",
    pending: "Ожидает", accepted: "Принято", declined: "Отклонено", accept: "Принять", decline: "Отклонить",
    acceptInvitation: "Принять приглашение в {tournament}", declineInvitation: "Отклонить приглашение в {tournament}",
  },
  kk: {
    heading: "Ұйымдастырушы шақырулары", description: "Турнирді бірге ұйымдастыру шақыруларын қараңыз.", refresh: "Ұйымдастырушы шақыруларын жаңарту", loading: "Шақырулар жүктелуде…",
    loadFailed: "Ұйымдастырушы шақыруларын жүктеу мүмкін болмады.", actionFailed: "Шақыруды жаңарту мүмкін болмады.", empty: "Ұйымдастырушы шақырулары жоқ",
    invitedBy: "Шақырған: {inviter}", unknownInviter: "Басқа ұйымдастырушы", unknownTournament: "Турнир қолжетімсіз", viewTournament: "Турнирді ашу",
    pending: "Күтуде", accepted: "Қабылданды", declined: "Қабылданбады", accept: "Қабылдау", decline: "Қабылдамау",
    acceptInvitation: "{tournament} турниріне шақыруды қабылдау", declineInvitation: "{tournament} турниріне шақыруды қабылдамау",
  },
} as const

type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED"
type InvitationAction = "accept" | "decline"
type OrganizerInvitationRecord = Omit<OrganizerInvitationResponse, "accepted"> & {
  accepted: boolean | null
  status?: InvitationStatus
}

const INBOX_PAGE_SIZE = 50

function invitationStatus(invitation: OrganizerInvitationRecord): InvitationStatus {
  if (invitation.status) return invitation.status
  if (invitation.accepted === true) return "ACCEPTED"
  if (invitation.accepted === null) return "DECLINED"
  return "PENDING"
}

function inviterLabel(invitation: OrganizerInvitationRecord, fallback: string) {
  const inviter = invitation.inviter
  if (!inviter) return fallback
  const fullName = [inviter.firstName, inviter.lastName].filter(Boolean).join(" ").trim()
  return fullName || (inviter.username ? `@${inviter.username}` : fallback)
}

export function OrganizerInvitationInbox() {
  const t = useTranslations(translations)
  const [invitations, setInvitations] = useState<OrganizerInvitationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ id: number; action: InvitationAction } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadInvitations = useCallback(async (initial = false) => {
    if (initial) setIsLoading(true)
    else setIsRefreshing(true)
    setError(null)

    try {
      const invitationsById = new Map<number, OrganizerInvitationRecord>()
      let pageNumber = 0
      let totalPages = 1

      while (pageNumber < totalPages) {
        const response = await api.getReceivedOrganizerInvitations({
          page: pageNumber,
          size: INBOX_PAGE_SIZE,
          sort: "timestamp,desc",
        })
        if (!response.ok) throw new Error(await readResponseError(response, { fallback: t("loadFailed") }))

        const page = await response.json() as PageResult<OrganizerInvitationRecord>
        page.content?.forEach((invitation) => invitationsById.set(invitation.id, invitation))
        totalPages = Number.isInteger(page.totalPages) && page.totalPages > 0 ? page.totalPages : 1
        pageNumber += 1
      }

      setInvitations(Array.from(invitationsById.values()))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadFailed"))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    void loadInvitations(true)
  }, [loadInvitations])

  const handleInvitation = async (invitation: OrganizerInvitationRecord, action: InvitationAction) => {
    setPendingAction({ id: invitation.id, action })
    setError(null)
    try {
      const response = action === "accept"
        ? await api.acceptOrganizerInvitation(invitation.id)
        : await api.rejectOrganizerInvitation(invitation.id)
      if (!response.ok) throw new Error(await readResponseError(response, { fallback: t("actionFailed") }))
      await loadInvitations()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("actionFailed"))
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section className="px-8 py-8" aria-labelledby="organizer-invitations-heading">
      <div className="rounded-2xl border border-[#D7DCE5] bg-[#F8FAFC] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4EAF1] text-[#3E5C76]" aria-hidden="true"><Mail className="h-5 w-5" /></span>
              <h2 id="organizer-invitations-heading" className="text-2xl font-semibold text-[#0D1321] sm:text-3xl">{t("heading")}</h2>
            </div>
            <p className="mt-2 text-sm text-[#4A5568] sm:ml-[52px]">{t("description")}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadInvitations()} disabled={isLoading || isRefreshing} aria-label={t("refresh")}>
            <RefreshCw className={isRefreshing ? "motion-safe:animate-spin" : ""} aria-hidden="true" />{t("refresh")}
          </Button>
        </div>

        {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}

        {isLoading ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#D7DCE5] bg-white p-5 text-[#4A5568]" role="status">
            <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />{t("loading")}
          </div>
        ) : invitations.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[#AAB4C3] bg-white p-6 text-center text-[#4A5568]">{t("empty")}</p>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {invitations.map((invitation) => {
              const status = invitationStatus(invitation)
              const tournamentName = invitation.tournament?.name || t("unknownTournament")
              const busy = pendingAction?.id === invitation.id
              return (
                <li key={invitation.id} className="rounded-xl border border-[#D7DCE5] bg-white p-5 shadow-sm" aria-busy={busy}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold text-[#0D1321]">{tournamentName}</h3>
                      <p className="mt-2 text-sm text-[#4A5568]">{t("invitedBy", { inviter: inviterLabel(invitation, t("unknownInviter")) })}</p>
                    </div>
                    {invitation.tournament?.id && (
                      <Link href={`/tournament/${invitation.tournament.id}`} className="shrink-0 text-sm font-medium text-[#3E5C76] underline underline-offset-2">{t("viewTournament")}</Link>
                    )}
                  </div>

                  <span className="mt-4 inline-flex rounded-full bg-[#E4EAF1] px-3 py-1 text-sm font-medium text-[#3E5C76]">{t(status.toLowerCase())}</span>

                  {status === "PENDING" && (
                    <div className="mt-5 flex gap-3">
                      <Button
                        type="button"
                        onClick={() => void handleInvitation(invitation, "accept")}
                        disabled={busy}
                        aria-label={t("acceptInvitation", { tournament: tournamentName })}
                        className="bg-[#3E5C76] text-white hover:bg-[#0D1321]"
                      >
                        {busy && pendingAction.action === "accept" ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}{t("accept")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleInvitation(invitation, "decline")}
                        disabled={busy}
                        aria-label={t("declineInvitation", { tournament: tournamentName })}
                      >
                        {busy && pendingAction.action === "decline" ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : <X aria-hidden="true" />}{t("decline")}
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
