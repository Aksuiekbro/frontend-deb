"use client"

import { LoaderCircle, Search } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"
import { resolveMediaUrl } from "@/lib/media"
import type { PageResult } from "@/types/page"
import type { SimpleTournamentParticipantResponse } from "@/types/tournament/tournament-participant"
import { Role, type SimpleUserResponse, type UserResponse } from "@/types/user/user"
import type { OrganizerInvitationResponse } from "@/types/util/request/invitation"

const catalog: TranslationCatalog = {
  en: {
    invite: "Invite", copy: "Copy link", access: "Who Has Access", participant: "Participant", empty: "No tournament members yet", close: "Close invite",
    organizerHeading: "Invite a co-organizer", organizerDescription: "Search organizer accounts by username.", organizersLoadFailed: "We couldn't load the tournament's organizers.", searchLabel: "Search organizers", searchPlaceholder: "Organizer username",
    search: "Search", searching: "Searching…", noResults: "No eligible organizers found.", inviteUser: "Invite @{username}", inviting: "Inviting…",
    sentHeading: "Organizer invitations", noSent: "No organizer invitations for this tournament.", loading: "Loading invitations…", pending: "Pending", accepted: "Accepted", declined: "Declined",
    loadFailed: "We couldn't load organizer invitations.", retryLoad: "Try again", searchFailed: "We couldn't search organizers.", sendFailed: "We couldn't send this invitation.",
  },
  ru: {
    invite: "Пригласить", copy: "Скопировать ссылку", access: "У кого есть доступ", participant: "Участник", empty: "У турнира пока нет участников", close: "Закрыть приглашение",
    organizerHeading: "Пригласить соорганизатора", organizerDescription: "Найдите аккаунт организатора по имени пользователя.", organizersLoadFailed: "Не удалось загрузить организаторов турнира.", searchLabel: "Поиск организаторов", searchPlaceholder: "Имя пользователя организатора",
    search: "Найти", searching: "Поиск…", noResults: "Подходящие организаторы не найдены.", inviteUser: "Пригласить @{username}", inviting: "Отправка…",
    sentHeading: "Приглашения организаторам", noSent: "Для этого турнира приглашений нет.", loading: "Загрузка приглашений…", pending: "Ожидает", accepted: "Принято", declined: "Отклонено",
    loadFailed: "Не удалось загрузить приглашения организаторам.", retryLoad: "Попробовать снова", searchFailed: "Не удалось найти организаторов.", sendFailed: "Не удалось отправить приглашение.",
  },
  kk: {
    invite: "Шақыру", copy: "Сілтемені көшіру", access: "Кімнің қолы жетімді", participant: "Қатысушы", empty: "Турнирде әзірге мүше жоқ", close: "Шақыруды жабу",
    organizerHeading: "Бірлескен ұйымдастырушыны шақыру", organizerDescription: "Ұйымдастырушы аккаунтын пайдаланушы атымен іздеңіз.", organizersLoadFailed: "Турнир ұйымдастырушыларын жүктеу мүмкін болмады.", searchLabel: "Ұйымдастырушыларды іздеу", searchPlaceholder: "Ұйымдастырушының пайдаланушы аты",
    search: "Іздеу", searching: "Ізделуде…", noResults: "Сәйкес ұйымдастырушылар табылмады.", inviteUser: "@{username} шақыру", inviting: "Шақырылуда…",
    sentHeading: "Ұйымдастырушы шақырулары", noSent: "Бұл турнирге ұйымдастырушы шақырулары жоқ.", loading: "Шақырулар жүктелуде…", pending: "Күтуде", accepted: "Қабылданды", declined: "Қабылданбады",
    loadFailed: "Ұйымдастырушы шақыруларын жүктеу мүмкін болмады.", retryLoad: "Қайталап көру", searchFailed: "Ұйымдастырушыларды іздеу мүмкін болмады.", sendFailed: "Шақыруды жіберу мүмкін болмады.",
  },
}

type InviteModalTab = "invite" | "copy-link"
type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED"
type OrganizerInvitationRecord = Omit<OrganizerInvitationResponse, "accepted"> & {
  accepted: boolean | null
  status?: InvitationStatus
}

interface InviteModalProps {
  isOpen: boolean
  members: SimpleTournamentParticipantResponse[]
  activeTab: InviteModalTab
  onTabChange: (tab: InviteModalTab) => void
  onClose: () => void
  tournamentId?: number
  currentUserId?: number
  existingOrganizers?: SimpleUserResponse[]
  existingOrganizersLoading?: boolean
  existingOrganizersError?: unknown
  onRetryExistingOrganizers?: () => void
  canInviteOrganizers?: boolean
}

const INVITATION_PAGE_SIZE = 50

function invitationStatus(invitation: OrganizerInvitationRecord): InvitationStatus {
  if (invitation.status) return invitation.status
  if (invitation.accepted === true) return "ACCEPTED"
  if (invitation.accepted === null) return "DECLINED"
  return "PENDING"
}

function userLabel(user: SimpleUserResponse) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username
}

export function InviteModal({
  isOpen,
  members,
  activeTab,
  onTabChange,
  onClose,
  tournamentId,
  currentUserId,
  existingOrganizers = [],
  existingOrganizersLoading = false,
  existingOrganizersError,
  onRetryExistingOrganizers,
  canInviteOrganizers = false,
}: InviteModalProps) {
  const t = useTranslations(catalog)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserResponse[]>([])
  const [invitations, setInvitations] = useState<OrganizerInvitationRecord[]>([])
  const [invitationsScope, setInvitationsScope] = useState<string | null>(null)
  const invitationsRef = useRef<OrganizerInvitationRecord[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)
  const [invitationsLoaded, setInvitationsLoaded] = useState(false)
  const [invitationLoadError, setInvitationLoadError] = useState<string | null>(null)
  const [invitingUsername, setInvitingUsername] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const invitationRequestSequenceRef = useRef(0)
  const searchRequestSequenceRef = useRef(0)
  const sendRequestSequenceRef = useRef(0)

  const invitationScope = isOpen && canInviteOrganizers && tournamentId
    ? `${currentUserId ?? "anonymous"}:${tournamentId}`
    : null
  const invitationScopeRef = useRef(invitationScope)
  const scopedInvitations = invitationsScope === invitationScope ? invitations : []

  const existingOrganizerIds = useMemo(
    () => new Set(existingOrganizers.map(({ id }) => id)),
    [existingOrganizers],
  )

  const loadInvitations = useCallback(async (reset = false) => {
    if (!invitationScope || !tournamentId) return []

    const requestSequence = ++invitationRequestSequenceRef.current
    const requestScope = invitationScope
    const isCurrentRequest = () => (
      mountedRef.current
      && invitationRequestSequenceRef.current === requestSequence
      && invitationScopeRef.current === requestScope
    )

    if (reset) {
      invitationsRef.current = []
      setInvitations([])
      setInvitationsScope(null)
      setInvitationsLoaded(false)
    }
    setInvitationLoadError(null)
    setIsLoadingInvitations(true)
    try {
      const invitationsById = new Map<number, OrganizerInvitationRecord>()
      let pageNumber = 0
      let totalPages = 1

      while (pageNumber < totalPages) {
        const response = await api.getSentOrganizerInvitations({
          page: pageNumber,
          size: INVITATION_PAGE_SIZE,
          sort: "timestamp,desc",
        })
        if (!response.ok) {
          throw new Error(await readResponseError(response, { fallback: t("loadFailed") }))
        }

        const page = await response.json() as PageResult<OrganizerInvitationRecord>
        if (!isCurrentRequest()) return []
        page.content?.forEach((invitation) => {
          if (invitation.tournament?.id === tournamentId) invitationsById.set(invitation.id, invitation)
        })
        const reportedTotalPages = Number.isInteger(page.totalPages) && page.totalPages > 0 ? page.totalPages : 1
        totalPages = Math.max(totalPages, reportedTotalPages)
        pageNumber += 1
      }

      if (!isCurrentRequest()) return []
      const loaded = Array.from(invitationsById.values())
      invitationsRef.current = loaded
      setInvitations(loaded)
      setInvitationsScope(requestScope)
      setInvitationsLoaded(true)
      return loaded
    } catch (loadError) {
      if (isCurrentRequest()) {
        setInvitationLoadError(loadError instanceof Error ? loadError.message : t("loadFailed"))
      }
      return []
    } finally {
      if (isCurrentRequest()) setIsLoadingInvitations(false)
    }
  }, [invitationScope, t, tournamentId])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      invitationRequestSequenceRef.current += 1
      searchRequestSequenceRef.current += 1
      sendRequestSequenceRef.current += 1
    }
  }, [])

  useEffect(() => {
    invitationScopeRef.current = invitationScope
    invitationRequestSequenceRef.current += 1
    searchRequestSequenceRef.current += 1
    sendRequestSequenceRef.current += 1
    invitationsRef.current = []
    setInvitations([])
    setInvitationsScope(null)
    setInvitationsLoaded(false)
    setInvitationLoadError(null)
    setIsLoadingInvitations(false)
    setQuery("")
    setResults([])
    setHasSearched(false)
    setIsSearching(false)
    setInvitingUsername(null)
    setError(null)
    if (invitationScope) void loadInvitations(true)
  }, [invitationScope, loadInvitations])

  const exclusionDataReady = invitationScope !== null
    && invitationsScope === invitationScope
    && !existingOrganizersLoading
    && !existingOrganizersError
    && invitationsLoaded

  useEffect(() => {
    if (exclusionDataReady) return
    searchRequestSequenceRef.current += 1
    setIsSearching(false)
    setResults([])
    setHasSearched(false)
  }, [exclusionDataReady])

  const searchOrganizers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery || !exclusionDataReady || !invitationScope) return

    const requestSequence = ++searchRequestSequenceRef.current
    const requestScope = invitationScope
    const isCurrentRequest = () => (
      mountedRef.current
      && searchRequestSequenceRef.current === requestSequence
      && invitationScopeRef.current === requestScope
    )

    setIsSearching(true)
    setHasSearched(true)
    setError(null)
    try {
      const response = await api.getUsers(
        { searchUsername: trimmedQuery, role: Role.ORGANIZER },
        { page: 0, size: 20 },
      )
      if (!response.ok) {
        throw new Error(await readResponseError(response, { fallback: t("searchFailed") }))
      }

      const page = await response.json() as PageResult<UserResponse>
      if (!isCurrentRequest()) return
      const pendingInviteeIds = new Set(
        invitationsRef.current
          .filter((invitation) => invitationStatus(invitation) === "PENDING")
          .map((invitation) => invitation.invitee.id),
      )
      setResults((page.content ?? []).filter((user) => (
        user.role === Role.ORGANIZER
        && user.id !== currentUserId
        && !existingOrganizerIds.has(user.id)
        && !pendingInviteeIds.has(user.id)
      )))
    } catch (searchError) {
      if (isCurrentRequest()) {
        setResults([])
        setError(searchError instanceof Error ? searchError.message : t("searchFailed"))
      }
    } finally {
      if (isCurrentRequest()) setIsSearching(false)
    }
  }

  const sendInvitation = async (user: UserResponse) => {
    if (!tournamentId || !invitationScope || !exclusionDataReady) return

    const requestSequence = ++sendRequestSequenceRef.current
    const requestScope = invitationScope
    const requestTournamentId = tournamentId
    const isCurrentRequest = () => (
      mountedRef.current
      && sendRequestSequenceRef.current === requestSequence
      && invitationScopeRef.current === requestScope
    )

    setInvitingUsername(user.username)
    setError(null)
    try {
      const response = await api.createOrganizerInvitation({
        inviteeUsername: user.username,
        tournamentId: requestTournamentId,
      })
      if (!response.ok) {
        throw new Error(await readResponseError(response, { fallback: t("sendFailed") }))
      }

      const created = await response.json() as OrganizerInvitationRecord
      if (!isCurrentRequest()) return
      if (created?.id) {
        setInvitations((current) => {
          const next = [created, ...current.filter(({ id }) => id !== created.id)]
          invitationsRef.current = next
          return next
        })
      }
      setResults((current) => current.filter(({ id }) => id !== user.id))
      await loadInvitations()
    } catch (sendError) {
      if (isCurrentRequest()) {
        setError(sendError instanceof Error ? sendError.message : t("sendFailed"))
      }
    } finally {
      if (isCurrentRequest()) setInvitingUsername(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[24px] font-bold text-[#0D1321]">{t("invite")}</h2>
          <button type="button" onClick={onClose} aria-label={t("close")} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="mb-6 flex">
          {(["invite", "copy-link"] as InviteModalTab[]).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 border-b-2 py-2 text-center font-medium transition-colors ${activeTab === tab ? "border-[#0D1321] text-[#0D1321]" : "border-gray-300 text-[#9a8c98] hover:text-[#4a4e69]"}`}
            >
              {tab === "invite" ? t("invite") : t("copy")}
            </button>
          ))}
        </div>

        {activeTab === "invite" && canInviteOrganizers && tournamentId && (
          <section aria-labelledby="organizer-invite-heading" className="mb-7 rounded-xl border border-[#D7DCE5] bg-[#F8FAFC] p-5">
            <h3 id="organizer-invite-heading" className="text-lg font-semibold text-[#0D1321]">{t("organizerHeading")}</h3>
            <p className="mt-1 text-sm text-[#4A5568]">{t("organizerDescription")}</p>

            {Boolean(existingOrganizersError) ? (
              <div role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-800">
                <p>{existingOrganizersError instanceof Error ? existingOrganizersError.message : t("organizersLoadFailed")}</p>
                {onRetryExistingOrganizers && (
                  <button
                    type="button"
                    onClick={onRetryExistingOrganizers}
                    disabled={existingOrganizersLoading}
                    className="mt-3 rounded-lg bg-[#3E5C76] px-3 py-2 font-medium text-white hover:bg-[#0D1321] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("retryLoad")}
                  </button>
                )}
              </div>
            ) : null}

            <form onSubmit={searchOrganizers} className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="organizer-search">{t("searchLabel")}</label>
              <input
                id="organizer-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-[#AAB4C3] bg-white px-3 py-2 text-[#0D1321] outline-none focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20"
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim() || !exclusionDataReady}
                className="inline-flex items-center gap-2 rounded-lg bg-[#3E5C76] px-4 py-2 font-medium text-white hover:bg-[#0D1321] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching ? <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                {isSearching ? t("searching") : t("search")}
              </button>
            </form>

            {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            {invitationLoadError && (
              <div role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-800">
                <p>{invitationLoadError}</p>
                <button
                  type="button"
                  onClick={() => void loadInvitations(true)}
                  disabled={isLoadingInvitations}
                  className="mt-3 rounded-lg bg-[#3E5C76] px-3 py-2 font-medium text-white hover:bg-[#0D1321] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("retryLoad")}
                </button>
              </div>
            )}

            {results.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {results.map((user) => (
                  <li key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#D7DCE5] bg-white p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#0D1321]">{userLabel(user)}</p>
                      <p className="truncate text-sm text-[#4A5568]">@{user.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void sendInvitation(user)}
                      disabled={invitingUsername !== null || !exclusionDataReady}
                      aria-label={t("inviteUser", { username: user.username })}
                      className="rounded-lg bg-[#3E5C76] px-3 py-2 text-sm font-medium text-white hover:bg-[#0D1321] disabled:opacity-60"
                    >
                      {invitingUsername === user.username ? t("inviting") : t("invite")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : hasSearched && !isSearching ? (
              <p className="mt-4 text-sm text-[#4A5568]">{t("noResults")}</p>
            ) : null}

            <h4 className="mt-6 font-semibold text-[#0D1321]">{t("sentHeading")}</h4>
            {isLoadingInvitations && scopedInvitations.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-[#4A5568]" role="status">
                <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />{t("loading")}
              </p>
            ) : invitationLoadError && !invitationsLoaded ? null : scopedInvitations.length === 0 ? (
              <p className="mt-2 text-sm text-[#4A5568]">{t("noSent")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {scopedInvitations.map((invitation) => {
                  const status = invitationStatus(invitation)
                  return (
                    <li key={invitation.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                      <span className="truncate text-sm text-[#0D1321]">@{invitation.invitee.username}</span>
                      <span className="rounded-full bg-[#E4EAF1] px-2.5 py-1 text-xs font-medium text-[#3E5C76]">{t(status.toLowerCase())}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        <section aria-labelledby="tournament-access-heading">
          <h3 id="tournament-access-heading" className="mb-4 text-[16px] font-medium text-[#0D1321]">{t("access")}</h3>
          <div className="space-y-3">
            {members.length > 0 ? members.map((participant) => {
              const name = `${participant.user.firstName ?? ""} ${participant.user.lastName ?? ""}`.trim() || participant.user.username
              const avatar = resolveMediaUrl(participant.user.imageUrl?.url)
              return (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {avatar ? (
                      <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300"><span className="text-sm font-medium text-white">{name.charAt(0)}</span></div>
                    )}
                    <span className="text-[16px] text-[#4a4e69]">{name}</span>
                  </div>
                  <span className="text-[14px] text-[#9a8c98]">{t("participant")}</span>
                </div>
              )
            }) : (
              <div className="py-4 text-center text-[14px] text-[#9a8c98]">{t("empty")}</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
