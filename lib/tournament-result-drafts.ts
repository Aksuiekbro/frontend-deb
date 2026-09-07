export type ResultDraftValue = "won" | "lost" | ""

export type PersistedResultDraft = {
  score?: string
  result?: ResultDraftValue
}

export type PersistedResultDrafts = Record<string, PersistedResultDraft>

export const RESULT_DRAFTS_CHANGED_EVENT = "tournament-result-drafts-changed"

export const createResultDraftStorageKey = (
  principalId: number,
  tournamentId: number,
  roundGroupId: number | null | undefined,
  roundId: number | null | undefined,
): string | undefined => {
  if (![principalId, tournamentId, roundGroupId, roundId].every((id) => typeof id === "number" && Number.isSafeInteger(id) && id > 0)) {
    return undefined
  }
  return `tournament:${tournamentId}:round-group:${roundGroupId}:round:${roundId}:match-results:principal:${principalId}`
}

const RESULT_DRAFT_STORAGE_KEY = /^tournament:\d+:round-group:\d+:round:\d+:match-results(?::principal:\d+)?(?::input-drafts)?$/

export const clearTournamentResultDrafts = () => {
  if (typeof window === "undefined") return
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    keys.forEach((key) => {
      if (key && RESULT_DRAFT_STORAGE_KEY.test(key)) {
        window.localStorage.removeItem(key)
        notifyResultDraftsChanged(key)
      }
    })
  } catch {
    // Storage can be unavailable in private browsing; logout must still finish.
  }
}

const notifyResultDraftsChanged = (storageKey: string | undefined) => {
  if (!storageKey || typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(RESULT_DRAFTS_CHANGED_EVENT, { detail: { storageKey } }))
}

export const toResultDraftValue = (value: unknown): ResultDraftValue => {
  return value === "won" || value === "lost" ? value : ""
}

export const readPersistedResultDrafts = (storageKey?: string): PersistedResultDrafts => {
  if (!storageKey || typeof window === "undefined") return {}

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return parsed as PersistedResultDrafts
  } catch {
    return {}
  }
}

export const writePersistedResultDrafts = (storageKey: string | undefined, drafts: PersistedResultDrafts) => {
  if (!storageKey || typeof window === "undefined") return
  window.localStorage.setItem(storageKey, JSON.stringify(drafts))
  notifyResultDraftsChanged(storageKey)
}

export const getResultInputDraftStorageKey = (storageKey: string | undefined) => {
  return storageKey ? `${storageKey}:input-drafts` : undefined
}

export const readResultInputDrafts = (storageKey?: string): PersistedResultDrafts => {
  return readPersistedResultDrafts(getResultInputDraftStorageKey(storageKey))
}

export const writeResultInputDrafts = (storageKey: string | undefined, drafts: PersistedResultDrafts) => {
  writePersistedResultDrafts(getResultInputDraftStorageKey(storageKey), drafts)
}

export const clearResultInputDrafts = (storageKey: string | undefined) => {
  const inputDraftStorageKey = getResultInputDraftStorageKey(storageKey)
  if (!inputDraftStorageKey || typeof window === "undefined") return
  window.localStorage.removeItem(inputDraftStorageKey)
  notifyResultDraftsChanged(inputDraftStorageKey)
}
