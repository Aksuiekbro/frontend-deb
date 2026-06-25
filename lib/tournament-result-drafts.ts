export type ResultDraftValue = "won" | "lost" | ""

export type PersistedResultDraft = {
  score?: string
  result?: ResultDraftValue
}

export type PersistedResultDrafts = Record<string, PersistedResultDraft>

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
}
