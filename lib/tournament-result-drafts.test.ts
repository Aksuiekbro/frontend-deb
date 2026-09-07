/** @jest-environment jsdom */
import {
  clearTournamentResultDrafts,
  createResultDraftStorageKey,
  getResultInputDraftStorageKey,
  readPersistedResultDrafts,
  readResultInputDrafts,
  writePersistedResultDrafts,
  writeResultInputDrafts,
} from "./tournament-result-drafts"

afterEach(() => window.localStorage.clear())

it("keeps the same editor's input and submitted drafts while isolating another account", () => {
  const first = createResultDraftStorageKey(7, 53, 101, 201)
  const second = createResultDraftStorageKey(8, 53, 101, 201)
  writePersistedResultDrafts(first, { "301:team1": { result: "won" } })
  writeResultInputDrafts(first, { "301:team1": { score: "75" } })

  expect(readPersistedResultDrafts(createResultDraftStorageKey(7, 53, 101, 201))).toEqual({ "301:team1": { result: "won" } })
  expect(readResultInputDrafts(first)).toEqual({ "301:team1": { score: "75" } })
  expect(readPersistedResultDrafts(second)).toEqual({})
  expect(readResultInputDrafts(second)).toEqual({})
  expect(createResultDraftStorageKey(7, 53, null, 201)).toBeUndefined()
})

it("removes only recognized result-draft keys including legacy unscoped drafts", () => {
  const first = createResultDraftStorageKey(7, 53, 101, 201)!
  const second = createResultDraftStorageKey(8, 53, 101, 201)!
  const legacy = "tournament:53:round-group:101:round:201:match-results"
  const draftKeys = [first, second, legacy, getResultInputDraftStorageKey(first)!, getResultInputDraftStorageKey(legacy)!]
  draftKeys.forEach((key) => window.localStorage.setItem(key, "private"))
  window.localStorage.setItem("debetter-locale", "kk")
  window.localStorage.setItem("unrelated-data", "keep")
  window.localStorage.setItem(`${legacy}:unrelated`, "keep")

  clearTournamentResultDrafts()

  draftKeys.forEach((key) => expect(window.localStorage.getItem(key)).toBeNull())
  expect(window.localStorage.getItem("debetter-locale")).toBe("kk")
  expect(window.localStorage.getItem("unrelated-data")).toBe("keep")
  expect(window.localStorage.getItem(`${legacy}:unrelated`)).toBe("keep")
})
