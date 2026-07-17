import { expect, test } from "@playwright/test"
import type { Browser, BrowserContext } from "@playwright/test"

import {
  FIXTURE_IDS,
  assertRuntimeEvidenceIsClean,
  buildContradictoryResult,
  buildValidExpectedPoints,
  buildValidResult,
  buildRuntimeEvidencePersistenceRecords,
  captureCheckpoint,
  collectRawMatchEvidence,
  collectTeamStandings,
  collectTournamentInventory,
  computeRelevantSourceHash,
  contextCloseCancellationSelfCheckReport,
  createRunEvidence,
  databaseDelta,
  expectedNextLinkPrefetchAbortClassifierSelfCheckReport,
  finalizeRunEvidence,
  findRound,
  findStage,
  finishRuntimeClose,
  fillRepairableMatch,
  fillValidMatch,
  hashValue,
  isExpectedNextLinkPrefetchAbort,
  openAnonymousSession,
  openDebaterSession,
  openOrganizerSession,
  proceedDirect,
  readDatabaseState,
  readPersistedContextCloseCancellationRecords,
  readMutationResponse,
  readReadyReport,
  reconcileContextCloseCancellations,
  reconcileVoidMutationTerminal,
  reconcileRuntimeEvidence,
  beginRuntimeClosing,
  readRuntimeEvidencePersistenceFiles,
  RESPONSE_TIMEOUT_MS,
  resetFixture,
  resolveFixtures,
  sanitizeRuntimeEvidenceForPersistence,
  selectPairingRound,
  selectResultsRound,
  registerVoidMutationOwnership,
  setRuntimeExpectedTournamentPath,
  stageRoundSummary,
  submitResultsDirect,
  visibleMatchRowText,
  visibleMatchScores,
  runtimeEvidencePersistenceSelfCheckReport,
  validateRuntimeEvidencePersistence,
  validateContextCloseCancellationBijection,
  validateVoidMutationBijection,
  writeRuntimeEvidencePersistence,
  writeRunRecord,
  type IntegrityConfig,
  type IntegrityFixture,
  type IntegrityInventory,
  type IntegrityMatch,
  type IntegrityRound,
  type IntegrityStage,
  type IntegritySession,
  type ReadyReport,
  type RunEvidence,
  type SessionNavigationEvidence,
  type RuntimeEvidence,
  type RuntimeEvidencePersistenceFiles,
  type RuntimeEvidencePersistenceRecords,
  type PersistedContextCloseCancellationRecord,
  type ExpectedVoidMutationAbort,
  type PersistedVoidMutationRecord,
  type VoidMutationTerminalReconciliation,
  loadIntegrityConfig,
} from "./support/tournament-integrity"
import { DebateFormat } from "@/types/tournament/tournament"
import type { MatchResultRequest } from "@/types/tournament/match"

const config: IntegrityConfig = loadIntegrityConfig()
const REQUIRED_CASE_IDS = [
  "apf-preliminary-9101",
  "bpf-preliminary-9102",
  "apf-knockout-9101",
  "bpf-knockout-9102",
  "ld-generated-rounds-9103",
  "ld-generated-rounds-9105",
  "legacy-repair-9105",
  "partial-row-nonrepairable-9105",
  "progression-gating-9101",
  "invalid-ballots-9101",
  "invalid-tie-ballot-9103",
  "privacy-and-authorization-9102",
  "mixed-and-no-ld-contract",
] as const

type PrivacyValueType = "undefined" | "null" | "boolean" | "number" | "string" | "array" | "object" | "function" | "symbol" | "bigint"
type PrivacyProperty = { path: string; type: PrivacyValueType }
type PrivacyForbiddenProperty = PrivacyProperty & { category: string }
type PrivacyStructuralAudit = {
  sanitizedPropertyPaths: PrivacyProperty[]
  forbiddenNonNullPaths: PrivacyForbiddenProperty[]
  allowedMetadataFlags: PrivacyProperty[]
}
type PrivacyPathSegment = string | number

const privacyValueType = (value: unknown): PrivacyValueType => {
  if (value === undefined) return "undefined"
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}

const sanitizedPrivacyKey = (key: string) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : "[redacted-key]"
const privacyPath = (segments: readonly PrivacyPathSegment[]): string => segments.reduce<string>((path, segment) => {
  if (typeof segment === "number") return `${path}[${segment}]`
  return `${path}.${sanitizedPrivacyKey(segment)}`
}, "$")
const publicEntitySegment = /^(?:match|matches|round|rounds|pairing|pairings|team|teams|team\d+|debater|debaters|debater\d+|judge|judges)$/i
const privatePathSegment = /^(?:account|accounts|participant|participants|profile|profiles|profiledata|participantprofile|participantprofiles|speaker|speakers|user|users)$/i
const publicIdKey = /^(?:match|round|roundgroup|pairing|team|debater|judge)(?:\d+)?ids?$/i
const publicDisplayKey = /^(?:match|round|pairing|team|debater|judge)(?:\d+)?(?:name|displayname|fullname)$/i
const displayKey = /^(?:name|displayname|fullname)$/i
const idKey = /(?:^id$|id$|ids$)/i
const resultIdKey = /^(?:winnerteamid|winningteamids)$/i
const metadataKey = /^(?:completed|participantScoresComplete|participantScoresRepairable)$/i
const scoreCollectionKey = /^(?:participant|speaker)scores?$|^(?:participant|speaker)score(?:rows|entries)$|^(?:scores|scorerows|scoreentries)$/i
const privateKey = /(?:password|passcode|token|secret|authorization|cookie|email|phone|mobile|address|contact|social|role|username|checkedin)/i
const judgePrivateKey = /^(?:phone|phonenumber|email|social|socialhandle|socialmedia|checkedin|checkedinat)$/i
const participantProfileObjectKey = /^(?:participant|participants|speaker|speakers|profile|profiles|profiledata|participantprofile|participantprofiles|user|users|account|accounts)$/i
const approvedUserParentSegment = /^(?:debater|debaters|debater\d+|participant|participants|participant\d+)$/i
const userContainerKey = /^users?$/i
const publicUserNameKey = /^(?:firstName|lastName|name|displayName|fullName)$/i
const publicMediaContainerKey = /^(?:imageUrl|image|media|mediaUrl|avatar|avatarUrl|profileImage|profileImageUrl)$/i
const publicMediaFieldKey = /^(?:id|url|src|href|path|alt|width|height|mimeType|contentType|type)$/i

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value)

const isApprovedParticipantUserShell = (value: unknown) => {
  const entries = Array.isArray(value) ? value : [value]
  return entries.length > 0 && entries.every((entry) => isRecord(entry) && Object.keys(entry).length > 0 && Object.keys(entry).every((key) => userContainerKey.test(key)))
}

const isApprovedUserParent = (segments: PrivacyPathSegment[]) => {
  const stringSegments = segments.filter((segment): segment is string => typeof segment === "string")
  return stringSegments.length > 0 && approvedUserParentSegment.test(stringSegments[stringSegments.length - 1])
}

const approvedUserIndex = (segments: PrivacyPathSegment[]) => {
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index]
    if (typeof segment === "string" && userContainerKey.test(segment)) {
      return isApprovedUserParent(segments.slice(0, index)) ? index : -1
    }
  }
  return -1
}

const auditPrivacyStructure = (value: unknown): PrivacyStructuralAudit => {
  const sanitizedPropertyPaths: PrivacyProperty[] = []
  const forbiddenNonNullPaths: PrivacyForbiddenProperty[] = []
  const allowedMetadataFlags: PrivacyProperty[] = []

  const visit = (candidate: unknown, segments: PrivacyPathSegment[], key?: string) => {
    const type = privacyValueType(candidate)
    const path = privacyPath(segments)
    sanitizedPropertyPaths.push({ path, type })
    const parentSegments = key ? segments.slice(0, -1) : segments
    const stringSegments = parentSegments.filter((segment): segment is string => typeof segment === "string")
    const privateContext = stringSegments.some((segment) => privatePathSegment.test(segment))
    const publicEntityContext = stringSegments.length === 0 || publicEntitySegment.test(stringSegments[stringSegments.length - 1])
    const approvedUserContainer = Boolean(key && userContainerKey.test(key) && isApprovedUserParent(parentSegments))
    const userIndex = approvedUserIndex(parentSegments)
    const approvedUserContext = userIndex >= 0
    const afterUserSegments = userIndex >= 0 ? parentSegments.slice(userIndex + 1).filter((segment): segment is string => typeof segment === "string") : []
    const mediaContext = approvedUserContext && afterUserSegments.length === 1 && publicMediaContainerKey.test(afterUserSegments[0])
    const approvedUserName = Boolean(key && approvedUserContext && publicUserNameKey.test(key))
    const approvedMediaContainer = Boolean(key && approvedUserContext && publicMediaContainerKey.test(key))
    const approvedMediaField = Boolean(key && mediaContext && publicMediaFieldKey.test(key))
    const approvedPublicUserField = approvedUserName || approvedMediaContainer || approvedMediaField
    const publicId = Boolean(key && !privateContext && ((key === "id" && publicEntityContext) || (publicIdKey.test(key) && publicEntityContext))) || Boolean(key && approvedMediaField && key === "id")
    const publicDisplay = Boolean(key && !privateContext && ((displayKey.test(key) && publicEntityContext) || (publicDisplayKey.test(key) && publicEntityContext))) || approvedUserName
    if (key && metadataKey.test(key)) {
      if (approvedUserContext && !approvedPublicUserField) {
        forbiddenNonNullPaths.push({ path, type, category: "unapproved-public-user-field" })
      } else if (candidate === null || candidate === undefined || typeof candidate === "boolean") {
        allowedMetadataFlags.push({ path, type })
      } else {
        forbiddenNonNullPaths.push({ path, type, category: "metadata-flag-must-be-boolean-or-nullish" })
      }
    } else if (key && candidate !== null && candidate !== undefined) {
      const lowerKey = key.toLowerCase()
      const categories: string[] = []
      if (participantProfileObjectKey.test(key) && !approvedUserContainer && !((/^participants?$/i.test(key)) && isApprovedParticipantUserShell(candidate))) categories.push("participant-profile-object")
      if (userContainerKey.test(key) && (!approvedUserContainer || (candidate !== null && typeof candidate !== "object"))) categories.push("unapproved-user-container")
      if (approvedUserContext && !approvedPublicUserField) categories.push(mediaContext ? "unapproved-public-media-field" : "unapproved-public-user-field")
      if (privateKey.test(key) && !publicDisplay) categories.push("private-account-contact-token-profile")
      if (privateContext && (idKey.test(key) || privateKey.test(key)) && !approvedMediaField) categories.push("private-nested-user-field")
      if (judgePrivateKey.test(key) && stringSegments.some((segment) => /^(?:judge|judges)$/i.test(segment))) categories.push("judge-private-contact-field")
      if (resultIdKey.test(key)) categories.push("aggregate-winner-id")
      else if (idKey.test(key) && !publicId) categories.push("non-null-id")
      if (displayKey.test(key) && !publicDisplay) categories.push("non-public-display-name")
      if (scoreCollectionKey.test(lowerKey)) categories.push("participant-speaker-score-collection")
      if (/(?:score|points|outcome|winner|winning|won)/.test(lowerKey)) {
        categories.push(segments.length === 1 && /^(?:team\d+score|team\d+won|debater\d+score|winnerteamid|winningteamids)$/i.test(key)
          ? "top-level-aggregate-result-field"
          : "nested-score-points-outcome-winner")
      }
      if (categories.length > 0) forbiddenNonNullPaths.push({ path, type, category: categories.join("+") })
    }

    if (Array.isArray(candidate)) {
      candidate.forEach((entry, index) => visit(entry, [...segments, index]))
    } else if (candidate !== null && typeof candidate === "object") {
      for (const [childKey, childValue] of Object.entries(candidate)) {
        visit(childValue, [...segments, childKey], childKey)
      }
    }
  }

  visit(value, [])
  return { sanitizedPropertyPaths, forbiddenNonNullPaths, allowedMetadataFlags }
}

const assertPrivacyStructuralContract = () => {
  const allowed = auditPrivacyStructure({
    id: 1,
    name: "Public match",
    match: { id: 7, name: "Nested public match" },
    round: { id: 2, name: "Preliminary 1" },
    pairing: { id: 3, displayName: "Pairing 1" },
    team1: { id: 4, name: "Public team" },
    debater1: {
      id: 5,
      fullName: "Public debater",
      user: { firstName: "Public", lastName: "Debater", displayName: "Public Debater", imageUrl: { id: 11, url: "/public-media/11" } },
    },
    participant: { user: { firstName: "Public", lastName: "Participant", fullName: "Public Participant", imageUrl: { id: 12, src: "/public-media/12" } } },
    judge: { id: 6, name: "Public judge" },
    completed: true,
    participantScoresComplete: null,
    participantScoresRepairable: false,
  })
  expect(allowed.forbiddenNonNullPaths, "synthetic public privacy contract should allow public IDs/display names").toEqual([])
  const allowedPaths = allowed.sanitizedPropertyPaths.map(({ path }) => path)
  for (const path of [
    "$.match.id",
    "$.pairing.id",
    "$.pairing.displayName",
    "$.debater1.user.firstName",
    "$.participant.user.lastName",
    "$.participant.user.imageUrl.id",
  ]) expect(allowedPaths, `synthetic allowed privacy path ${path}`).toContain(path)
  expect(allowed.allowedMetadataFlags.map(({ path, type }) => `${path}:${type}`).sort()).toEqual([
    "$.completed:boolean",
    "$.participantScoresComplete:null",
    "$.participantScoresRepairable:boolean",
  ])

  const forbidden = auditPrivacyStructure({
    team1Score: 1,
    team1Won: true,
    winnerTeamId: 7,
    winningTeamIds: [7],
    debater1Score: 2,
    participantScores: [{ participantId: 8, score: 3 }],
    nested: { points: 4, outcome: "win", winner: true },
    judge: { phone: "synthetic", email: "synthetic", social: "synthetic", checkedIn: true },
    participant: {
      profile: { id: 9, username: "synthetic", role: "synthetic", token: "synthetic", contact: "synthetic" },
      user: { id: 10, username: "synthetic", role: "synthetic", email: "synthetic", phone: "synthetic", token: "synthetic", contact: "synthetic", social: "synthetic", checkedIn: true },
    },
  })
  const forbiddenPaths = forbidden.forbiddenNonNullPaths.map(({ path }) => path)
  for (const path of [
    "$.team1Score",
    "$.team1Won",
    "$.winnerTeamId",
    "$.winningTeamIds",
    "$.debater1Score",
    "$.participantScores",
    "$.participantScores[0].participantId",
    "$.participantScores[0].score",
    "$.nested.points",
    "$.nested.outcome",
    "$.nested.winner",
    "$.judge.phone",
    "$.judge.email",
    "$.judge.social",
    "$.judge.checkedIn",
    "$.participant",
    "$.participant.profile",
    "$.participant.profile.id",
    "$.participant.user.id",
    "$.participant.user.username",
    "$.participant.user.role",
    "$.participant.user.email",
    "$.participant.user.phone",
    "$.participant.user.token",
    "$.participant.user.contact",
    "$.participant.user.social",
    "$.participant.user.checkedIn",
  ]) expect(forbiddenPaths, `synthetic forbidden privacy path ${path}`).toContain(path)
  expect(forbidden.forbiddenNonNullPaths.some((entry) => entry.category.includes("private-nested-user-field"))).toBe(true)
  expect(forbidden.forbiddenNonNullPaths.some((entry) => entry.category.includes("participant-profile-object"))).toBe(true)
}

test.describe.configure({ mode: "serial" })

async function createIntegritySuite(browser: Browser, config: IntegrityConfig, report: ReadyReport, fixtures: IntegrityFixture[], existingRun?: RunEvidence) {
  const run = existingRun ?? await createRunEvidence(config, report)
  const activeContexts = new Set<BrowserContext>()
  const trackedRuntimeEvidence = new Set<RuntimeEvidence>()
  const trackedSessions = new Map<string, IntegritySession>()
  const persistedAuthEvidence = new Set<string>()
  const persistedRuntimeDiagnostics = new Set<string>()
  const persistedNextLinkPrefetchEvidence = new Set<string>()
  const persistedVoidMutationRecords: PersistedVoidMutationRecord[] = []
  const cases: Array<Record<string, unknown>> = []
  const caseArtifacts = new Map<string, Array<{
    screenshots: { before: string; after: string; reload: string }
    response: Record<string, unknown>
    dbDelta: Record<string, unknown>
  }>>()
  const mutationEvidence = new Map<string, Array<Record<string, unknown>>>()
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.fixtureId, fixture]))

  const rootCaseId = (name: string) => REQUIRED_CASE_IDS.find((caseId) => name === caseId || name.startsWith(`${caseId}-`))
  const recordMutationEvidence = (name: string, evidence: Record<string, unknown>) => {
    const caseId = rootCaseId(name)
    if (!caseId) throw new Error(`Mutation evidence ${name} is not owned by a required case.`)
    const mutationName = typeof evidence.name === "string" && evidence.name.length > 0 ? evidence.name : null
    const expectedAborts = evidence.expectedVoidMutationAborts
    if (Array.isArray(expectedAborts)) {
      for (const entry of expectedAborts) {
        if (!entry || typeof entry !== "object") throw new Error(`Mutation evidence ${name} contains an invalid expected void mutation abort.`)
        const persisted = entry as Partial<ExpectedVoidMutationAbort>
        if (!persisted.correlationId || !persisted.caseName || !persisted.mutationName || mutationName === null) {
          throw new Error(`Mutation evidence ${name} contains an unassociated expected void mutation abort.`)
        }
        if (persisted.caseName !== caseId || persisted.mutationName !== mutationName) {
          throw new Error(`Mutation evidence ${name} contains wrong void mutation owner metadata.`)
        }
        persistedVoidMutationRecords.push({
          correlationId: persisted.correlationId,
          caseName: persisted.caseName,
          mutationName: persisted.mutationName,
          recordName: mutationName,
        })
      }
    }
    mutationEvidence.set(caseId, [...(mutationEvidence.get(caseId) ?? []), evidence])
  }

  const persistSessionAuthEvidence = async (session: IntegritySession) => {
    if (persistedAuthEvidence.has(session.sessionId)) return
    await writeRunRecord(run, `auth-session-${session.sessionId}`, session.authEvidence)
    persistedAuthEvidence.add(session.sessionId)
  }

  const track = (session: IntegritySession) => {
    activeContexts.add(session.context)
    trackedRuntimeEvidence.add(session.runtime)
    trackedSessions.set(session.sessionId, session)
    return session
  }

  const closedSessions = new Set<string>()
  const runtimeSensitiveValues = [config.organizerUsername, config.organizerPassword, config.debaterUsername, config.debaterPassword]
  const snapshotRuntimeEvidence = (runtime: RuntimeEvidence) => sanitizeRuntimeEvidenceForPersistence(runtime, runtimeSensitiveValues)
  const preCloseRuntimeBySession = new Map<string, RuntimeEvidence | null>()

  const persistRuntimeDiagnostics = async (
    session: IntegritySession,
    preCloseRuntime: RuntimeEvidence | null = null,
    options: { finalSuiteSnapshot?: boolean; force?: boolean } = {},
  ): Promise<RuntimeEvidencePersistenceRecords | null> => {
    if (!options.force && persistedRuntimeDiagnostics.has(session.sessionId)) return null
    if (!preCloseRuntimeBySession.has(session.sessionId)) preCloseRuntimeBySession.set(session.sessionId, preCloseRuntime)
    reconcileContextCloseCancellations(session.runtime)
    reconcileRuntimeEvidence(session.runtime)
    const finalRuntime = snapshotRuntimeEvidence(session.runtime)
    const records = buildRuntimeEvidencePersistenceRecords(
      session.sessionId,
      finalRuntime,
      preCloseRuntimeBySession.get(session.sessionId) ?? null,
      { contextClosed: session.runtime.phase === "closed", finalSuiteSnapshot: options.finalSuiteSnapshot === true },
    )
    await writeRuntimeEvidencePersistence(run, records)
    persistedRuntimeDiagnostics.add(session.sessionId)
    persistedNextLinkPrefetchEvidence.add(session.sessionId)
    return records
  }

  const mutationOwner = (caseName: string, mutationName: string) => {
    const caseId = rootCaseId(caseName)
    if (!caseId) throw new Error(`Void mutation owner ${caseName} is not owned by a required case.`)
    return { caseName: caseId, mutationName }
  }

  const registerMutationOwner = (session: IntegritySession, caseName: string, mutationName: string) => {
    registerVoidMutationOwnership(session.runtime, mutationOwner(caseName, mutationName))
  }

  const requireOwnedMutationTerminal = async (
    session: IntegritySession,
    caseName: string,
    mutationName: string,
    reconciliation?: VoidMutationTerminalReconciliation,
  ): Promise<ExpectedVoidMutationAbort[]> => {
    const owner = mutationOwner(caseName, mutationName)
    const terminal = reconciliation ?? await reconcileVoidMutationTerminal(session.runtime)
    if (!terminal.valid) throw new Error(`Void mutation ${owner.caseName}/${owner.mutationName} did not reconcile: ${JSON.stringify(terminal.errors)}`)
    const records = terminal.records.filter((record) =>
      record.owner?.caseName === owner.caseName && record.owner.mutationName === owner.mutationName,
    )
    if (records.length !== 1) {
      throw new Error(`Void mutation ${owner.caseName}/${owner.mutationName} must have exactly one owned terminal request; observed ${records.length}.`)
    }
    const [record] = records
    if (record.terminalOutcome !== "normal" && record.terminalOutcome !== "accepted-abort") {
      throw new Error(`Void mutation ${owner.caseName}/${owner.mutationName} has invalid terminal outcome ${record.terminalOutcome ?? "null"}.`)
    }
    const accepted = terminal.acceptedAborts.filter((entry) =>
      entry.caseName === owner.caseName && entry.mutationName === owner.mutationName,
    )
    if (record.terminalOutcome === "accepted-abort" && accepted.length !== 1) {
      throw new Error(`Void mutation ${owner.caseName}/${owner.mutationName} accepted abort was not persisted as exactly one terminal correlation.`)
    }
    if (record.terminalOutcome === "normal" && accepted.length !== 0) {
      throw new Error(`Void mutation ${owner.caseName}/${owner.mutationName} normal terminal unexpectedly produced an accepted abort.`)
    }
    return accepted
  }

  const closeSession = async (session: IntegritySession): Promise<VoidMutationTerminalReconciliation> => {
    if (closedSessions.has(session.sessionId)) {
      const reconciliation = await reconcileVoidMutationTerminal(session.runtime)
      assertRuntimeEvidenceIsClean(session.runtime)
      return reconciliation
    }

    try {
      await session.page.evaluate(() => undefined)
    } catch {
      // The page may already be closing; context lifecycle evidence remains authoritative.
    }
    const terminalReconciliation = await reconcileVoidMutationTerminal(session.runtime)
    const preCloseRuntime = snapshotRuntimeEvidence(session.runtime)
    let closeError: unknown = null
    let lifecycleError: unknown = null
    let closingBoundaryStarted = false
    try {
      beginRuntimeClosing(session.runtime)
      closingBoundaryStarted = true
    } catch (error) {
      lifecycleError = error
    }
    try {
      await session.context.close()
    } catch (error) {
      closeError = error
    }
    if (closingBoundaryStarted) {
      try {
        finishRuntimeClose(session.runtime)
      } catch (error) {
        lifecycleError ??= error
      }
    }
    reconcileRuntimeEvidence(session.runtime)

    let persistError: unknown = null
    try {
      await persistRuntimeDiagnostics(session, preCloseRuntime)
    } catch (error) {
      persistError = error
    } finally {
      activeContexts.delete(session.context)
      closedSessions.add(session.sessionId)
      try {
        await persistSessionAuthEvidence(session)
      } catch (error) {
        persistError ??= error
      }
    }

    let runtimeError: unknown = null
    try {
      assertRuntimeEvidenceIsClean(session.runtime)
    } catch (error) {
      runtimeError = error
    }
    if (runtimeError) throw runtimeError
    if (persistError) throw persistError
    if (lifecycleError) throw lifecycleError
    if (closeError) throw closeError
    return terminalReconciliation
  }

  const gotoTournament = async (session: IntegritySession, tournamentId: number, identity: "authenticated" | "anonymous" = "authenticated") => {
    const expectedPath = `/tournament/${tournamentId}`
    setRuntimeExpectedTournamentPath(session.runtime, expectedPath)
    const browserUsersMeResponse = session.page.waitForResponse((response) =>
      response.request().method() === "GET" && new URL(response.url()).pathname === "/api/users/me",
      { timeout: RESPONSE_TIMEOUT_MS },
    )
    let navigationStatus: number | null = null
    try {
      const navigationResponse = await session.page.goto(expectedPath, { waitUntil: "domcontentloaded" })
      navigationStatus = navigationResponse?.status() ?? null
    } catch (error) {
      const finalPath = (() => {
        try {
          return new URL(session.page.url()).pathname
        } catch {
          return null
        }
      })()
      const navigation: SessionNavigationEvidence = {
        expectedPath,
        status: navigationStatus,
        finalPath,
        noAuthRedirect: finalPath === expectedPath && !finalPath.startsWith("/auth"),
        browserUsersMeStatus: null,
      }
      session.authEvidence.navigation = navigation
      session.authEvidence.navigationHistory.push(navigation)
      throw error
    }
    const finalPath = new URL(session.page.url()).pathname
    const navigation: SessionNavigationEvidence = {
      expectedPath,
      status: navigationStatus,
      finalPath,
      noAuthRedirect: finalPath === expectedPath && !finalPath.startsWith("/auth"),
      browserUsersMeStatus: null,
    }
    session.authEvidence.navigation = navigation
    session.authEvidence.navigationHistory.push(navigation)
    expect(navigationStatus, `tournament navigation ${expectedPath} must return 200`).toBe(200)
    expect(finalPath, `tournament navigation must finish at ${expectedPath}`).toBe(expectedPath)
    expect(navigation.noAuthRedirect, `tournament navigation ${expectedPath} must not redirect to auth`).toBe(true)
    const browserUsersMe = await browserUsersMeResponse
    navigation.browserUsersMeStatus = browserUsersMe.status()
    if (identity === "authenticated") {
      expect(navigation.browserUsersMeStatus, `browser GET /api/users/me for ${expectedPath} must return 200`).toBe(200)
    } else {
      expect([401, 403], `anonymous browser GET /api/users/me for ${expectedPath} must remain unauthorized`).toContain(navigation.browserUsersMeStatus)
    }
    await session.page.getByRole("tab", { name: "Pairing and Matches", exact: true }).waitFor()
    await session.page.getByRole("tab", { name: "Results and Statistics", exact: true }).waitFor()
  }

  const assertPublicResultsSurface = async (session: IntegritySession) => {
    const resultsTab = session.page.getByRole("tab", { name: "Results and Statistics", exact: true })
    await expect(resultsTab).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS })
    if (
      await resultsTab.getAttribute("aria-selected", { timeout: RESPONSE_TIMEOUT_MS }) !== "true" ||
      await resultsTab.getAttribute("aria-expanded", { timeout: RESPONSE_TIMEOUT_MS }) !== "true"
    ) {
      await resultsTab.click({ timeout: RESPONSE_TIMEOUT_MS })
    }

    const bpfOption = session.page.getByRole("button", { name: "BPF", exact: true })
    await expect(bpfOption).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS })
    await bpfOption.click({ timeout: RESPONSE_TIMEOUT_MS })
    await expect(resultsTab).toHaveAttribute("aria-selected", "true", { timeout: RESPONSE_TIMEOUT_MS })
    await expect(session.page.getByRole("heading", { name: "BPF", exact: true })).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS })
    await expect(session.page.getByRole("heading", { name: "Preliminary standings", exact: true })).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS })

    const roundEntryButton = session.page.getByRole("button", { name: "Round entry", exact: true })
    const speakerDetailsButton = session.page.getByRole("button", { name: "Speaker details", exact: true })
    const speakerDetailsHeading = session.page.getByRole("heading", { name: "Speaker details", exact: true })
    const scoreEntrySpinbuttons = session.page.getByRole("spinbutton")
    const winnerControls = session.page.getByRole("button", { name: /^Mark .+ as (?:winner|not winner) in match .+$/ })
    const exactResultHeadings = session.page.getByRole("heading", { name: /results and speaker points$/i })
    const exactResultRows = session.page.locator("tr").filter({ has: session.page.locator('[role="group"][aria-label^="Result for "]') })
    const scoreEntryInputs = session.page.locator('input[aria-label^="Speaker points for "]')

    await expect(roundEntryButton).toHaveCount(0)
    await expect(speakerDetailsButton).toHaveCount(0)
    await expect(speakerDetailsHeading).toHaveCount(0)
    await expect(scoreEntrySpinbuttons).toHaveCount(0)
    await expect(winnerControls).toHaveCount(0)
    await expect(exactResultHeadings).toHaveCount(0)
    await expect(exactResultRows).toHaveCount(0)
    await expect(scoreEntryInputs).toHaveCount(0)

    return {
      formatHeading: "BPF",
      publicViewHeading: "Preliminary standings",
      roundEntryAbsent: true,
      speakerDetailsAbsent: true,
      scoreEntrySpinbuttons: 0,
      winnerControls: 0,
      exactResultHeadings: 0,
      exactResultRows: 0,
      scoreEntryInputs: 0,
    }
  }

  const readNoLdResultsControls = async (session: IntegritySession) => {
    const resultsTab = session.page.getByRole("tab", { name: "Results and Statistics", exact: true })
    await resultsTab.waitFor({ state: "visible", timeout: RESPONSE_TIMEOUT_MS })
    if (
      await resultsTab.getAttribute("aria-selected", { timeout: RESPONSE_TIMEOUT_MS }) !== "true" ||
      await resultsTab.getAttribute("aria-expanded", { timeout: RESPONSE_TIMEOUT_MS }) !== "true"
    ) {
      await resultsTab.click({ timeout: RESPONSE_TIMEOUT_MS })
    }
    const controls = await Promise.all(["APF", "BPF", "LD"].map(async (format) => {
      const locator = session.page.getByRole("button", { name: format, exact: true })
      const count = await locator.count()
      return {
        format,
        count,
        visible: count > 0 && await locator.first().isVisible(),
      }
    }))
    return {
      selected: await resultsTab.getAttribute("aria-selected"),
      expanded: await resultsTab.getAttribute("aria-expanded"),
      controls,
    }
  }

  const readPairingStageControls = async (
    session: IntegritySession,
    requiredStages: ReadonlyArray<"preliminary" | "team" | "solo"> = [],
  ) => {
    const pairingsTab = session.page.getByRole("tab", { name: "Pairing and Matches", exact: true })
    await pairingsTab.waitFor({ state: "visible", timeout: RESPONSE_TIMEOUT_MS })
    if (await pairingsTab.getAttribute("aria-selected", { timeout: RESPONSE_TIMEOUT_MS }) !== "true") {
      await pairingsTab.click({ timeout: RESPONSE_TIMEOUT_MS })
    }
    const section = session.page.locator('[data-pairings-hydrated="true"]')
    await section.waitFor({ state: "visible", timeout: RESPONSE_TIMEOUT_MS })
    const definitions = [
      { stage: "preliminary" as const, label: "Preliminary (APF)" },
      { stage: "team" as const, label: "Team elimination (BPF)" },
      { stage: "solo" as const, label: "Solo elimination (LD)" },
    ]
    for (const definition of definitions.filter(({ stage }) => requiredStages.includes(stage))) {
      await section.getByRole("button", { name: definition.label, exact: true }).waitFor({ state: "visible", timeout: RESPONSE_TIMEOUT_MS })
    }
    const controls = await Promise.all(definitions.map(async ({ stage, label }) => {
      const locator = section.getByRole("button", { name: label, exact: true })
      const count = await locator.count()
      return {
        stage,
        label,
        count,
        visible: count > 0 && await locator.first().isVisible(),
        pressed: count > 0 ? await locator.first().getAttribute("aria-pressed") : null,
      }
    }))
    return {
      sectionCount: await section.count(),
      controls,
    }
  }

  const readTeamPairingSelection = async (session: IntegritySession, round: IntegrityRound) => {
    const section = session.page.locator('[data-pairings-hydrated="true"]')
    const stageButton = section.getByRole("button", { name: "Team elimination (BPF)", exact: true })
    const roundButton = section.getByRole("button", { name: round.name, exact: true })
    return {
      hydratedSectionCount: await section.count(),
      stageLabel: await stageButton.innerText(),
      stagePressed: await stageButton.getAttribute("aria-pressed"),
      roundLabel: await roundButton.innerText(),
      roundPressed: await roundButton.getAttribute("aria-pressed"),
    }
  }

  const sessionGateEvidence = (session: IntegritySession) => {
    let cleanAfterClose = true
    try {
      assertRuntimeEvidenceIsClean(session.runtime)
    } catch {
      cleanAfterClose = false
    }
    return {
      auth: {
        sessionId: session.sessionId,
        purpose: session.authEvidence.purpose,
        expectedRole: session.authEvidence.expectedRole,
        verifiedRole: session.authEvidence.verifiedRole,
        navigation: session.authEvidence.navigation,
      },
      runtime: {
        consoleErrors: session.runtime.consoleErrors.length,
        requestFailures: session.runtime.requestFailures.length,
        httpErrors: session.runtime.httpErrors.length,
        blockedRequests: session.runtime.blockedRequests.length,
        requestEvidence: session.runtime.requestEvidence.length,
        expectedNextLinkPrefetchAborts: session.runtime.expectedNextLinkPrefetchAborts.length,
        cleanAfterClose,
      },
    }
  }

  const freshOrganizer = async (fixture: IntegrityFixture) => {
    const session = track(await openOrganizerSession(browser, config, "ui-tournament", `/tournament/${fixture.tournamentId}`))
    await gotoTournament(session, fixture.tournamentId)
    return session
  }

  const resetFreshWithEvidence = async (
    fixture: IntegrityFixture,
    caseName: string,
    scenario?: string,
    evidenceCaseName = caseName,
    includeInventory = false,
  ) => {
    const session = track(await openOrganizerSession(browser, config, "ui-tournament", `/tournament/${fixture.tournamentId}`))
    await gotoTournament(session, fixture.tournamentId)
    const beforeState = await readDatabaseState(session.context, fixture)
    const beforeInventory = includeInventory ? await collectTournamentInventory(session.context, config, fixture.tournamentId) : null
    const beforeScreenshot = await captureCheckpoint(session.page, run, `${caseName}-reset-before`)
    const reset = await resetFixture(session.context, fixture, scenario)
    const afterState = await readDatabaseState(session.context, fixture)
    const afterInventory = includeInventory ? await collectTournamentInventory(session.context, config, fixture.tournamentId) : null
    await closeSession(session)
    const after = await freshOrganizer(fixture)
    const afterScreenshot = await captureCheckpoint(after.page, run, `${caseName}-reset-after`)
    await closeSession(after)
    const reload = await freshOrganizer(fixture)
    const reloadState = await readDatabaseState(reload.context, fixture)
    const reloadInventory = includeInventory ? await collectTournamentInventory(reload.context, config, fixture.tournamentId) : null
    const reloadScreenshot = await captureCheckpoint(reload.page, run, `${caseName}-reset-reload`)
    const resetEvidence = {
      caseName,
      scenario: scenario ?? null,
      mutation: reset,
      beforeState,
      afterState,
      reloadState,
      ...(includeInventory ? { inventories: { before: beforeInventory, after: afterInventory, reload: reloadInventory } } : {}),
      delta: databaseDelta(beforeState, afterState),
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
    }
    await writeRunRecord(run, `${caseName}-reset`, resetEvidence)
    const delta = resetEvidence.delta
    caseArtifacts.set(evidenceCaseName, [
      ...(caseArtifacts.get(evidenceCaseName) ?? []),
      { screenshots: resetEvidence.screenshots, response: reset, dbDelta: delta },
    ])
    return { session: reload, resetEvidence }
  }

  const resetFresh = async (fixture: IntegrityFixture, caseName: string, scenario?: string, evidenceCaseName = caseName) => {
    const result = await resetFreshWithEvidence(fixture, caseName, scenario, evidenceCaseName)
    return result.session
  }

  const matchAt = (inventory: IntegrityInventory, stage: IntegrityStage, round: IntegrityRound, matchId: number) => {
    const stageSnapshot = findStage(inventory, stage)
    const roundSnapshot = stageSnapshot.rounds.find((candidate) => candidate.id === round.id)
    if (!roundSnapshot) throw new Error(`Round ${round.id} disappeared from ${stage}.`)
    const match = roundSnapshot.matches.find((candidate) => candidate.id === matchId)
    if (!match) throw new Error(`Match ${matchId} disappeared after reload.`)
    return match
  }

  const assertPersistedRound = async (
    session: { page: import("@playwright/test").Page; context: BrowserContext },
    fixture: IntegrityFixture,
    stage: IntegrityStage,
    round: IntegrityRound,
    format: DebateFormat,
    expectedByMatch: Map<number, Map<number, number>>,
  ) => {
    const inventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
    for (const [matchId, expected] of expectedByMatch) {
      const actual = matchAt(inventory, stage, round, matchId)
      expect(actual.completed, `${stage}/${round.name}/match-${matchId} did not complete`).toBe(true)
      const actualScores = new Map<number, number>([
        ...actual.teams.flatMap((team) => team.speakers.flatMap((speaker) => typeof speaker.score === "number" ? [[speaker.id, speaker.score] as const] : [])),
        ...actual.debaters.flatMap((debater) => typeof debater.score === "number" ? [[debater.id, debater.score] as const] : []),
      ])
      expect(actualScores.size, `${stage}/${round.name}/match-${matchId} participant row count`).toBe(expected.size)
      for (const [participantId, score] of expected) expect(actualScores.get(participantId)).toBe(score)
      if (format === DebateFormat.LD) {
        expect(actual.debaters).toHaveLength(2)
        if (stage === "solo") {
          expect(actual.winnerParticipantId).toBe(actual.debaters[0].id)
        } else {
          expect(actual.debaters[0].score).not.toBe(actual.debaters[1].score)
        }
      } else {
        const expectedWinnerCount = format === DebateFormat.BPF ? 2 : 1
        expect(actual.teams.filter((team) => team.won === true)).toHaveLength(expectedWinnerCount)
      }
    }
    return inventory
  }

  const assertVisibleRound = async (
    page: import("@playwright/test").Page,
    round: IntegrityRound,
    format: DebateFormat,
    expectedByMatch: Map<number, Map<number, number>>,
  ) => {
    for (const [matchId, expected] of expectedByMatch) {
      const visible = await visibleMatchScores(page, matchId)
      expect(visible, `${round.name}/match-${matchId} visible score row count`).toHaveLength(expected.size)
      expect(visible.map((entry) => Number(entry.value)).sort((a, b) => a - b)).toEqual([...expected.values()].sort((a, b) => a - b))
      expect(await visibleMatchRowText(page, matchId)).toContain("Completed")
      const match = round.matches.find((candidate) => candidate.id === matchId)
      if (!match) throw new Error(`No source match ${matchId} in ${round.name}.`)
      if (format === DebateFormat.LD) {
        if (expected.size === 0) {
          for (const [index, debater] of match.debaters.entries()) {
            const selectedButton = page.getByRole("button", {
              name: `Mark ${debater.name} as ${index === 0 ? "winner" : "not winner"} in match ${match.id}`,
              exact: true,
            })
            await expect(selectedButton).toHaveAttribute("aria-pressed", "true")
            await expect(selectedButton).toBeDisabled()
          }
        }
        continue
      }
      const winnerCount = format === DebateFormat.BPF ? 2 : 1
      for (const [index, team] of match.teams.entries()) {
        const isWinner = index < winnerCount
        const selectedButton = page.getByRole("button", { name: `Mark ${team.name} as ${isWinner ? "winner" : "not winner"} in match ${match.id}`, exact: true })
        const oppositeButton = page.getByRole("button", { name: `Mark ${team.name} as ${isWinner ? "not winner" : "winner"} in match ${match.id}`, exact: true })
        await expect(selectedButton).toHaveAttribute("aria-pressed", "true")
        await expect(selectedButton).toBeDisabled()
        await expect(oppositeButton).toHaveAttribute("aria-pressed", "false")
        await expect(oppositeButton).toBeDisabled()
      }
    }
  }

  const assertStandingsDelta = (
    before: Awaited<ReturnType<typeof collectTeamStandings>>,
    after: Awaited<ReturnType<typeof collectTeamStandings>>,
    expected: Map<number, number> | null,
    label: string,
  ) => {
    const beforeMap = new Map(before.map((team) => [team.id, team.preliminaryScore ?? 0]))
    const afterMap = new Map(after.map((team) => [team.id, team.preliminaryScore ?? 0]))
    const ids = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort((a, b) => a - b)
    const actual = new Map(ids.map((id) => [id, (afterMap.get(id) ?? 0) - (beforeMap.get(id) ?? 0)] as const))
    if (expected) {
      for (const id of ids) expect(actual.get(id), `${label} team ${id} standings delta`).toBe(expected.get(id) ?? 0)
    } else {
      for (const id of ids) expect(actual.get(id), `${label} team ${id} standings delta`).toBe(0)
    }
    return Object.fromEntries(actual)
  }

  const submitCurrentRoundFromUI = async (
    session: IntegritySession,
    fixture: IntegrityFixture,
    stage: IntegrityStage,
    round: IntegrityRound,
    format: DebateFormat,
    caseName: string,
    seed: number,
    standingsMode: "scores" | "unchanged",
  ) => {
    await selectResultsRound(session.page, stage, format, round)
    const beforeState = await readDatabaseState(session.context, fixture)
    const beforeStandings = await collectTeamStandings(session.context, config, fixture.tournamentId)
    const beforeScreenshot = await captureCheckpoint(session.page, run, `${caseName}-${round.name}-before`)
    const openMatches = round.matches.filter((match) => !match.completed)
    expect(openMatches.length, `${caseName}/${round.name} must have open matches`).toBeGreaterThan(0)
    const expectedByMatch = new Map<number, Map<number, number>>()
    for (const match of openMatches) {
      const expected = await fillValidMatch(session.page, match, format, seed + match.id, stage)
      const expectedRowCount = stage === "preliminary"
        ? format === DebateFormat.BPF ? 8 : format === DebateFormat.LD ? 2 : 4
        : 0
      expect(expected.size, `${caseName}/match-${match.id} score row count`).toBe(expectedRowCount)
      expectedByMatch.set(match.id, expected)
    }
    const responsePromise = session.page.waitForResponse((response) =>
      response.request().method() === "PATCH" && response.url().includes("/matches/results"),
      { timeout: RESPONSE_TIMEOUT_MS },
    )
    const mutationName = `${caseName}/${round.name}/ui-submit-results`
    registerMutationOwner(session, caseName, mutationName)
    const submitButton = session.page.getByRole("button", { name: "Submit results", exact: true })
    await expect(submitButton, `${caseName}/${round.name} submit button`).toBeEnabled()
    await submitButton.click()
    const response = await responsePromise
    const mutation = await readMutationResponse(response)
    expect(mutation.status, `${caseName}/${round.name} results API status`).toBe(200)
    for (const matchId of expectedByMatch.keys()) expect(await visibleMatchRowText(session.page, matchId)).toContain("Completed")
    const afterState = await readDatabaseState(session.context, fixture)
    const afterStandings = await collectTeamStandings(session.context, config, fixture.tournamentId)
    const afterScreenshot = await captureCheckpoint(session.page, run, `${caseName}-${round.name}-after`)
    const beforeInventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
    const result = await assertPersistedRound(session, fixture, stage, round, format, expectedByMatch)

    const expectedStandingsDelta = standingsMode === "scores"
      ? new Map<number, number>(openMatches.flatMap((match) => match.teams.map((team) => [team.id, team.speakers.reduce((sum, speaker) => sum + (expectedByMatch.get(match.id)?.get(speaker.id) ?? 0), 0)] as const)))
      : null
    const standingsDelta = assertStandingsDelta(beforeStandings, afterStandings, expectedStandingsDelta, `${caseName}/${round.name}`)

    const terminalReconciliation = await closeSession(session)
    const expectedVoidMutationAborts = await requireOwnedMutationTerminal(session, caseName, mutationName, terminalReconciliation)
    const reload = await freshOrganizer(fixture)
    expect(reload.context).not.toBe(session.context)
    await selectResultsRound(reload.page, stage, format, round)
    const reloadState = await readDatabaseState(reload.context, fixture)
    const reloadInventory = await assertPersistedRound(reload, fixture, stage, round, format, expectedByMatch)
    await assertVisibleRound(reload.page, round, format, expectedByMatch)
    const reloadScreenshot = await captureCheckpoint(reload.page, run, `${caseName}-${round.name}-reload`)
    await writeRunRecord(run, `${caseName}-${round.name}-result`, {
      stage,
      round: { id: round.id, name: round.name, number: round.roundNumber },
      format,
      mutation,
      expectedByMatch: Object.fromEntries([...expectedByMatch].map(([id, points]) => [id, Object.fromEntries(points)])),
      beforeState,
      afterState,
      reloadState,
      dbDelta: databaseDelta(beforeState, afterState),
      standings: { before: beforeStandings, after: afterStandings, delta: standingsDelta },
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
      inventoryAfterSubmit: result,
      inventoryAfterReload: reloadInventory,
      sourceInventory: beforeInventory,
      expectedVoidMutationAborts,
    })
    recordMutationEvidence(caseName, {
      name: mutationName,
      kind: "ui-mutation",
      response: mutation,
      dbDelta: databaseDelta(beforeState, afterState),
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
      expectedVoidMutationAborts,
    })
    return { session: reload, inventory: reloadInventory, expectedByMatch, beforeStandings, afterStandings }
  }

  const matchIdentities = (matches: IntegrityMatch[]) => matches
    .map((match) => ({
      id: match.id,
      teamIds: match.teams.map((team) => team.id).sort((left, right) => left - right),
    }))
    .sort((left, right) => left.id - right.id)

  const proceedFromUI = async (
    session: IntegritySession,
    fixture: IntegrityFixture,
    stage: IntegrityStage,
    round: IntegrityRound,
    currentInventory: IntegrityInventory,
    caseName: string,
    targetStage?: IntegrityStage,
    targetFormat?: DebateFormat,
  ) => {
    await selectPairingRound(session.page, currentInventory.stages, stage, round)
    const beforeState = await readDatabaseState(session.context, fixture)
    const beforeStandings = await collectTeamStandings(session.context, config, fixture.tournamentId)
    const beforeScreenshot = await captureCheckpoint(session.page, run, `${caseName}-${round.name}-before`)
    const button = session.page.getByRole("button", { name: "Proceed to next round", exact: true })
    await expect(button, `${caseName}/${round.name} progression button`).toBeEnabled()
    const responsePromise = session.page.waitForResponse((response) =>
      response.request().method() === "PATCH" && response.url().includes("/proceed"),
      { timeout: RESPONSE_TIMEOUT_MS },
    )
    const mutationName = `${caseName}/${round.name}/ui-proceed`
    registerMutationOwner(session, caseName, mutationName)
    await button.click()
    const response = await responsePromise
    const mutation = await readMutationResponse(response)
    expect(mutation.status, `${caseName}/${round.name} progression API status`).toBe(200)
    const afterState = await readDatabaseState(session.context, fixture)
    const afterStandings = await collectTeamStandings(session.context, config, fixture.tournamentId)
    const afterScreenshot = await captureCheckpoint(session.page, run, `${caseName}-${round.name}-after`)
    const afterInventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
    const sourceStageSnapshot = findStage(afterInventory, stage)
    const progressionDelta = databaseDelta(beforeState, afterState)
    const standingsDelta = assertStandingsDelta(beforeStandings, afterStandings, null, `${caseName}/${round.name} progression`)
    const isCrossStage = Boolean(targetStage && targetStage !== stage)
    let generatedRound: IntegrityRound
    const persistedTargetStage = targetStage ?? stage
    let generatedTeamIds: number[] = []
    let generatedUniqueTeamIds: number[] = []

    if (!isCrossStage) {
      expect(sourceStageSnapshot.currentRoundNumber).toBe(round.roundNumber + 1)
      generatedRound = findRound(sourceStageSnapshot, round.roundNumber + 1)
      expect(generatedRound.matches.length, `${caseName}/${round.name} generated next-round match count`).toBeGreaterThan(0)
      expect(generatedRound.format).toBe(sourceStageSnapshot.format)
    } else {
      if (!targetStage || !targetFormat) throw new Error(`${caseName}/${round.name} cross-stage progression requires target stage and format.`)
      const targetStageSnapshot = findStage(afterInventory, targetStage)
      expect(sourceStageSnapshot.currentRoundNumber, `${caseName}/${round.name} source stage current round`).toBe(round.roundNumber)
      expect(targetStageSnapshot.currentRoundNumber, `${caseName}/${round.name} target stage current round`).toBe(1)
      expect(targetStageSnapshot.format, `${caseName}/${round.name} target stage format`).toBe(targetFormat)
      const firstPopulatedTargetRound = targetStageSnapshot.rounds.find((candidate) => candidate.matches.length > 0)
      expect(firstPopulatedTargetRound, `${caseName}/${round.name} target stage first populated round`).toBeDefined()
      generatedRound = firstPopulatedTargetRound!
      expect(targetStageSnapshot.currentRoundNumber).toBe(generatedRound.roundNumber)
      expect(generatedRound.matches.length, `${caseName}/${round.name} generated target-round match count`).toBeGreaterThan(0)
      expect(generatedRound.format, `${caseName}/${round.name} generated target-round format`).toBe(targetFormat)
      if (targetStage === "team") {
        expect(generatedRound.name, `${caseName}/${round.name} generated target round`).toBe("Semifinal")
        expect(generatedRound.matches).toHaveLength(2)
        expect(generatedRound.matches.every((match) => !match.completed)).toBe(true)
        const expectedTeamsPerMatch = targetFormat === DebateFormat.BPF ? 4 : 2
        const expectedTeamSlotCount = expectedTeamsPerMatch * 2
        generatedTeamIds = generatedRound.matches.flatMap((match) => match.teams.map((team) => team.id))
        generatedUniqueTeamIds = [...new Set(generatedTeamIds)].sort((left, right) => left - right)
        expect(generatedRound.matches.every((match) => match.teams.length === expectedTeamsPerMatch)).toBe(true)
        expect(generatedTeamIds).toHaveLength(expectedTeamSlotCount)
        expect(generatedUniqueTeamIds).toHaveLength(expectedTeamSlotCount)
        const finalRound = targetStageSnapshot.rounds.find((candidate) => candidate.name === "Final")
        expect(finalRound, `${caseName}/${round.name} target Final round`).toBeDefined()
        expect(finalRound?.matches).toHaveLength(0)
      }
      expect(progressionDelta.changed, `${caseName}/${round.name} cross-stage DB delta`).toBe(true)
    }

    const terminalReconciliation = await closeSession(session)
    const expectedVoidMutationAborts = await requireOwnedMutationTerminal(session, caseName, mutationName, terminalReconciliation)
    const reload = await freshOrganizer(fixture)
    const reloadInventory = await collectTournamentInventory(reload.context, config, fixture.tournamentId)
    const reloadStage = findStage(reloadInventory, persistedTargetStage)
    const reloadRound = findRound(reloadStage, generatedRound.roundNumber)
    expect(reloadStage.currentRoundNumber, `${caseName}/${round.name} reload target current round`).toBe(generatedRound.roundNumber)
    expect(reloadRound.name, `${caseName}/${round.name} reload target round`).toBe(generatedRound.name)
    expect(reloadRound.format, `${caseName}/${round.name} reload target format`).toBe(generatedRound.format)
    expect(matchIdentities(reloadRound.matches), `${caseName}/${round.name} reload match/team identities`).toEqual(matchIdentities(generatedRound.matches))
    await selectPairingRound(reload.page, reloadInventory.stages, persistedTargetStage, reloadRound)
    for (const match of reloadRound.matches) {
      for (const team of match.teams) await expect(reload.page.getByText(team.name, { exact: true })).toBeVisible()
    }
    const reloadState = await readDatabaseState(reload.context, fixture)
    const reloadScreenshot = await captureCheckpoint(reload.page, run, `${caseName}-${round.name}-reload`)
    await writeRunRecord(run, `${caseName}-${round.name}-progression`, {
      sourceStage: stage,
      targetStage: persistedTargetStage,
      round: { id: round.id, name: round.name, number: round.roundNumber },
      targetRound: { id: reloadRound.id, name: reloadRound.name, number: reloadRound.roundNumber },
      mutation,
      beforeState,
      afterState,
      reloadState,
      dbDelta: progressionDelta,
      standings: { before: beforeStandings, after: afterStandings, delta: standingsDelta },
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
      generatedMatches: generatedRound.matches,
      generatedMatchIdentities: matchIdentities(generatedRound.matches),
      generatedTeamIds,
      generatedUniqueTeamIds,
      reloadedMatchIdentities: matchIdentities(reloadRound.matches),
      expectedVoidMutationAborts,
    })
    recordMutationEvidence(caseName, {
      name: mutationName,
      kind: "ui-mutation",
      response: mutation,
      dbDelta: databaseDelta(beforeState, afterState),
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
      expectedVoidMutationAborts,
    })
    return { session: reload, inventory: reloadInventory, round: reloadRound }
  }

  const repairPreliminaryRoundForSoloSetup = async (
    session: IntegritySession,
    fixture: IntegrityFixture,
    inventory: IntegrityInventory,
    preliminaryRound: IntegrityRound,
    repairableMatches: IntegrityMatch[],
    caseName: string,
  ) => {
    expect(repairableMatches.length, `${caseName}/preliminary repair must have repairable matches`).toBeGreaterThan(0)
    expect(preliminaryRound.matches.every((match) => match.completed), `${caseName}/preliminary repair matches must be completed`).toBe(true)
    expect(repairableMatches.every((match) => match.participantScoresComplete === false && match.participantScoresRepairable === true)).toBe(true)
    expect(repairableMatches.flatMap((match) => match.teams.flatMap((team) => team.speakers.filter((speaker) => speaker.score !== null)))).toHaveLength(0)

    const teamAggregateSnapshot = (matches: IntegrityMatch[]) => matches
      .map((match) => ({
        matchId: match.id,
        teams: match.teams
          .map((team) => ({ id: team.id, score: team.score, won: team.won }))
          .sort((left, right) => left.id - right.id),
      }))
      .sort((left, right) => left.matchId - right.matchId)
    const expectedTeamAggregates = teamAggregateSnapshot(preliminaryRound.matches)
    await selectPairingRound(session.page, inventory.stages, "preliminary", preliminaryRound)
    const proceedButton = session.page.getByRole("button", { name: "Proceed to next round", exact: true })
    await expect(proceedButton, `${caseName}/preliminary proceed must be disabled before repair`).toBeDisabled()
    const beforeScreenshot = await captureCheckpoint(session.page, run, `${caseName}-setup-preliminary-repair-before`)
    const beforeState = await readDatabaseState(session.context, fixture)
    const beforeStandings = await collectTeamStandings(session.context, config, fixture.tournamentId)
    const beforeDatabaseState = beforeState as {
      counts?: { participantScoreRows?: number }
      speakerTotals?: { rowCount?: number; nonZeroCount?: number }
    }
    expect(beforeDatabaseState.counts?.participantScoreRows, `${caseName}/preliminary repair initial participant rows`).toBe(0)
    expect(beforeDatabaseState.speakerTotals?.rowCount, `${caseName}/preliminary repair legacy speaker totals`).toBe(8)
    expect(beforeDatabaseState.speakerTotals?.nonZeroCount, `${caseName}/preliminary repair non-zero legacy speaker totals`).toBe(8)

    await selectResultsRound(session.page, "preliminary", DebateFormat.APF, preliminaryRound)
    const expectedByMatch = new Map<number, Map<number, number>>()
    for (const match of repairableMatches) expectedByMatch.set(match.id, await fillRepairableMatch(session.page, match))
    const expectedParticipantScoreRows = [...expectedByMatch.values()].reduce((total, expected) => total + expected.size, 0)
    const submitButton = session.page.getByRole("button", { name: "Submit results", exact: true })
    await expect(submitButton, `${caseName}/preliminary repair submit button`).toBeEnabled()
    const responsePromise = session.page.waitForResponse((response) =>
      response.request().method() === "PATCH" && response.url().includes("/matches/results"),
      { timeout: RESPONSE_TIMEOUT_MS },
    )
    const mutationName = `${caseName}/setup-preliminary/repair/ui-submit-results`
    registerMutationOwner(session, caseName, mutationName)
    await submitButton.click()
    const mutation = await readMutationResponse(await responsePromise)
    expect(mutation.status, `${caseName}/preliminary repair results API status`).toBe(200)

    const afterState = await readDatabaseState(session.context, fixture)
    const afterStandings = await collectTeamStandings(session.context, config, fixture.tournamentId)
    const afterInventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
    const assertRepairedInventory = (candidateInventory: IntegrityInventory, label: string) => {
      const candidateRound = findRound(findStage(candidateInventory, "preliminary"), preliminaryRound.roundNumber)
      expect(teamAggregateSnapshot(candidateRound.matches), `${label} team aggregates`).toEqual(expectedTeamAggregates)
      for (const match of candidateRound.matches) {
        expect(match.participantScoresComplete, `${label}/match-${match.id} participant scores complete`).toBe(true)
        expect(match.participantScoresRepairable, `${label}/match-${match.id} participant scores repairable`).toBe(false)
      }
      for (const [matchId, expected] of expectedByMatch) {
        const actual = matchAt(candidateInventory, "preliminary", preliminaryRound, matchId)
        expect(actual.completed, `${label}/match-${matchId} completed`).toBe(true)
        const actualScores = new Map<number, number>(actual.teams.flatMap((team) => team.speakers.flatMap((speaker) =>
          typeof speaker.score === "number" ? [[speaker.id, speaker.score] as const] : [])))
        expect(actualScores.size, `${label}/match-${matchId} participant score row count`).toBe(expected.size)
        for (const [participantId, score] of expected) expect(actualScores.get(participantId), `${label}/match-${matchId}/participant-${participantId}`).toBe(score)
      }
      return candidateRound
    }
    const afterRound = assertRepairedInventory(afterInventory, `${caseName}/after repair`)
    const afterDatabaseState = afterState as {
      counts?: { participantScoreRows?: number }
      speakerTotals?: { rowCount?: number; nonZeroCount?: number }
    }
    const repairDelta = databaseDelta(beforeState, afterState)
    expect(repairDelta.changed, `${caseName}/preliminary repair DB delta`).toBe(true)
    expect(afterDatabaseState.counts?.participantScoreRows, `${caseName}/preliminary repair participant rows`).toBe(expectedParticipantScoreRows)
    expect(afterDatabaseState.speakerTotals).toEqual(beforeDatabaseState.speakerTotals)
    expect(afterStandings, `${caseName}/preliminary repair standings`).toEqual(beforeStandings)
    const afterScreenshot = await captureCheckpoint(session.page, run, `${caseName}-setup-preliminary-repair-after`)

    const terminalReconciliation = await closeSession(session)
    const expectedVoidMutationAborts = await requireOwnedMutationTerminal(session, caseName, mutationName, terminalReconciliation)
    const reload = await freshOrganizer(fixture)
    await selectResultsRound(reload.page, "preliminary", DebateFormat.APF, preliminaryRound)
    const reloadInventory = await collectTournamentInventory(reload.context, config, fixture.tournamentId)
    const reloadRound = assertRepairedInventory(reloadInventory, `${caseName}/reload repair`)
    const reloadState = await readDatabaseState(reload.context, fixture)
    const reloadStandings = await collectTeamStandings(reload.context, config, fixture.tournamentId)
    expect(reloadStandings, `${caseName}/reload repair standings`).toEqual(beforeStandings)
    await assertVisibleRound(reload.page, preliminaryRound, DebateFormat.APF, expectedByMatch)
    for (const [matchId, expected] of expectedByMatch) {
      const scoreInputs = reload.page.locator(`input[aria-label*="match ${matchId}"]`)
      await expect(scoreInputs, `${caseName}/reload repair match-${matchId} score input count`).toHaveCount(expected.size)
      for (let index = 0; index < await scoreInputs.count(); index += 1) {
        await expect(scoreInputs.nth(index), `${caseName}/reload repair match-${matchId} score input ${index}`).toBeDisabled()
      }
    }
    const reloadScreenshot = await captureCheckpoint(reload.page, run, `${caseName}-setup-preliminary-repair-reload`)
    await selectPairingRound(reload.page, reloadInventory.stages, "preliminary", reloadRound)
    await expect(reload.page.getByRole("button", { name: "Proceed to next round", exact: true }), `${caseName}/preliminary proceed after repair`).toBeEnabled()

    await writeRunRecord(run, `${caseName}-setup-preliminary-repair`, {
      stage: "preliminary",
      round: { id: preliminaryRound.id, name: preliminaryRound.name, number: preliminaryRound.roundNumber },
      repairableMatchIds: repairableMatches.map((match) => match.id),
      expectedByMatch: Object.fromEntries([...expectedByMatch].map(([id, scores]) => [id, Object.fromEntries(scores)])),
      beforeState,
      afterState,
      reloadState,
      dbDelta: repairDelta,
      standings: { before: beforeStandings, after: afterStandings, reload: reloadStandings },
      teamAggregates: { before: expectedTeamAggregates, after: teamAggregateSnapshot(afterRound.matches), reload: teamAggregateSnapshot(reloadRound.matches) },
      mutation,
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
      expectedVoidMutationAborts,
    })
    recordMutationEvidence(caseName, {
      name: mutationName,
      kind: "ui-mutation",
      response: mutation,
      dbDelta: repairDelta,
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
      expectedVoidMutationAborts,
    })
    return { session: reload, inventory: reloadInventory }
  }

  const writeAllRounds = async (
    fixture: IntegrityFixture,
    stage: IntegrityStage,
    format: DebateFormat,
    caseName: string,
    standingsMode: "scores" | "unchanged",
  ) => {
    let session = await resetFresh(fixture, caseName)
    let inventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
    let stageSnapshot = findStage(inventory, stage)
    expect(stageSnapshot.format).toBe(format)

    const stageHasMatches = (candidate: typeof stageSnapshot) => candidate.rounds.some((round) => round.matches.length > 0)
    const activeRound = (candidate: typeof stageSnapshot) => {
      const roundNumber = candidate.currentRoundNumber ?? candidate.rounds.find((round) => round.matches.length > 0)?.roundNumber
      expect(roundNumber, `${caseName}/${candidate.stage} needs an active or populated round`).not.toBeNull()
      return findRound(candidate, roundNumber as number)
    }

    if (stage === "team" && !stageHasMatches(stageSnapshot)) {
      const preliminary = findStage(inventory, "preliminary")
      const preliminaryRound = activeRound(preliminary)
      const prepared = await submitCurrentRoundFromUI(
        session,
        fixture,
        "preliminary",
        preliminaryRound,
        preliminary.format,
        `${caseName}-setup-preliminary`,
        preliminaryRound.roundNumber,
        "scores",
      )
      session = prepared.session
      inventory = prepared.inventory
      const progressed = await proceedFromUI(session, fixture, "preliminary", preliminaryRound, inventory, `${caseName}-setup-preliminary`, "team", format)
      session = progressed.session
      inventory = progressed.inventory
      stageSnapshot = findStage(inventory, stage)
    }

    if (stage === "solo" && !stageHasMatches(stageSnapshot)) {
      let preliminary = findStage(inventory, "preliminary")
      let preliminaryRound = activeRound(preliminary)
      const repairableMatches = preliminaryRound.matches.filter((match) =>
        match.completed && match.participantScoresComplete === false && match.participantScoresRepairable === true,
      )
      if (repairableMatches.length > 0) {
        const repaired = await repairPreliminaryRoundForSoloSetup(session, fixture, inventory, preliminaryRound, repairableMatches, caseName)
        session = repaired.session
        inventory = repaired.inventory
        preliminary = findStage(inventory, "preliminary")
        preliminaryRound = activeRound(preliminary)
      }
      expect(preliminaryRound.matches.every((match) => match.completed), `${caseName}/preliminary must be complete before mixed bracket generation`).toBe(true)
      const beforeState = await readDatabaseState(session.context, fixture)
      await selectPairingRound(session.page, inventory.stages, "preliminary", preliminaryRound)
      const beforeScreenshot = await captureCheckpoint(session.page, run, `${caseName}-setup-brackets-before`)
      const responsePromise = session.page.waitForResponse((response) =>
        response.request().method() === "PATCH" && response.url().includes("/proceed"),
        { timeout: RESPONSE_TIMEOUT_MS },
      )
      const mutationName = `${caseName}/setup-brackets/ui-proceed`
      registerMutationOwner(session, caseName, mutationName)
      await expect(session.page.getByRole("button", { name: "Proceed to next round", exact: true })).toBeEnabled()
      await session.page.getByRole("button", { name: "Proceed to next round", exact: true }).click()
      const mutation = await readMutationResponse(await responsePromise)
      expect(mutation.status).toBe(200)
      const afterState = await readDatabaseState(session.context, fixture)
      const afterInventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
      expect(stageHasMatches(findStage(afterInventory, "team")) || stageHasMatches(findStage(afterInventory, "solo"))).toBe(true)
      const afterScreenshot = await captureCheckpoint(session.page, run, `${caseName}-setup-brackets-after`)
      const setupDelta = databaseDelta(beforeState, afterState)
      expect(setupDelta.changed).toBe(true)
      const terminalReconciliation = await closeSession(session)
      const expectedVoidMutationAborts = await requireOwnedMutationTerminal(session, caseName, mutationName, terminalReconciliation)
      const reload = await freshOrganizer(fixture)
      const reloadInventory = await collectTournamentInventory(reload.context, config, fixture.tournamentId)
      const reloadScreenshot = await captureCheckpoint(reload.page, run, `${caseName}-setup-brackets-reload`)
      await writeRunRecord(run, `${caseName}-setup-brackets`, {
        mutation,
        beforeState,
        afterState,
        reloadInventory,
        delta: setupDelta,
        screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
        expectedVoidMutationAborts,
      })
      recordMutationEvidence(caseName, {
        name: mutationName,
        kind: "ui-mutation",
        response: mutation,
        dbDelta: setupDelta,
        screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
        expectedVoidMutationAborts,
      })
      session = reload
      inventory = reloadInventory
      stageSnapshot = findStage(inventory, stage)
    }

    const finalRoundNumber = Math.max(...stageSnapshot.rounds.map((round) => round.roundNumber))
    const writtenRounds: Array<Record<string, unknown>> = []

    while (true) {
      inventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
      stageSnapshot = findStage(inventory, stage)
      const round = activeRound(stageSnapshot)
      expect(round.format).toBe(format)
      const result = await submitCurrentRoundFromUI(session, fixture, stage, round, format, caseName, round.roundNumber, standingsMode)
      session = result.session
      inventory = result.inventory
      writtenRounds.push({ round: round.name, number: round.roundNumber, matches: [...result.expectedByMatch.keys()] })
      if (round.roundNumber >= finalRoundNumber) break
      const advancement = await proceedFromUI(session, fixture, stage, round, inventory, caseName)
      session = advancement.session
    }

    inventory = await collectTournamentInventory(session.context, config, fixture.tournamentId)
    await writeRunRecord(run, `${caseName}-summary`, { fixture: fixture.fixtureId, tournament: fixture.tournamentId, stage, format, writtenRounds, inventory: stageRoundSummary(inventory) })
    return { session, inventory }
  }

  const directMutationWithReload = async (
    session: IntegritySession,
    fixture: IntegrityFixture,
    stage: IntegrityStage,
    format: DebateFormat,
    round: IntegrityRound,
    payload: MatchResultRequest[],
    caseName: string,
  ) => {
    await selectResultsRound(session.page, stage, format, round)
    const beforeState = await readDatabaseState(session.context, fixture)
    const beforeScreenshot = await captureCheckpoint(session.page, run, `${caseName}-before`)
    const mutation = await submitResultsDirect(session.context, config, fixture, findStage(await collectTournamentInventory(session.context, config, fixture.tournamentId), stage).id, round.id, payload)
    const afterState = await readDatabaseState(session.context, fixture)
    const afterScreenshot = await captureCheckpoint(session.page, run, `${caseName}-after`)
    await closeSession(session)
    const reload = await freshOrganizer(fixture)
    await selectResultsRound(reload.page, stage, format, round)
    const reloadState = await readDatabaseState(reload.context, fixture)
    const reloadScreenshot = await captureCheckpoint(reload.page, run, `${caseName}-reload`)
    const dbDelta = databaseDelta(beforeState, afterState)
    await writeRunRecord(run, caseName, { mutation, beforeState, afterState, reloadState, dbDelta, screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot } })
    recordMutationEvidence(caseName, {
      name: `${caseName}/direct-api-results`,
      kind: "direct-api",
      response: mutation,
      dbDelta,
      screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
    })
    return { session: reload, mutation, beforeState, afterState, reloadState }
  }

  type CaseAction = () => Promise<Record<string, unknown> | void>
  const caseActions = new Map<string, CaseAction>()
  const runCase = async (name: string, action: CaseAction) => {
    if (caseActions.has(name)) throw new Error(`Duplicate integrity case registration: ${name}`)
    caseActions.set(name, action)
  }

  try {
    await writeRunRecord(run, "ready-report", report)
    expect([...fixtureById.keys()].sort((a, b) => a - b)).toEqual([...FIXTURE_IDS])
    await writeRunRecord(run, "fixture-endpoints", fixtures)

    const checksumSession = track(await openOrganizerSession(browser, config, "api-only"))
    const checksums: Record<string, unknown> = {}
    for (const fixture of fixtures) {
      const state = await readDatabaseState(checksumSession.context, fixture)
      const inventory = await collectTournamentInventory(checksumSession.context, config, fixture.tournamentId)
      checksums[String(fixture.fixtureId)] = { tournamentId: fixture.tournamentId, stateHash: hashValue(state), inventoryHash: hashValue(inventory) }
    }
    await closeSession(checksumSession)
    await writeRunRecord(run, "fixture-checksums", checksums)

    const fixture = (id: number) => {
      const value = fixtureById.get(id)
      if (!value) throw new Error(`Fixture ${id} is not in the ready report.`)
      return value
    }

    await runCase("apf-preliminary-9101", async () => {
      const result = await writeAllRounds(fixture(9101), "preliminary", DebateFormat.APF, "apf-preliminary-9101", "scores")
      expect(findStage(result.inventory, "preliminary").format).toBe(DebateFormat.APF)
      await closeSession(result.session)
      return { fixture: 9101, stage: "preliminary", format: DebateFormat.APF }
    })

    await runCase("bpf-preliminary-9102", async () => {
      const result = await writeAllRounds(fixture(9102), "preliminary", DebateFormat.BPF, "bpf-preliminary-9102", "scores")
      expect(findStage(result.inventory, "preliminary").format).toBe(DebateFormat.BPF)
      await closeSession(result.session)
      return { fixture: 9102, stage: "preliminary", format: DebateFormat.BPF }
    })

    await runCase("apf-knockout-9101", async () => {
      const result = await writeAllRounds(fixture(9101), "team", DebateFormat.APF, "apf-knockout-9101", "unchanged")
      expect(findStage(result.inventory, "team").rounds.some((round) => round.name === "Final")).toBe(true)
      await closeSession(result.session)
      return { fixture: 9101, stage: "team", format: DebateFormat.APF, final: true }
    })

    await runCase("bpf-knockout-9102", async () => {
      const result = await writeAllRounds(fixture(9102), "team", DebateFormat.BPF, "bpf-knockout-9102", "unchanged")
      const final = findStage(result.inventory, "team").rounds.find((round) => round.name === "Final")
      expect(final).toBeDefined()
      for (const match of final!.matches) expect(match.teams).toHaveLength(4)
      await selectPairingRound(result.session.page, result.inventory.stages, "team", final!)
      for (const match of final!.matches) {
        for (const team of match.teams) await expect(result.session.page.getByText(team.name, { exact: true })).toBeVisible()
      }
      const pairingsScreenshot = await captureCheckpoint(result.session.page, run, "bpf-knockout-9102-final-pairings")
      await selectResultsRound(result.session.page, "team", DebateFormat.BPF, final!)
      for (const match of final!.matches) {
        for (const team of match.teams) await expect(result.session.page.getByText(team.name, { exact: true })).toBeVisible()
      }
      const resultsScreenshot = await captureCheckpoint(result.session.page, run, "bpf-knockout-9102-final-results")
      await writeRunRecord(run, "bpf-knockout-9102-final-visible", {
        final: final!.matches,
        screenshots: { pairings: pairingsScreenshot, results: resultsScreenshot },
      })
      await closeSession(result.session)
      return { fixture: 9102, stage: "team", format: DebateFormat.BPF, final: true, allFourVisible: true }
    })

    for (const fixtureId of [9103, 9105]) {
      await runCase(`ld-generated-rounds-${fixtureId}`, async () => {
        const result = await writeAllRounds(fixture(fixtureId), "solo", DebateFormat.LD, `ld-generated-rounds-${fixtureId}`, "unchanged")
        const solo = findStage(result.inventory, "solo")
        for (const round of solo.rounds) {
          for (const match of round.matches) expect(match.debaters).toHaveLength(2)
        }
        await closeSession(result.session)
        return { fixture: fixtureId, stage: "solo", format: DebateFormat.LD }
      })
    }

    await runCase("legacy-repair-9105", async () => {
      const fixtureValue = fixture(9105)
      const session = await resetFresh(fixtureValue, "legacy-repair-9105", "legacy-repair")
      const inventory = await collectTournamentInventory(session.context, config, fixtureValue.tournamentId)
      const preliminary = findStage(inventory, "preliminary")
      const round = preliminary.rounds[0]
      const target = round.matches.find((match) => match.completed)
      expect(target).toBeDefined()
      expect(target!.participantScoresComplete).toBe(false)
      expect(target!.participantScoresRepairable).toBe(true)
      expect(target!.teams.flatMap((team) => team.speakers.filter((speaker) => speaker.score !== null))).toHaveLength(0)
      const contradictory = buildContradictoryResult(target!, DebateFormat.APF)
      const beforeContradictory = await readDatabaseState(session.context, fixtureValue)
      await selectResultsRound(session.page, "preliminary", DebateFormat.APF, round)
      const beforeContradictoryScreenshot = await captureCheckpoint(session.page, run, "legacy-repair-9105-contradictory-before")
      const contradictoryResponse = await submitResultsDirect(session.context, config, fixtureValue, preliminary.id, round.id, [contradictory])
      const afterContradictoryScreenshot = await captureCheckpoint(session.page, run, "legacy-repair-9105-contradictory-after")
      expect(contradictoryResponse.status).toBeGreaterThanOrEqual(400)
      expect(contradictoryResponse.status).toBeLessThan(500)
      const afterContradictory = await readDatabaseState(session.context, fixtureValue)
      expect(databaseDelta(beforeContradictory, afterContradictory).changed).toBe(false)
      await writeRunRecord(run, "legacy-repair-9105-contradictory", {
        mutation: contradictoryResponse,
        before: beforeContradictory,
        after: afterContradictory,
        delta: databaseDelta(beforeContradictory, afterContradictory),
        screenshots: { before: beforeContradictoryScreenshot, after: afterContradictoryScreenshot },
      })
      recordMutationEvidence("legacy-repair-9105", {
        name: "legacy-repair-9105/contradictory/direct-api-rejection",
        kind: "direct-api",
        response: contradictoryResponse,
        dbDelta: databaseDelta(beforeContradictory, afterContradictory),
        screenshots: { before: beforeContradictoryScreenshot, after: afterContradictoryScreenshot },
      })

      await selectResultsRound(session.page, "preliminary", DebateFormat.APF, round)
      const beforeValid = await readDatabaseState(session.context, fixtureValue)
      const beforeStandings = await collectTeamStandings(session.context, config, fixtureValue.tournamentId)
      const beforeScreenshot = await captureCheckpoint(session.page, run, "legacy-repair-9105-valid-before")
      const expected = await fillRepairableMatch(session.page, target!)
      const submitPromise = session.page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes("/matches/results"), { timeout: RESPONSE_TIMEOUT_MS })
      const mutationName = "legacy-repair-9105/repair/ui-submit-results"
      registerMutationOwner(session, "legacy-repair-9105", mutationName)
      await session.page.getByRole("button", { name: "Submit results", exact: true }).click()
      const validResponse = await readMutationResponse(await submitPromise)
      expect(validResponse.status).toBe(200)
      const afterValid = await readDatabaseState(session.context, fixtureValue)
      const afterStandings = await collectTeamStandings(session.context, config, fixtureValue.tournamentId)
      expect(databaseDelta(beforeValid, afterValid).changed).toBe(true)
      expect(afterStandings).toEqual(beforeStandings)
      const afterScreenshot = await captureCheckpoint(session.page, run, "legacy-repair-9105-valid-after")
      const validPayload = buildValidResult(target!, DebateFormat.APF, 0)
      const secondBefore = await readDatabaseState(session.context, fixtureValue)
      const secondBeforeScreenshot = await captureCheckpoint(session.page, run, "legacy-repair-9105-idempotent-before")
      const secondResponse = await submitResultsDirect(session.context, config, fixtureValue, preliminary.id, round.id, [validPayload])
      const secondAfterScreenshot = await captureCheckpoint(session.page, run, "legacy-repair-9105-idempotent-after")
      expect(secondResponse.status).toBeGreaterThanOrEqual(400)
      expect(secondResponse.status).toBeLessThan(500)
      const secondAfter = await readDatabaseState(session.context, fixtureValue)
      expect(databaseDelta(secondBefore, secondAfter).changed).toBe(false)
      await writeRunRecord(run, "legacy-repair-9105-idempotent", {
        mutation: secondResponse,
        before: secondBefore,
        after: secondAfter,
        delta: databaseDelta(secondBefore, secondAfter),
        screenshots: { before: secondBeforeScreenshot, after: secondAfterScreenshot },
      })
      recordMutationEvidence("legacy-repair-9105", {
        name: "legacy-repair-9105/idempotent/direct-api-rejection",
        kind: "direct-api",
        response: secondResponse,
        dbDelta: databaseDelta(secondBefore, secondAfter),
        screenshots: { before: secondBeforeScreenshot, after: secondAfterScreenshot },
      })
      const terminalReconciliation = await closeSession(session)
      const expectedVoidMutationAborts = await requireOwnedMutationTerminal(session, "legacy-repair-9105", mutationName, terminalReconciliation)
      const reload = await freshOrganizer(fixtureValue)
      await selectResultsRound(reload.page, "preliminary", DebateFormat.APF, round)
      const reloadInventory = await collectTournamentInventory(reload.context, config, fixtureValue.tournamentId)
      const repaired = findStage(reloadInventory, "preliminary").rounds[0].matches.find((match) => match.id === target!.id)
      expect(repaired?.participantScoresComplete).toBe(true)
      expect(repaired?.participantScoresRepairable).toBe(false)
      await assertVisibleRound(reload.page, round, DebateFormat.APF, new Map([[target!.id, expected]]))
      const repairedScoreInputs = reload.page.locator(`input[aria-label*="match ${target!.id}"]`)
      await expect(repairedScoreInputs).toHaveCount(expected.size)
      for (let index = 0; index < await repairedScoreInputs.count(); index += 1) {
        await expect(repairedScoreInputs.nth(index)).toBeDisabled()
      }
      const reloadScreenshot = await captureCheckpoint(reload.page, run, "legacy-repair-9105-valid-reload")
      await writeRunRecord(run, "legacy-repair-9105-valid", { target: target!.id, expected: Object.fromEntries(expected), mutation: validResponse, secondMutation: secondResponse, before: beforeValid, after: afterValid, beforeStandings, afterStandings, screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot }, expectedVoidMutationAborts })
      recordMutationEvidence("legacy-repair-9105", {
        name: mutationName,
        kind: "ui-mutation",
        response: validResponse,
        dbDelta: databaseDelta(beforeValid, afterValid),
        screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
        expectedVoidMutationAborts,
      })
      await closeSession(reload)
      return { fixture: 9105, target: target!.id, firstStatus: validResponse.status, secondStatus: secondResponse.status }
    })

    await runCase("partial-row-nonrepairable-9105", async () => {
      const fixtureValue = fixture(9105)
      const session = await resetFresh(fixtureValue, "partial-row-nonrepairable-9105", "partial-row-nonrepairable")
      const inventory = await collectTournamentInventory(session.context, config, fixtureValue.tournamentId)
      const preliminary = findStage(inventory, "preliminary")
      const round = preliminary.rounds[0]
      const target = round.matches.find((match) => match.completed && match.participantScoresComplete === false && match.participantScoresRepairable === false)
      expect(target).toBeDefined()
      const participantRows = target!.teams.flatMap((team) => team.speakers)
      const scoredRows = participantRows.filter((speaker) => speaker.score !== null)
      expect(scoredRows.length).toBeGreaterThan(0)
      expect(scoredRows.length).toBeLessThan(participantRows.length)

      await selectResultsRound(session.page, "preliminary", DebateFormat.APF, round)
      await expect(session.page.getByText("Needs correction (not repairable)", { exact: true }).first()).toBeVisible()
      const inputs = session.page.locator(`input[aria-label*="match ${target!.id}"]`)
      expect(await inputs.count()).toBeGreaterThan(0)
      for (let index = 0; index < await inputs.count(); index += 1) await expect(inputs.nth(index)).toBeDisabled()
      await expect(session.page.getByRole("button", { name: "Submit results", exact: true })).toBeDisabled()

      const before = await readDatabaseState(session.context, fixtureValue)
      const beforeScreenshot = await captureCheckpoint(session.page, run, "partial-row-nonrepairable-9105-before")
      const after = await readDatabaseState(session.context, fixtureValue)
      const afterScreenshot = await captureCheckpoint(session.page, run, "partial-row-nonrepairable-9105-after")
      expect(databaseDelta(before, after).changed).toBe(false)
      await writeRunRecord(run, "partial-row-nonrepairable-9105-evidence", {
        target: target!.id,
        before,
        after,
        delta: databaseDelta(before, after),
        screenshots: { before: beforeScreenshot, after: afterScreenshot },
      })
      recordMutationEvidence("partial-row-nonrepairable-9105", {
        name: "partial-row-nonrepairable-9105/read-only-ui-observation",
        kind: "ui-observation",
        response: null,
        dbDelta: databaseDelta(before, after),
        screenshots: { before: beforeScreenshot, after: afterScreenshot },
      })
      await closeSession(session)
      return { fixture: 9105, target: target!.id, participantRows: participantRows.length, scoredRows: scoredRows.length }
    })

    await runCase("progression-gating-9101", async () => {
      const fixtureValue = fixture(9101)
      let session = await resetFresh(fixtureValue, "progression-gating-9101")
      let inventory = await collectTournamentInventory(session.context, config, fixtureValue.tournamentId)
      let preliminary = findStage(inventory, "preliminary")
      const round = findRound(preliminary, preliminary.currentRoundNumber as number)
      await selectPairingRound(session.page, inventory.stages, "preliminary", round)
      const before = await readDatabaseState(session.context, fixtureValue)
      const beforeScreenshot = await captureCheckpoint(session.page, run, "progression-gating-9101-before-completion")
      await expect(session.page.getByRole("button", { name: "Proceed to next round", exact: true })).toBeDisabled()
      const rejected = await proceedDirect(session.context, config, fixtureValue, preliminary.id)
      expect(rejected.status).toBeGreaterThanOrEqual(400)
      expect(rejected.status).toBeLessThan(500)
      const afterRejected = await readDatabaseState(session.context, fixtureValue)
      expect(databaseDelta(before, afterRejected).changed).toBe(false)
      const afterRejectedScreenshot = await captureCheckpoint(session.page, run, "progression-gating-9101-after-reject")
      const result = await submitCurrentRoundFromUI(session, fixtureValue, "preliminary", round, DebateFormat.APF, "progression-gating-9101", 1, "scores")
      session = result.session
      inventory = await collectTournamentInventory(session.context, config, fixtureValue.tournamentId)
      preliminary = findStage(inventory, "preliminary")
      const progressed = await proceedFromUI(session, fixtureValue, "preliminary", round, inventory, "progression-gating-9101", "team", DebateFormat.APF)
      session = progressed.session
      const generatedTeamStage = findStage(progressed.inventory, "team")
      const generatedSemifinal = generatedTeamStage.rounds.find((candidate) => candidate.name === "Semifinal")
      expect(generatedSemifinal, "progression-gating-9101 generated Team elimination Semifinal").toBeDefined()
      const generatedIds = generatedSemifinal!.matches.map((match) => match.id)
      const repeatBefore = await readDatabaseState(session.context, fixtureValue)
      const repeated = await proceedDirect(session.context, config, fixtureValue, preliminary.id)
      expect([200, 400, 409]).toContain(repeated.status)
      const repeatAfter = await readDatabaseState(session.context, fixtureValue)
      const repeatInventory = await collectTournamentInventory(session.context, config, fixtureValue.tournamentId)
      const repeatedTeamStage = findStage(repeatInventory, "team")
      const repeatedSemifinal = repeatedTeamStage.rounds.find((candidate) => candidate.name === "Semifinal")
      expect(repeatedSemifinal, "progression-gating-9101 repeated Team elimination Semifinal").toBeDefined()
      const repeatedIds = repeatedSemifinal!.matches.map((match) => match.id)
      const generatedMatchIdentities = matchIdentities(generatedSemifinal!.matches)
      const repeatedMatchIdentities = matchIdentities(repeatedSemifinal!.matches)
      const generatedUniqueIds = [...new Set(generatedIds)].sort((left, right) => left - right)
      const repeatedUniqueIds = [...new Set(repeatedIds)].sort((left, right) => left - right)
      const repeatDbDelta = databaseDelta(repeatBefore, repeatAfter)
      const repeatScreenshot = await captureCheckpoint(session.page, run, "progression-gating-9101-repeat-reload")
      await writeRunRecord(run, "progression-gating-9101-summary", {
        rejected,
        repeated,
        repeatStatus: repeated.status,
        screenshots: { before: beforeScreenshot, afterReject: afterRejectedScreenshot, repeat: repeatScreenshot },
        generatedIds,
        repeatedIds,
        generatedUniqueIds,
        repeatedUniqueIds,
        generatedUniqueIdCount: generatedUniqueIds.length,
        repeatedUniqueIdCount: repeatedUniqueIds.length,
        generatedMatchIdentities,
        repeatedMatchIdentities,
        repeatDbDelta,
      })
      expect(repeatDbDelta.changed, "progression-gating-9101 repeated progression DB delta").toBe(false)
      expect(generatedUniqueIds.length, "progression-gating-9101 generated unique ID count").toBe(generatedIds.length)
      expect(repeatedUniqueIds.length, "progression-gating-9101 repeated unique ID count").toBe(repeatedIds.length)
      expect(repeatedUniqueIds.length, "progression-gating-9101 repeated/generated unique ID count").toBe(generatedUniqueIds.length)
      expect(repeatedMatchIdentities, "progression-gating-9101 repeated match/team identities").toEqual(generatedMatchIdentities)
      await closeSession(session)
      return { fixture: 9101, rejected: rejected.status, firstProgression: 200, repeated: repeated.status, duplicateIds: false }
    })

    await runCase("invalid-ballots-9101", async () => {
      const variants: Array<{ name: string; build: (match: IntegrityMatch, round: IntegrityRound, inventory: IntegrityInventory) => MatchResultRequest[] }> = [
        {
          name: "duplicate-participant",
          build: (match) => {
            const valid = buildValidResult(match, DebateFormat.APF, 2)
            const first = valid.teamResults![0].participantScores![0]
            return [{ ...valid, teamResults: valid.teamResults!.map((team, index) => index === 0 ? { ...team, participantScores: [first, first] } : team) }]
          },
        },
        {
          name: "missing-participant",
          build: (match) => {
            const valid = buildValidResult(match, DebateFormat.APF, 2)
            return [{ ...valid, teamResults: valid.teamResults!.map((team, index) => index === 0 ? { ...team, participantScores: team.participantScores!.slice(0, -1) } : team) }]
          },
        },
        {
          name: "foreign-participant",
          build: (match, round) => {
            const valid = buildValidResult(match, DebateFormat.APF, 2)
            const otherMatch = round.matches.find((candidate) => candidate.id !== match.id)
            if (!otherMatch) throw new Error("Fixture 9101 needs another Preliminary match for the foreign-participant ballot.")
            const foreignParticipant = otherMatch.teams.flatMap((team) => team.speakers)[0]
            if (!foreignParticipant) throw new Error("The other Preliminary match has no participant for the foreign-participant ballot.")
            const matchParticipantIds = new Set(match.teams.flatMap((team) => team.speakers.map((speaker) => speaker.id)))
            if (matchParticipantIds.has(foreignParticipant.id)) throw new Error("Foreign participant ballot selected a participant from the source match.")
            return [{ ...valid, teamResults: valid.teamResults!.map((team, index) => index === 0 ? { ...team, participantScores: team.participantScores!.map((score, scoreIndex) => scoreIndex === 0 ? { ...score, participantId: foreignParticipant.id } : score) } : team) }]
          },
        },
        {
          name: "negative-score",
          build: (match) => {
            const valid = buildValidResult(match, DebateFormat.APF, 2)
            return [{ ...valid, teamResults: valid.teamResults!.map((team, index) => index === 0 ? { ...team, participantScores: team.participantScores!.map((score, scoreIndex) => scoreIndex === 0 ? { ...score, score: -1 } : score) } : team) }]
          },
        },
        {
          name: "wrong-winner-count",
          build: (match) => [buildContradictoryResult(match, DebateFormat.APF)],
        },
      ]
      const outcomes: Array<Record<string, unknown>> = []
      expect(variants).toHaveLength(5)
      for (const variant of variants) {
        let session = await resetFresh(fixture(9101), `invalid-ballots-9101-${variant.name}`, undefined, "invalid-ballots-9101")
        const inventory = await collectTournamentInventory(session.context, config, fixture(9101).tournamentId)
        const preliminary = findStage(inventory, "preliminary")
        const round = findRound(preliminary, preliminary.currentRoundNumber as number)
        const match = round.matches.find((candidate) => !candidate.completed)
        expect(match).toBeDefined()
        const payload = variant.build(match!, round, inventory)
        const direct = await directMutationWithReload(session, fixture(9101), "preliminary", DebateFormat.APF, round, payload, `invalid-ballots-9101-${variant.name}`)
        session = direct.session
        expect(direct.mutation.status).toBeGreaterThanOrEqual(400)
        expect(direct.mutation.status).toBeLessThan(500)
        expect(direct.mutation.ok).toBe(false)
        expect(databaseDelta(direct.beforeState, direct.afterState).changed).toBe(false)
        const afterInventory = await collectTournamentInventory(session.context, config, fixture(9101).tournamentId)
        expect(matchAt(afterInventory, "preliminary", round, match!.id).completed).toBe(false)
        outcomes.push({ name: variant.name, status: direct.mutation.status })
        await closeSession(session)
      }

      const fixtureValue = fixture(9101)
      const crossRoundCaseName = "invalid-ballots-9101-cross-round-match"
      let session = await resetFresh(fixtureValue, crossRoundCaseName, undefined, "invalid-ballots-9101")
      const initialInventory = await collectTournamentInventory(session.context, config, fixtureValue.tournamentId)
      const initialPreliminary = findStage(initialInventory, "preliminary")
      expect(initialPreliminary.currentRoundNumber, `${crossRoundCaseName} initial Preliminary current round`).not.toBeNull()
      const initialRound = findRound(initialPreliminary, initialPreliminary.currentRoundNumber as number)
      const setup = await submitCurrentRoundFromUI(
        session,
        fixtureValue,
        "preliminary",
        initialRound,
        DebateFormat.APF,
        `${crossRoundCaseName}-setup`,
        initialRound.roundNumber,
        "scores",
      )
      session = setup.session
      const progressed = await proceedFromUI(
        session,
        fixtureValue,
        "preliminary",
        initialRound,
        setup.inventory,
        `${crossRoundCaseName}-setup`,
        "team",
        DebateFormat.APF,
      )
      session = progressed.session
      const setupInventory = progressed.inventory
      const setupPreliminary = findStage(setupInventory, "preliminary")
      const endpointRound = findRound(setupPreliminary, initialRound.roundNumber)
      const setupTeam = findStage(setupInventory, "team")
      const generatedSemifinal = setupTeam.rounds.find((candidate) =>
        candidate.name === "Semifinal" && candidate.roundNumber === setupTeam.currentRoundNumber,
      )
      expect(generatedSemifinal, `${crossRoundCaseName} generated current Team Semifinal`).toBeDefined()
      expect(generatedSemifinal!.matches.length, `${crossRoundCaseName} generated Semifinal match count`).toBeGreaterThan(0)
      const payloadMatch = generatedSemifinal!.matches[0]
      const payload = buildValidResult(payloadMatch, DebateFormat.APF, payloadMatch.id, "team")
      const payloadMatchEvidence = {
        id: payloadMatch.id,
        teamIds: payloadMatch.teams.map((team) => team.id),
        participantIds: payloadMatch.teams.flatMap((team) => team.speakers.map((speaker) => speaker.id)),
      }
      const setupEvidence = {
        sourceStage: "preliminary",
        targetStage: "team",
        preliminary: {
          stageId: setupPreliminary.id,
          roundId: endpointRound.id,
          roundName: endpointRound.name,
          roundNumber: endpointRound.roundNumber,
          matchIds: endpointRound.matches.map((match) => match.id),
        },
        semifinal: {
          stageId: setupTeam.id,
          roundId: generatedSemifinal!.id,
          roundName: generatedSemifinal!.name,
          roundNumber: generatedSemifinal!.roundNumber,
          matchIds: generatedSemifinal!.matches.map((match) => match.id),
        },
        generatedMatches: generatedSemifinal!.matches,
        payloadMatch: payloadMatchEvidence,
        expectedByMatch: Object.fromEntries([...setup.expectedByMatch].map(([id, scores]) => [id, Object.fromEntries(scores)])),
      }
      await writeRunRecord(run, `${crossRoundCaseName}-setup-summary`, setupEvidence)

      const beforeState = await readDatabaseState(session.context, fixtureValue)
      const beforeHash = hashValue(beforeState)
      const beforeScreenshot = await captureCheckpoint(session.page, run, `${crossRoundCaseName}-before`)
      const mutation = await submitResultsDirect(session.context, config, fixtureValue, setupPreliminary.id, endpointRound.id, [payload])
      const afterState = await readDatabaseState(session.context, fixtureValue)
      const afterHash = hashValue(afterState)
      const afterScreenshot = await captureCheckpoint(session.page, run, `${crossRoundCaseName}-after`)
      const dbDelta = databaseDelta(beforeState, afterState)
      await closeSession(session)

      let reload: IntegritySession | null = null
      try {
        reload = await freshOrganizer(fixtureValue)
        const reloadState = await readDatabaseState(reload.context, fixtureValue)
        const reloadHash = hashValue(reloadState)
        const reloadInventory = await collectTournamentInventory(reload.context, config, fixtureValue.tournamentId)
        const reloadPreliminary = findStage(reloadInventory, "preliminary")
        const reloadEndpointRound = reloadPreliminary.rounds.find((candidate) => candidate.id === endpointRound.id)
        const reloadTeam = findStage(reloadInventory, "team")
        const reloadSemifinal = reloadTeam.rounds.find((candidate) => candidate.id === generatedSemifinal!.id)
        const reloadPayloadMatch = reloadSemifinal?.matches.find((match) => match.id === payloadMatch.id)
        const reloadScreenshot = await captureCheckpoint(reload.page, run, `${crossRoundCaseName}-reload`)
        const reloadDbDelta = databaseDelta(beforeState, reloadState)

        await writeRunRecord(run, `${crossRoundCaseName}-evidence`, {
          setup: setupEvidence,
          endpointRound: {
            stage: "preliminary",
            groupId: setupPreliminary.id,
            roundId: endpointRound.id,
            roundName: endpointRound.name,
            roundNumber: endpointRound.roundNumber,
          },
          preliminaryMatchIds: endpointRound.matches.map((match) => match.id),
          semifinalRound: {
            stage: "team",
            groupId: setupTeam.id,
            roundId: generatedSemifinal!.id,
            roundName: generatedSemifinal!.name,
            roundNumber: generatedSemifinal!.roundNumber,
            matchIds: generatedSemifinal!.matches.map((match) => match.id),
          },
          payloadMatch: payloadMatchEvidence,
          payload,
          reloadPayloadMatchId: reloadPayloadMatch?.id ?? null,
          rejection: { status: mutation.status, body: mutation.responseBody },
          mutation,
          database: {
            beforeHash,
            afterHash,
            reloadHash,
            changed: dbDelta.changed,
            reloadChanged: reloadDbDelta.changed,
            dbDelta,
            reloadDbDelta,
          },
          screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
        })
        recordMutationEvidence("invalid-ballots-9101", {
          name: `${crossRoundCaseName}/direct-api-results`,
          kind: "direct-api",
          response: mutation,
          dbDelta,
          screenshots: { before: beforeScreenshot, after: afterScreenshot, reload: reloadScreenshot },
        })

        expect(mutation.status, `${crossRoundCaseName} rejection status`).toBeGreaterThanOrEqual(400)
        expect(mutation.status, `${crossRoundCaseName} rejection status`).toBeLessThan(500)
        expect(mutation.ok, `${crossRoundCaseName} rejection response`).toBe(false)
        expect(dbDelta.changed, `${crossRoundCaseName} before/after DB delta`).toBe(false)
        expect(reloadDbDelta.changed, `${crossRoundCaseName} before/reload DB delta`).toBe(false)
        expect(afterHash, `${crossRoundCaseName} after DB hash`).toBe(beforeHash)
        expect(reloadHash, `${crossRoundCaseName} reload DB hash`).toBe(beforeHash)
        expect(reloadPreliminary.currentRoundNumber, `${crossRoundCaseName} Preliminary current round after reload`).toBe(setupPreliminary.currentRoundNumber)
        expect(reloadEndpointRound, `${crossRoundCaseName} Preliminary endpoint round after reload`).toBeDefined()
        expect(reloadEndpointRound, `${crossRoundCaseName} Preliminary round unchanged after reload`).toEqual(endpointRound)
        expect(reloadSemifinal, `${crossRoundCaseName} Semifinal after reload`).toBeDefined()
        expect(reloadSemifinal!.matches.every((match) => match.completed === false), `${crossRoundCaseName} Semifinal remains incomplete`).toBe(true)
        expect(reloadSemifinal!.matches.flatMap((match) => match.teams.flatMap((team) => team.speakers.map((speaker) => speaker.score))).every((score) => score === null), `${crossRoundCaseName} Semifinal has no participant scores`).toBe(true)
        expect(reloadSemifinal!.matches.every((match) => match.teams.every((team) => team.score === null && team.won === null)), `${crossRoundCaseName} Semifinal has no team scores or winners`).toBe(true)
        expect(reloadPayloadMatch, `${crossRoundCaseName} payload match after reload`).toBeDefined()
        expect(reloadPayloadMatch!.id).toBe(payloadMatch.id)

        await selectResultsRound(reload.page, "preliminary", DebateFormat.APF, reloadEndpointRound!)
        await assertVisibleRound(reload.page, reloadEndpointRound!, DebateFormat.APF, setup.expectedByMatch)
        await selectPairingRound(reload.page, reloadInventory.stages, "team", reloadSemifinal!)
        const reloadAssertionScreenshot = await captureCheckpoint(reload.page, run, `${crossRoundCaseName}-reload-assertions`)
        await writeRunRecord(run, `${crossRoundCaseName}-reload-assertions`, {
          preliminaryRoundId: reloadEndpointRound!.id,
          semifinalRoundId: reloadSemifinal!.id,
          payloadMatchId: reloadPayloadMatch!.id,
          screenshot: reloadAssertionScreenshot,
        })
        outcomes.push({ name: crossRoundCaseName, status: mutation.status, endpointRoundId: endpointRound.id, payloadMatchId: payloadMatch.id })
      } finally {
        if (reload) await closeSession(reload)
      }
      return { fixture: 9101, outcomes }
    })

    await runCase("invalid-missing-winner-9103", async () => {
      let session = await resetFresh(fixture(9103), "invalid-missing-winner-9103")
      const inventory = await collectTournamentInventory(session.context, config, fixture(9103).tournamentId)
      const solo = findStage(inventory, "solo")
      const round = findRound(solo, solo.currentRoundNumber as number)
      const match = round.matches.find((candidate) => !candidate.completed)
      expect(match).toBeDefined()
      const missingWinner: MatchResultRequest[] = [{ matchId: match!.id }]
      const result = await directMutationWithReload(session, fixture(9103), "solo", DebateFormat.LD, round, missingWinner, "invalid-missing-winner-9103")
      session = result.session
      expect(result.mutation.status).toBeGreaterThanOrEqual(400)
      expect(result.mutation.status).toBeLessThan(500)
      expect(databaseDelta(result.beforeState, result.afterState).changed).toBe(false)
      const after = await collectTournamentInventory(session.context, config, fixture(9103).tournamentId)
      expect(matchAt(after, "solo", round, match!.id).completed).toBe(false)
      await closeSession(session)
      return { fixture: 9103, status: result.mutation.status }
    })

    await runCase("privacy-and-authorization-9102", async () => {
      assertPrivacyStructuralContract()
      const fixtureValue = fixture(9102)
      const result = await writeAllRounds(fixtureValue, "preliminary", DebateFormat.BPF, "privacy-and-authorization-9102", "scores")
      const organizer = result.session
      const inventory = await collectTournamentInventory(organizer.context, config, fixtureValue.tournamentId)
      const preliminary = findStage(inventory, "preliminary")
      const round = preliminary.rounds[0]
      const target = round.matches[0]
      const expected = buildValidExpectedPoints(target, round.roundNumber + target.id)
      const rawOrganizerEvidence = await collectRawMatchEvidence(organizer.context, config, fixtureValue.tournamentId, preliminary.id, round.id, target.id)
      expect(rawOrganizerEvidence.value).toBeDefined()
      const rawText = JSON.stringify(rawOrganizerEvidence.value)
      for (const score of expected.values()) expect(rawText).toContain(String(score))

      const anonymous = track(await openAnonymousSession(browser, config, `/tournament/${fixtureValue.tournamentId}`))
      const anonymousRawEvidence = await collectRawMatchEvidence(anonymous.context, config, fixtureValue.tournamentId, preliminary.id, round.id, target.id)
      expect(anonymousRawEvidence.value).toBeDefined()
      const anonymousAudit = auditPrivacyStructure(anonymousRawEvidence.value)

      const debater = track(await openDebaterSession(browser, config, `/tournament/${fixtureValue.tournamentId}`))
      const debaterRawEvidence = await collectRawMatchEvidence(debater.context, config, fixtureValue.tournamentId, preliminary.id, round.id, target.id)
      expect(debaterRawEvidence.value).toBeDefined()
      const debaterAudit = auditPrivacyStructure(debaterRawEvidence.value)
      await writeRunRecord(run, "privacy-and-authorization-9102-api-privacy", {
        anonymous: {
          rawStatus: anonymousRawEvidence.status,
          rawBodyHash: anonymousRawEvidence.bodyHash,
          sanitizedPropertyPaths: anonymousAudit.sanitizedPropertyPaths,
          forbiddenNonNullPaths: anonymousAudit.forbiddenNonNullPaths,
          allowedMetadataFlags: anonymousAudit.allowedMetadataFlags,
        },
        debater: {
          rawStatus: debaterRawEvidence.status,
          rawBodyHash: debaterRawEvidence.bodyHash,
          sanitizedPropertyPaths: debaterAudit.sanitizedPropertyPaths,
          forbiddenNonNullPaths: debaterAudit.forbiddenNonNullPaths,
          allowedMetadataFlags: debaterAudit.allowedMetadataFlags,
        },
      })
      expect(anonymousAudit.forbiddenNonNullPaths, "privacy-and-authorization-9102 anonymous raw privacy paths").toEqual([])
      expect(debaterAudit.forbiddenNonNullPaths, "privacy-and-authorization-9102 debater raw privacy paths").toEqual([])

      await selectResultsRound(organizer.page, "preliminary", DebateFormat.BPF, round)
      const organizerVisible = await visibleMatchScores(organizer.page, target.id)
      expect(organizerVisible.map((entry) => Number(entry.value)).sort((a, b) => a - b)).toEqual([...expected.values()].sort((a, b) => a - b))

      await gotoTournament(anonymous, fixtureValue.tournamentId, "anonymous")
      const anonymousPublicSurface = await assertPublicResultsSurface(anonymous)
      const anonymousPublicSurfaceScreenshot = await captureCheckpoint(anonymous.page, run, "privacy-and-authorization-9102-anonymous-public-surface")
      await writeRunRecord(run, "privacy-and-authorization-9102-anonymous-public-surface", {
        ...anonymousPublicSurface,
        screenshot: anonymousPublicSurfaceScreenshot,
      })

      await gotoTournament(debater, fixtureValue.tournamentId)
      const debaterPublicSurface = await assertPublicResultsSurface(debater)
      const debaterPublicSurfaceScreenshot = await captureCheckpoint(debater.page, run, "privacy-and-authorization-9102-debater-public-surface")
      await writeRunRecord(run, "privacy-and-authorization-9102-debater-public-surface", {
        ...debaterPublicSurface,
        screenshot: debaterPublicSurfaceScreenshot,
      })

      const beforeUnauthorized = await readDatabaseState(organizer.context, fixtureValue)
      const beforeUnauthorizedScreenshot = await captureCheckpoint(anonymous.page, run, "privacy-and-authorization-9102-unauthorized-before")
      const unauthorized = await submitResultsDirect(anonymous.context, config, fixtureValue, preliminary.id, round.id, [buildValidResult(target, DebateFormat.BPF, 9)])
      const afterUnauthorizedScreenshot = await captureCheckpoint(anonymous.page, run, "privacy-and-authorization-9102-unauthorized-after")
      const afterUnauthorized = await readDatabaseState(organizer.context, fixtureValue)
      const unauthorizedDelta = databaseDelta(beforeUnauthorized, afterUnauthorized)
      const unauthorizedEvidence = {
        method: unauthorized.method,
        path: unauthorized.url,
        status: unauthorized.status,
        ok: unauthorized.ok,
        bodyHash: hashValue(unauthorized.responseBody),
      }
      const expectedScoreHash = hashValue([...expected.entries()].sort(([left], [right]) => left - right))
      const organizerScoreHash = hashValue(organizerVisible.map((entry) => Number(entry.value)).sort((left, right) => left - right))

      await closeSession(anonymous)
      await closeSession(debater)
      await closeSession(organizer)
      const organizerReload = await freshOrganizer(fixtureValue)
      let organizerReloadScreenshot: string | null = null
      let organizerReloadScoreHash: string | null = null
      try {
        const reloadInventory = await collectTournamentInventory(organizerReload.context, config, fixtureValue.tournamentId)
        const reloadPreliminary = findStage(reloadInventory, "preliminary")
        const reloadRound = findRound(reloadPreliminary, round.roundNumber)
        await selectResultsRound(organizerReload.page, "preliminary", DebateFormat.BPF, reloadRound)
        const organizerReloadVisible = await visibleMatchScores(organizerReload.page, target.id)
        organizerReloadScoreHash = hashValue(organizerReloadVisible.map((entry) => Number(entry.value)).sort((left, right) => left - right))
        expect(organizerReloadVisible.map((entry) => Number(entry.value)).sort((a, b) => a - b)).toEqual([...expected.values()].sort((a, b) => a - b))
        organizerReloadScreenshot = await captureCheckpoint(organizerReload.page, run, "privacy-and-authorization-9102-organizer-reload")
      } finally {
        await closeSession(organizerReload)
      }

      await writeRunRecord(run, "privacy-and-authorization-9102-evidence", {
        organizer: {
          rawStatus: rawOrganizerEvidence.status,
          rawBodyHash: rawOrganizerEvidence.bodyHash,
          expectedScoreCount: expected.size,
          expectedScoreHash,
          visibleScoreHash: organizerScoreHash,
          exactResultVisible: true,
        },
        anonymous: {
          rawStatus: anonymousRawEvidence.status,
          rawBodyHash: anonymousRawEvidence.bodyHash,
          sanitizedPropertyPaths: anonymousAudit.sanitizedPropertyPaths,
          forbiddenNonNullPaths: anonymousAudit.forbiddenNonNullPaths,
          allowedMetadataFlags: anonymousAudit.allowedMetadataFlags,
          publicSurface: anonymousPublicSurface,
          screenshot: anonymousPublicSurfaceScreenshot,
        },
        debater: {
          rawStatus: debaterRawEvidence.status,
          rawBodyHash: debaterRawEvidence.bodyHash,
          sanitizedPropertyPaths: debaterAudit.sanitizedPropertyPaths,
          forbiddenNonNullPaths: debaterAudit.forbiddenNonNullPaths,
          allowedMetadataFlags: debaterAudit.allowedMetadataFlags,
          publicSurface: debaterPublicSurface,
          screenshot: debaterPublicSurfaceScreenshot,
        },
        unauthorized: unauthorizedEvidence,
        database: {
          beforeHash: unauthorizedDelta.beforeHash,
          afterHash: unauthorizedDelta.afterHash,
          changed: unauthorizedDelta.changed,
        },
        organizerReload: {
          scoreHash: organizerReloadScoreHash,
          screenshot: organizerReloadScreenshot,
          exactResultVisible: true,
        },
        screenshots: { before: beforeUnauthorizedScreenshot, after: afterUnauthorizedScreenshot },
      })
      recordMutationEvidence("privacy-and-authorization-9102", {
        name: "privacy-and-authorization-9102/anonymous/direct-api-rejection",
        kind: "direct-api",
        response: unauthorizedEvidence,
        dbDelta: unauthorizedDelta,
        screenshots: { before: beforeUnauthorizedScreenshot, after: afterUnauthorizedScreenshot },
      })

      expect([401, 403], "privacy-and-authorization-9102 anonymous submit rejection").toContain(unauthorized.status)
      expect(unauthorizedDelta.changed, "privacy-and-authorization-9102 unauthorized DB delta").toBe(false)
      return { fixture: 9102, anonymousStatus: unauthorized.status, organizerExact: true }
    })

    await runCase("mixed-and-no-ld-contract", async () => {
      const noLdFixture = fixture(9104)
      const noLd = await resetFresh(noLdFixture, "no-ld-9104", undefined, "mixed-and-no-ld-contract")
      const noLdInventory = await collectTournamentInventory(noLd.context, config, noLdFixture.tournamentId)
      const noLdBeforeState = await readDatabaseState(noLd.context, noLdFixture)
      const noLdResultsControls = await readNoLdResultsControls(noLd)
      const noLdPairingControls = await readPairingStageControls(noLd)
      const noLdAfterState = await readDatabaseState(noLd.context, noLdFixture)
      const noLdScreenshot = await captureCheckpoint(noLd.page, run, "no-ld-9104-ui-observation")
      const noLdDelta = databaseDelta(noLdBeforeState, noLdAfterState)
      await closeSession(noLd)
      const noLdGates = sessionGateEvidence(noLd)

      const noLdReload = await freshOrganizer(noLdFixture)
      const noLdReloadInventory = await collectTournamentInventory(noLdReload.context, config, noLdFixture.tournamentId)
      const noLdReloadResultsControls = await readNoLdResultsControls(noLdReload)
      const noLdReloadPairingControls = await readPairingStageControls(noLdReload)
      const noLdReloadState = await readDatabaseState(noLdReload.context, noLdFixture)
      const noLdReloadScreenshot = await captureCheckpoint(noLdReload.page, run, "no-ld-9104-ui-observation-reload")
      await closeSession(noLdReload)
      const noLdReloadGates = sessionGateEvidence(noLdReload)

      await writeRunRecord(run, "mixed-and-no-ld-contract-no-ld-evidence", {
        fixture: noLdFixture.fixtureId,
        apiInventory: stageRoundSummary(noLdInventory),
        reloadApiInventory: stageRoundSummary(noLdReloadInventory),
        resultsControls: noLdResultsControls,
        reloadResultsControls: noLdReloadResultsControls,
        pairingControls: noLdPairingControls,
        reloadPairingControls: noLdReloadPairingControls,
        database: {
          beforeHash: noLdDelta.beforeHash,
          afterHash: noLdDelta.afterHash,
          reloadHash: hashValue(noLdReloadState),
          changed: noLdDelta.changed,
          reloadChanged: databaseDelta(noLdBeforeState, noLdReloadState).changed,
        },
        gates: { initial: noLdGates, reload: noLdReloadGates },
        screenshots: { initial: noLdScreenshot, reload: noLdReloadScreenshot },
      })
      recordMutationEvidence("mixed-and-no-ld-contract", {
        name: "mixed-and-no-ld-contract/no-ld/ui-observation",
        kind: "ui-observation",
        response: null,
        dbDelta: noLdDelta,
        screenshots: { before: noLdScreenshot, after: noLdScreenshot, reload: noLdReloadScreenshot },
      })

      const mixedFixture = fixture(9106)
      const mixedReset = await resetFreshWithEvidence(mixedFixture, "mixed-format-9106", undefined, "mixed-and-no-ld-contract", true)
      const mixed = mixedReset.session
      const resetInventories = mixedReset.resetEvidence.inventories
      if (!resetInventories?.before || !resetInventories.after || !resetInventories.reload) {
        throw new Error("mixed-format-9106 reset evidence must include API inventories")
      }
      const mixedResetBeforeInventory = resetInventories.before
      const mixedResetAfterInventory = resetInventories.after
      const mixedResetReloadInventory = resetInventories.reload
      const mixedInventory = await collectTournamentInventory(mixed.context, config, mixedFixture.tournamentId)
      const mixedPreliminary = findStage(mixedInventory, "preliminary")
      const mixedTeam = findStage(mixedInventory, "team")
      const mixedSolo = findStage(mixedInventory, "solo")
      const mixedRound = mixedTeam.rounds[0]
      if (!mixedRound) throw new Error("mixed-format-9106 must provide a Team elimination round")
      const mixedBeforeState = await readDatabaseState(mixed.context, mixedFixture)
      const mixedInitialPairingControls = await readPairingStageControls(mixed, ["preliminary", "team", "solo"])
      const mixedBeforeScreenshot = await captureCheckpoint(mixed.page, run, "mixed-format-9106-before-ui-observation")
      const formatPairs = (inventory: IntegrityInventory) => inventory.stages
        .map((stage) => ({ stage: stage.stage, format: stage.format }))
        .sort((left, right) => left.stage.localeCompare(right.stage))

      await writeRunRecord(run, "mixed-and-no-ld-contract-pre-ui-evidence", {
        fixture: mixedFixture.fixtureId,
        reset: {
          response: mixedReset.resetEvidence.mutation,
          before: formatPairs(mixedResetBeforeInventory),
          after: formatPairs(mixedResetAfterInventory),
          reload: formatPairs(mixedResetReloadInventory),
        },
        apiInventory: formatPairs(mixedInventory),
        initialPairingControls: mixedInitialPairingControls,
        round: { id: mixedRound.id, name: mixedRound.name, roundNumber: mixedRound.roundNumber, matchCount: mixedRound.matches.length },
        beforeStateHash: hashValue(mixedBeforeState),
        screenshot: mixedBeforeScreenshot,
      })

      await selectPairingRound(mixed.page, mixedInventory.stages, "team", mixedRound)
      const mixedSelection = await readTeamPairingSelection(mixed, mixedRound)
      const mixedAfterState = await readDatabaseState(mixed.context, mixedFixture)
      const mixedAfterScreenshot = await captureCheckpoint(mixed.page, run, "mixed-format-9106-after-ui-observation")
      await closeSession(mixed)
      const mixedGates = sessionGateEvidence(mixed)

      const mixedReload = await freshOrganizer(mixedFixture)
      const mixedReloadInventory = await collectTournamentInventory(mixedReload.context, config, mixedFixture.tournamentId)
      const mixedReloadTeam = findStage(mixedReloadInventory, "team")
      const mixedReloadRound = mixedReloadTeam.rounds.find((round) => round.id === mixedRound.id) ?? mixedReloadTeam.rounds[0]
      if (!mixedReloadRound) throw new Error("mixed-format-9106 reload must provide the Team elimination round")
      const mixedReloadInitialPairingControls = await readPairingStageControls(mixedReload, ["preliminary", "team", "solo"])
      const mixedReloadBeforeScreenshot = await captureCheckpoint(mixedReload.page, run, "mixed-format-9106-before-reload-selection")
      await writeRunRecord(run, "mixed-and-no-ld-contract-reload-pre-selection-evidence", {
        fixture: mixedFixture.fixtureId,
        apiInventory: formatPairs(mixedReloadInventory),
        pairingControls: mixedReloadInitialPairingControls,
        screenshot: mixedReloadBeforeScreenshot,
      })
      await selectPairingRound(mixedReload.page, mixedReloadInventory.stages, "team", mixedReloadRound)
      const mixedReloadSelection = await readTeamPairingSelection(mixedReload, mixedReloadRound)
      const mixedReloadState = await readDatabaseState(mixedReload.context, mixedFixture)
      const mixedReloadScreenshot = await captureCheckpoint(mixedReload.page, run, "mixed-format-9106-ui-observation-reload")
      await closeSession(mixedReload)
      const mixedReloadGates = sessionGateEvidence(mixedReload)

      const mixedDbDelta = databaseDelta(mixedBeforeState, mixedAfterState)
      const mixedReloadDbDelta = databaseDelta(mixedAfterState, mixedReloadState)
      const combinedEvidence = {
        noLd: {
          fixture: noLdFixture.fixtureId,
          apiInventory: stageRoundSummary(noLdInventory),
          reloadApiInventory: stageRoundSummary(noLdReloadInventory),
          resultsControls: noLdResultsControls,
          reloadResultsControls: noLdReloadResultsControls,
          pairingControls: noLdPairingControls,
          reloadPairingControls: noLdReloadPairingControls,
          database: { beforeHash: noLdDelta.beforeHash, afterHash: noLdDelta.afterHash, changed: noLdDelta.changed, reloadChanged: databaseDelta(noLdBeforeState, noLdReloadState).changed },
          gates: { initial: noLdGates, reload: noLdReloadGates },
          screenshots: { initial: noLdScreenshot, reload: noLdReloadScreenshot },
        },
        mixed: {
          fixture: mixedFixture.fixtureId,
          reset: { before: formatPairs(mixedResetBeforeInventory), after: formatPairs(mixedResetAfterInventory), reload: formatPairs(mixedResetReloadInventory) },
          apiInventory: formatPairs(mixedInventory),
          reloadApiInventory: formatPairs(mixedReloadInventory),
          initialPairingControls: mixedInitialPairingControls,
          reloadInitialPairingControls: mixedReloadInitialPairingControls,
          round: { id: mixedRound.id, name: mixedRound.name, roundNumber: mixedRound.roundNumber, matchCount: mixedRound.matches.length },
          reloadRound: { id: mixedReloadRound.id, name: mixedReloadRound.name, roundNumber: mixedReloadRound.roundNumber, matchCount: mixedReloadRound.matches.length },
          selection: mixedSelection,
          reloadSelection: mixedReloadSelection,
          database: { beforeHash: mixedDbDelta.beforeHash, afterHash: mixedDbDelta.afterHash, changed: mixedDbDelta.changed, reloadChanged: mixedReloadDbDelta.changed },
          gates: { initial: mixedGates, reload: mixedReloadGates },
          screenshots: { before: mixedBeforeScreenshot, after: mixedAfterScreenshot, reloadBeforeSelection: mixedReloadBeforeScreenshot, reload: mixedReloadScreenshot },
          stageFormats: { preliminary: mixedPreliminary.format, team: mixedTeam.format, solo: mixedSolo.format },
        },
      }
      await writeRunRecord(run, "mixed-and-no-ld-contract-evidence", combinedEvidence)
      recordMutationEvidence("mixed-and-no-ld-contract", {
        name: "mixed-and-no-ld-contract/mixed-format/ui-observation",
        kind: "ui-observation",
        response: null,
        dbDelta: mixedDbDelta,
        screenshots: { before: mixedBeforeScreenshot, after: mixedAfterScreenshot, reload: mixedReloadScreenshot },
      })

      const expectedNoLdFormats = [
        { stage: "preliminary", format: DebateFormat.APF },
        { stage: "team", format: DebateFormat.APF },
      ]
      const expectedMixedFormats = [
        { stage: "preliminary", format: DebateFormat.APF },
        { stage: "solo", format: DebateFormat.LD },
        { stage: "team", format: DebateFormat.BPF },
      ]
      expect(formatPairs(noLdInventory)).toEqual(expectedNoLdFormats)
      expect(formatPairs(noLdReloadInventory)).toEqual(expectedNoLdFormats)
      expect(formatPairs(mixedInventory)).toEqual(expectedMixedFormats)
      expect(formatPairs(mixedReloadInventory)).toEqual(expectedMixedFormats)
      expect(formatPairs(mixedResetBeforeInventory)).toEqual(expectedMixedFormats)
      expect(formatPairs(mixedResetAfterInventory)).toEqual(expectedMixedFormats)
      expect(formatPairs(mixedResetReloadInventory)).toEqual(expectedMixedFormats)
      expect(noLdInventory.stages.some((stage) => stage.stage === "solo")).toBe(false)
      expect(noLdResultsControls).toMatchObject({ selected: "true", expanded: "true" })
      expect(noLdReloadResultsControls).toMatchObject({ selected: "true", expanded: "true" })
      for (const controls of [noLdResultsControls.controls, noLdReloadResultsControls.controls]) {
        expect(controls.find(({ format }) => format === "APF")).toMatchObject({ count: 1, visible: true })
        expect(controls.find(({ format }) => format === "BPF")).toMatchObject({ count: 1, visible: true })
        expect(controls.find(({ format }) => format === "LD")).toMatchObject({ count: 0, visible: false })
      }
      for (const controls of [noLdPairingControls.controls, noLdReloadPairingControls.controls]) {
        expect(controls.find(({ stage }) => stage === "solo")).toMatchObject({ label: "Solo elimination (LD)", count: 0, visible: false, pressed: null })
      }
      for (const pairingControls of [mixedInitialPairingControls, mixedReloadInitialPairingControls]) {
        expect(pairingControls.sectionCount).toBe(1)
        expect(pairingControls.controls.find(({ stage }) => stage === "preliminary")).toMatchObject({ label: "Preliminary (APF)", count: 1, visible: true })
        expect(pairingControls.controls.find(({ stage }) => stage === "team")).toMatchObject({ label: "Team elimination (BPF)", count: 1, visible: true })
        expect(pairingControls.controls.find(({ stage }) => stage === "solo")).toMatchObject({ label: "Solo elimination (LD)", count: 1, visible: true })
      }
      expect(noLdDelta.changed, "9104 no-LD UI observation must not mutate DB").toBe(false)
      expect(databaseDelta(noLdBeforeState, noLdReloadState).changed, "9104 no-LD reload must not mutate DB").toBe(false)
      expect(mixedDbDelta.changed, "9106 mixed UI observation must not mutate DB").toBe(false)
      expect(mixedReloadDbDelta.changed, "9106 mixed reload must not mutate DB").toBe(false)
      expect(mixedSelection).toMatchObject({
        hydratedSectionCount: 1,
        stageLabel: "Team elimination (BPF)",
        stagePressed: "true",
        roundLabel: mixedRound.name,
        roundPressed: "true",
      })
      expect(mixedReloadSelection).toMatchObject({
        hydratedSectionCount: 1,
        stageLabel: "Team elimination (BPF)",
        stagePressed: "true",
        roundLabel: mixedReloadRound.name,
        roundPressed: "true",
      })
      return { noLdFixture: 9104, mixedFixture: 9106, noLdHasSolo: false, mixedFormats: { preliminary: mixedPreliminary.format, team: mixedTeam.format, solo: mixedSolo.format }, mixedRound: mixedRound.name }
    })

  } finally {
    let cleanupError: unknown = null
    for (const session of trackedSessions.values()) {
      if (!activeContexts.has(session.context)) continue
      try {
        await closeSession(session)
      } catch (error) {
        cleanupError ??= error
      }
    }
    if (cleanupError) throw cleanupError
  }

  const registeredCaseIds = [...caseActions.keys()]
  if (registeredCaseIds.length !== REQUIRED_CASE_IDS.length || registeredCaseIds.some((id, index) => id !== REQUIRED_CASE_IDS[index])) {
    throw new Error(`Registered integrity cases do not exactly match the required IDs: ${JSON.stringify({ registeredCaseIds, requiredCaseIds: REQUIRED_CASE_IDS })}`)
  }

  const executeCase = async (name: string) => {
    const action = caseActions.get(name)
    if (!action) throw new Error(`Integrity case ${name} was not registered.`)
    const startedAt = new Date().toISOString()
    try {
      const result = await action()
      const artifacts = caseArtifacts.get(name) ?? []
      expect(artifacts.length, `${name} must emit a reset evidence artifact`).toBeGreaterThan(0)
      expect(artifacts.every((artifact) => artifact.screenshots.before && artifact.screenshots.after && artifact.screenshots.reload), `${name} must emit before/after/reload screenshots`).toBe(true)
      expect(artifacts.every((artifact) => artifact.response.status && artifact.response.url && artifact.response.method), `${name} must emit a reset mutation response`).toBe(true)
      expect(artifacts.every((artifact) => artifact.dbDelta.beforeHash && artifact.dbDelta.afterHash && typeof artifact.dbDelta.changed === "boolean"), `${name} must emit a reset DB delta`).toBe(true)
      const namedEvidence = mutationEvidence.get(name) ?? []
      expect(namedEvidence.length, `${name} must emit named UI/API mutation evidence`).toBeGreaterThan(0)
      expect(namedEvidence.every((evidence) => typeof evidence.name === "string" && evidence.name.length > 0), `${name} mutation evidence must be named`).toBe(true)
      expect(namedEvidence.every((evidence) => evidence.kind !== "reset"), `${name} reset evidence cannot satisfy UI/API mutation evidence`).toBe(true)
      expect(namedEvidence.some((evidence) => evidence.kind === "ui-mutation" || evidence.kind === "direct-api" || evidence.kind === "ui-observation"), `${name} must distinguish UI/API evidence from reset evidence`).toBe(true)
      const row = { name, status: "PASS", startedAt, finishedAt: new Date().toISOString(), result: result ?? null, resetArtifacts: artifacts, mutationEvidence: namedEvidence }
      cases.push(row)
      await writeRunRecord(run, `${name}-case`, row)
      return result
    } catch (error) {
      const row = { name, status: "FAIL", startedAt, finishedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) }
      cases.push(row)
      await writeRunRecord(run, `${name}-case`, row)
      throw error
    }
  }

  const verifyFrontendProxyTournament = async (fixture: IntegrityFixture) => {
    const session = track(await openOrganizerSession(browser, config, "api-only"))
    try {
      const response = await session.context.request.get(`${config.frontendBaseURL.replace(/\/+$/, "")}/api/tournaments/${fixture.tournamentId}`, { failOnStatusCode: false, timeout: RESPONSE_TIMEOUT_MS })
      const body = await response.text()
      expect(response.status(), `frontend proxy tournament ${fixture.tournamentId} GET must return 200 before cases`).toBe(200)
      await writeRunRecord(run, "frontend-proxy-tournament-smoke", {
        fixtureId: fixture.fixtureId,
        tournamentId: fixture.tournamentId,
        status: response.status(),
        path: `/api/tournaments/${fixture.tournamentId}`,
        bodyHash: hashValue(body),
      })
    } finally {
      await closeSession(session)
    }
  }

  const finalize = async () => {
    const sessionCloseFailures: string[] = []
    for (const session of trackedSessions.values()) {
      try {
        if (activeContexts.has(session.context)) await closeSession(session)
        else {
          await persistRuntimeDiagnostics(session)
          await persistSessionAuthEvidence(session)
        }
      } catch {
        sessionCloseFailures.push(session.sessionId)
      }
    }
    const voidMutationReconciliationFailures: string[] = []
    const voidMutationReconciliations: Array<{ sessionId: string; reconciliation: VoidMutationTerminalReconciliation }> = []
    for (const session of trackedSessions.values()) {
      try {
        voidMutationReconciliations.push({
          sessionId: session.sessionId,
          reconciliation: await reconcileVoidMutationTerminal(session.runtime),
        })
      } catch (error) {
        voidMutationReconciliationFailures.push(`${session.sessionId}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    const finalPersistenceWriteFailures: string[] = []
    for (const session of trackedSessions.values()) {
      try {
        await persistRuntimeDiagnostics(session, null, { finalSuiteSnapshot: true, force: true })
      } catch {
        finalPersistenceWriteFailures.push(session.sessionId)
      }
    }
    let runtimePersistenceFiles: RuntimeEvidencePersistenceFiles = { diagnostics: [], prefetch: [], closeCancellations: [], readErrors: [] }
    try {
      runtimePersistenceFiles = await readRuntimeEvidencePersistenceFiles(run)
    } catch (error) {
      runtimePersistenceFiles.readErrors.push(error instanceof Error ? error.message : String(error))
    }
    const executedCaseIds = cases.map((row) => String(row.name))
    for (const session of trackedSessions.values()) {
      reconcileContextCloseCancellations(session.runtime)
      reconcileRuntimeEvidence(session.runtime)
    }
    const runtimeSessionRecords = [...trackedSessions.values()].map((session) => ({
      sessionId: session.sessionId,
      runtime: snapshotRuntimeEvidence(session.runtime),
    }))
    const expectedRuntimePersistence = [...trackedSessions.values()].map((session) => ({
      sessionId: session.sessionId,
      records: buildRuntimeEvidencePersistenceRecords(
        session.sessionId,
        runtimeSessionRecords.find((record) => record.sessionId === session.sessionId)!.runtime,
        preCloseRuntimeBySession.get(session.sessionId) ?? null,
        { contextClosed: session.runtime.phase === "closed", finalSuiteSnapshot: true },
      ),
    }))
    const parsedRuntimePersistenceValidation = validateRuntimeEvidencePersistence(expectedRuntimePersistence, runtimePersistenceFiles)
    const runtimePersistenceValidation = {
      ...parsedRuntimePersistenceValidation,
      errors: [
        ...parsedRuntimePersistenceValidation.errors,
        ...finalPersistenceWriteFailures.map((sessionId) => `${sessionId}: final runtime persistence write failed`),
      ],
      valid: parsedRuntimePersistenceValidation.valid && finalPersistenceWriteFailures.length === 0,
    }
    const persistedContextCloseCancellationRecords: PersistedContextCloseCancellationRecord[] = readPersistedContextCloseCancellationRecords(runtimePersistenceFiles)
    const parsedContextCloseCancellationBijectionValidation = validateContextCloseCancellationBijection(
      [...trackedRuntimeEvidence],
      persistedContextCloseCancellationRecords,
    )
    const contextCloseCancellationBijectionValidation = {
      ...parsedContextCloseCancellationBijectionValidation,
      valid: parsedContextCloseCancellationBijectionValidation.valid && runtimePersistenceValidation.valid,
      errors: [
        ...parsedContextCloseCancellationBijectionValidation.errors,
        ...runtimePersistenceValidation.errors.filter((error) => error.includes("context-close")),
      ],
    }
    const parsedVoidMutationBijectionValidation = validateVoidMutationBijection(
      voidMutationReconciliations.map(({ reconciliation }) => reconciliation),
      persistedVoidMutationRecords,
    )
    const voidMutationBijectionValidation = {
      ...parsedVoidMutationBijectionValidation,
      reconciliationFailures: voidMutationReconciliationFailures,
      errors: [...parsedVoidMutationBijectionValidation.errors, ...voidMutationReconciliationFailures],
      valid: parsedVoidMutationBijectionValidation.valid && voidMutationReconciliationFailures.length === 0,
    }
    const observedExpectedVoidMutationAborts = voidMutationReconciliations
      .flatMap(({ reconciliation }) => reconciliation.acceptedAborts)
    const observedExpectedNextLinkPrefetchAborts = [...trackedRuntimeEvidence]
      .flatMap((runtime) => runtime.expectedNextLinkPrefetchAborts)
    const observedContextCloseCancellations = [...trackedRuntimeEvidence]
      .flatMap((runtime) => runtime.contextCloseCancellations)
    const unpersistedExpectedVoidMutationAbortIds = voidMutationBijectionValidation.missingPersistedCorrelationIds
    const unpersistedContextCloseCancellationIds = contextCloseCancellationBijectionValidation.missingPersistedCorrelationIds
    const trackedSessionIds = [...trackedSessions.keys()]
    const persistedRuntimeSessionIds = runtimePersistenceValidation.actualDiagnosticsSessionIds
    const persistedPrefetchSessionIds = runtimePersistenceValidation.actualPrefetchSessionIds
    const missingDurableRuntimeEvidenceSessionIds = runtimePersistenceValidation.missingDiagnosticsSessionIds
    const missingDurableExpectedNextLinkPrefetchEvidenceSessionIds = runtimePersistenceValidation.missingPrefetchSessionIds
    const runtimeRequestEvidence = [...trackedRuntimeEvidence].flatMap((runtime) => runtime.requestEvidence)
    const requestCorrelationIds = runtimeRequestEvidence.map((entry) => entry.correlationId)
    const duplicateRequestCorrelationIds = [...new Set(requestCorrelationIds.filter((id, index) => requestCorrelationIds.indexOf(id) !== index))]
    const missingRequestCorrelationIds = runtimeRequestEvidence.filter((entry) => entry.correlationId.length === 0).map((entry) => entry.correlationId)
    const expectedNextLinkPrefetchCorrelationIds = observedExpectedNextLinkPrefetchAborts.map((entry) => entry.correlationId)
    const duplicateExpectedNextLinkPrefetchCorrelationIds = [...new Set(expectedNextLinkPrefetchCorrelationIds.filter((id, index) => expectedNextLinkPrefetchCorrelationIds.indexOf(id) !== index))]
    const invalidExpectedNextLinkPrefetchCorrelationIds = observedExpectedNextLinkPrefetchAborts
      .filter((entry) => entry.classification !== "expected-next-link-prefetch-abort" || !isExpectedNextLinkPrefetchAbort(entry))
      .map((entry) => entry.correlationId)
    const orphanExpectedNextLinkPrefetchCorrelationIds = expectedNextLinkPrefetchCorrelationIds.filter((correlationId) => {
      const matchingRequest = runtimeRequestEvidence.find((entry) => entry.correlationId === correlationId)
      return !matchingRequest || matchingRequest.classification !== "expected-next-link-prefetch-abort" || !isExpectedNextLinkPrefetchAbort(matchingRequest)
    })
    const invalidClassifiedNextLinkPrefetchCorrelationIds = runtimeRequestEvidence
      .filter((entry) => entry.classification === "expected-next-link-prefetch-abort" && !isExpectedNextLinkPrefetchAbort(entry))
      .map((entry) => entry.correlationId)
    const contextCloseCancellationCorrelationIds = observedContextCloseCancellations.map((entry) => entry.correlationId)
    const duplicateContextCloseCancellationCorrelationIds = [...new Set(contextCloseCancellationCorrelationIds.filter((id, index) => contextCloseCancellationCorrelationIds.indexOf(id) !== index))]
    const runtimeAssertionFailures: string[] = []
    for (const session of trackedSessions.values()) {
      try {
        assertRuntimeEvidenceIsClean(session.runtime)
      } catch {
        runtimeAssertionFailures.push(session.sessionId)
      }
    }
    const exactClassifiedEvidence = runtimeSessionRecords.every(({ runtime }) =>
      runtime.expectedNextLinkPrefetchAborts.every((entry) =>
        entry.classification === "expected-next-link-prefetch-abort" &&
        entry.failure === "net::ERR_ABORTED" &&
        isExpectedNextLinkPrefetchAbort(entry),
      ) && runtime.contextCloseCancellations.every((entry) =>
        entry.classification === "context-close-cancelled" &&
        entry.phase === "closing" &&
        entry.sequence > entry.closeBoundarySequence &&
        entry.method === "GET" &&
        entry.isLocalRequest === true &&
        entry.isNavigationRequest === false &&
        entry.responseObserved === false &&
        entry.responseStatus === null &&
        entry.failure === null &&
        entry.voidMutationCorrelationId === null &&
        entry.voidMutationOwner === null &&
        ((entry.resourceType === "script" && /^\/_next\/static\/chunks\/.+\.js$/.test(entry.path)) ||
          (entry.resourceType === "fetch" &&
            !/^\/api(?:\/|$)/.test(entry.path) &&
            !/^\/auth(?:\/|$)/.test(entry.path) &&
            !entry.path.startsWith("/_next/") &&
            entry.query.rscPresent === true &&
            entry.headers.rsc === "1" &&
            entry.headers.nextRouterPrefetch === "1" &&
            entry.headers.nextRouterSegmentPrefetch !== null)),
      ) && runtime.requestEvidence.every((entry) =>
        entry.classification !== "expected-next-link-prefetch-abort" ||
        (entry.failure === "net::ERR_ABORTED" && isExpectedNextLinkPrefetchAbort(entry)),
      ) && runtime.requestEvidence.every((entry) =>
        entry.classification !== "context-close-cancelled" ||
        runtime.contextCloseCancellations.some((candidate) => candidate.correlationId === entry.correlationId),
      ),
    )
    const nextLinkPrefetchClassifierValidation = {
      selfCheckReport: expectedNextLinkPrefetchAbortClassifierSelfCheckReport,
      persistenceSelfCheckReport: runtimeEvidencePersistenceSelfCheckReport,
      trackedSessionIds,
      durableSessionIds: persistedPrefetchSessionIds,
      missingDurableSessionIds: missingDurableExpectedNextLinkPrefetchEvidenceSessionIds,
      sessionCoverage: trackedSessionIds.map((sessionId) => ({
        sessionId,
        durableRuntimeEvidence: runtimePersistenceValidation.actualDiagnosticsSessionIds.includes(sessionId),
        durablePrefetchEvidence: runtimePersistenceValidation.actualPrefetchSessionIds.includes(sessionId),
        expectedAbortCount: runtimeSessionRecords.find((record) => record.sessionId === sessionId)?.runtime.expectedNextLinkPrefetchAborts.length ?? 0,
      })),
      expectedAbortCount: observedExpectedNextLinkPrefetchAborts.length,
      duplicateCorrelationIds: duplicateExpectedNextLinkPrefetchCorrelationIds,
      invalidCorrelationIds: [...new Set([
        ...invalidExpectedNextLinkPrefetchCorrelationIds,
        ...invalidClassifiedNextLinkPrefetchCorrelationIds,
      ])],
      orphanCorrelationIds: [...new Set(orphanExpectedNextLinkPrefetchCorrelationIds)],
      exactClassifiedEvidence,
      uniqueCorrelationIds: duplicateRequestCorrelationIds.length === 0 && duplicateExpectedNextLinkPrefetchCorrelationIds.length === 0,
      valid: expectedNextLinkPrefetchAbortClassifierSelfCheckReport.passed &&
        runtimeEvidencePersistenceSelfCheckReport.passed &&
        runtimePersistenceValidation.valid &&
        missingDurableExpectedNextLinkPrefetchEvidenceSessionIds.length === 0 &&
        duplicateExpectedNextLinkPrefetchCorrelationIds.length === 0 &&
        invalidExpectedNextLinkPrefetchCorrelationIds.length === 0 &&
        invalidClassifiedNextLinkPrefetchCorrelationIds.length === 0 &&
        orphanExpectedNextLinkPrefetchCorrelationIds.length === 0 &&
        exactClassifiedEvidence &&
        duplicateRequestCorrelationIds.length === 0,
    }
    const expectedNextLinkPrefetchAbortEvidenceValidation = {
      trackedSessionIds,
      persistenceSelfCheckReport: runtimeEvidencePersistenceSelfCheckReport,
      missingDurableEvidenceSessionIds: missingDurableExpectedNextLinkPrefetchEvidenceSessionIds,
      duplicateCorrelationIds: duplicateExpectedNextLinkPrefetchCorrelationIds,
      invalidCorrelationIds: [...new Set([
        ...invalidExpectedNextLinkPrefetchCorrelationIds,
        ...invalidClassifiedNextLinkPrefetchCorrelationIds,
      ])],
      expectedAbortCount: observedExpectedNextLinkPrefetchAborts.length,
      valid: nextLinkPrefetchClassifierValidation.valid,
    }
    const runtimeEvidenceValidation = {
      trackedSessionIds,
      runtimePersistenceValidation,
      durableSessionIds: persistedRuntimeSessionIds,
      missingDurableSessionIds: missingDurableRuntimeEvidenceSessionIds,
      missingDurablePrefetchEvidenceSessionIds: missingDurableExpectedNextLinkPrefetchEvidenceSessionIds,
      sessionCloseFailures,
      runtimeLifecycleFailures: [...trackedSessions.values()]
        .filter((session) => session.runtime.phase !== "closed" || session.runtime.closeBoundarySequence === null)
        .map((session) => session.sessionId),
      voidMutationReconciliationFailures,
      voidMutationBijectionValidation,
      contextCloseCancellationSelfCheckReport,
      contextCloseCancellationBijectionValidation,
      contextCloseCancellationCount: observedContextCloseCancellations.length,
      duplicateContextCloseCancellationCorrelationIds,
      runtimeAssertionFailures,
      requestEvidenceCount: runtimeRequestEvidence.length,
      duplicateRequestCorrelationIds,
      missingRequestCorrelationIds,
      invalidRequestTerminalStateCorrelationIds: runtimeRequestEvidence
        .filter((entry) =>
          (entry.responseObserved && entry.responseStatus === null) ||
          (!entry.responseObserved && entry.responseStatus !== null) ||
          (entry.failure === null && !entry.responseObserved && entry.responseStatus === null && entry.classification !== "context-close-cancelled"),
        )
        .map((entry) => entry.correlationId),
      unexpectedRequestCorrelationIds: runtimeRequestEvidence
        .filter((entry) => entry.classification === "unexpected-request-failure")
        .map((entry) => entry.correlationId),
      unsettledRequestCorrelationIds: runtimeRequestEvidence
        .filter((entry) => entry.classification === "pending" || (
          entry.failure === null &&
          !entry.responseObserved &&
          entry.responseStatus === null &&
          entry.classification !== "context-close-cancelled"
        ))
        .map((entry) => entry.correlationId),
      allSessionRuntimeRecordsReasserted: runtimeAssertionFailures.length === 0,
      valid: missingDurableRuntimeEvidenceSessionIds.length === 0 &&
        missingDurableExpectedNextLinkPrefetchEvidenceSessionIds.length === 0 &&
        runtimePersistenceValidation.valid &&
        sessionCloseFailures.length === 0 &&
        [...trackedSessions.values()].every((session) => session.runtime.phase === "closed" && session.runtime.closeBoundarySequence !== null) &&
        voidMutationBijectionValidation.valid &&
        contextCloseCancellationSelfCheckReport.passed &&
        contextCloseCancellationBijectionValidation.valid &&
        duplicateContextCloseCancellationCorrelationIds.length === 0 &&
        runtimeAssertionFailures.length === 0 &&
        duplicateRequestCorrelationIds.length === 0 &&
        missingRequestCorrelationIds.length === 0 &&
        runtimeRequestEvidence.every((entry) =>
          !(entry.responseObserved && entry.responseStatus === null) &&
          !(!entry.responseObserved && entry.responseStatus !== null) &&
          !(entry.failure === null && !entry.responseObserved && entry.responseStatus === null && entry.classification !== "context-close-cancelled"),
        ) &&
        runtimeRequestEvidence.every((entry) => entry.classification !== "unexpected-request-failure" && entry.classification !== "pending"),
    }
    const missingCaseIds = REQUIRED_CASE_IDS.filter((id) => !executedCaseIds.includes(id))
    const unexpectedCaseIds = executedCaseIds.filter((id) => !REQUIRED_CASE_IDS.includes(id as typeof REQUIRED_CASE_IDS[number]))
    const duplicateCaseIds = [...new Set(executedCaseIds.filter((id, index) => executedCaseIds.indexOf(id) !== index))]
    const nonPassingCaseIds = cases.filter((row) => row.status !== "PASS").map((row) => String(row.name))
    const missingEvidenceCaseIds = REQUIRED_CASE_IDS.filter((id) => {
      const artifacts = caseArtifacts.get(id) ?? []
      return artifacts.length === 0 || artifacts.some((artifact) =>
        !artifact.screenshots.before || !artifact.screenshots.after || !artifact.screenshots.reload ||
        !artifact.response.status || !artifact.response.url || !artifact.response.method ||
        !artifact.dbDelta.beforeHash || !artifact.dbDelta.afterHash || typeof artifact.dbDelta.changed !== "boolean",
      )
    })
    const missingMutationEvidenceCaseIds = REQUIRED_CASE_IDS.filter((id) => {
      const evidence = mutationEvidence.get(id) ?? []
      return evidence.length === 0 || evidence.some((entry) => typeof entry.name !== "string" || typeof entry.kind !== "string" || entry.kind === "reset")
    })
    const authSessions = [...trackedSessions.values()].map((session) => session.authEvidence)
    const missingDurableAuthEvidenceSessionIds = [...trackedSessions.values()]
      .filter((session) => !persistedAuthEvidence.has(session.sessionId))
      .map((session) => session.sessionId)
    const hasAuthenticatedEvidence = (session: IntegritySession) => {
      const { authEvidence } = session
      return authEvidence.authPost?.status === 200 &&
        authEvidence.authGet?.status === 200 &&
        authEvidence.usernamePresent &&
        authEvidence.passwordPresent &&
        authEvidence.expectedRole !== null &&
        authEvidence.verifiedRole === authEvidence.expectedRole &&
        authEvidence.verifiedUsernameHash !== null &&
        /^[a-f0-9]{64}$/.test(authEvidence.verifiedUsernameHash)
    }
    const hasNavigationEvidence = (session: IntegritySession, expectedBrowserUsersMeStatus: number | number[]) => {
      const expectedStatuses = Array.isArray(expectedBrowserUsersMeStatus) ? expectedBrowserUsersMeStatus : [expectedBrowserUsersMeStatus]
      return session.authEvidence.navigationHistory.length > 0 && session.authEvidence.navigationHistory.every((navigation) =>
        navigation.status === 200 &&
        navigation.expectedPath !== null && /^\/tournament\/\d+$/.test(navigation.expectedPath) &&
        navigation.finalPath === navigation.expectedPath &&
        navigation.noAuthRedirect === true &&
        expectedStatuses.includes(navigation.browserUsersMeStatus ?? -1),
      )
    }
    const invalidAuthEvidenceSessionIds = [...trackedSessions.values()]
      .filter((session) => session.authEvidence.purpose !== "anonymous-ui" && !hasAuthenticatedEvidence(session))
      .map((session) => session.sessionId)
    const missingUINavigationEvidenceSessionIds = [...trackedSessions.values()]
      .filter((session) => session.authEvidence.purpose === "ui-tournament" && (!hasAuthenticatedEvidence(session) || !hasNavigationEvidence(session, 200)))
      .map((session) => session.sessionId)
    const invalidAnonymousNavigationEvidenceSessionIds = [...trackedSessions.values()]
      .filter((session) => session.authEvidence.purpose === "anonymous-ui" && !hasNavigationEvidence(session, [401, 403]))
      .map((session) => session.sessionId)
    const invalidApiOnlySessionIds = [...trackedSessions.values()]
      .filter((session) => session.authEvidence.purpose === "api-only" && (
        !hasAuthenticatedEvidence(session) ||
        session.authEvidence.navigationHistory.length > 0 ||
        session.authEvidence.navigation.expectedPath !== null ||
        session.authEvidence.navigation.status !== null ||
        session.authEvidence.navigation.finalPath !== null ||
        session.authEvidence.navigation.noAuthRedirect !== null ||
        session.authEvidence.navigation.browserUsersMeStatus !== null
      ))
      .map((session) => session.sessionId)
    const authEvidenceValidation = {
      trackedSessionIds: [...trackedSessions.keys()],
      missingDurableAuthEvidenceSessionIds,
      invalidAuthEvidenceSessionIds,
      missingUINavigationEvidenceSessionIds,
      invalidAnonymousNavigationEvidenceSessionIds,
      invalidApiOnlySessionIds,
      valid: missingDurableAuthEvidenceSessionIds.length === 0 &&
        invalidAuthEvidenceSessionIds.length === 0 &&
        missingUINavigationEvidenceSessionIds.length === 0 &&
        invalidAnonymousNavigationEvidenceSessionIds.length === 0 &&
        invalidApiOnlySessionIds.length === 0,
    }
    let releaseSourceHashAfterRun: string | null = null
    let releaseSourceHashError: string | null = null
    if (run.releaseBuildEvidence) {
      try {
        releaseSourceHashAfterRun = await computeRelevantSourceHash()
      } catch (error) {
        releaseSourceHashError = error instanceof Error ? error.message : String(error)
      }
    }
    const releaseValidation = run.releaseBuildEvidence
      ? {
        mode: "release-matrix" as const,
        buildId: run.releaseBuildEvidence.buildId,
        sourceHashBeforeRun: run.releaseBuildEvidence.sourceHashBeforeRun,
        sourceHashAfterRun: releaseSourceHashAfterRun,
        sourceHashUnchanged: releaseSourceHashError === null && releaseSourceHashAfterRun === run.releaseBuildEvidence.sourceHashBeforeRun,
        sourceHashError: releaseSourceHashError,
      }
      : null
    const releaseValidationValid = run.releaseBuildEvidence === null || (
      releaseValidation !== null &&
      releaseValidation.sourceHashUnchanged === true &&
      releaseValidation.sourceHashError === null
    )
    const validation = {
      ready: report.ready === true,
      requiredCaseIds: REQUIRED_CASE_IDS,
      executedCaseIds,
      missingCaseIds,
      unexpectedCaseIds,
      duplicateCaseIds,
      nonPassingCaseIds,
      missingEvidenceCaseIds,
      missingMutationEvidenceCaseIds,
      unpersistedExpectedVoidMutationAbortIds,
      unpersistedContextCloseCancellationIds,
      voidMutationBijectionValidation,
      contextCloseCancellationSelfCheckReport,
      contextCloseCancellationBijectionValidation,
      expectedNextLinkPrefetchAbortEvidenceValidation,
      nextLinkPrefetchClassifierValidation,
      runtimePersistenceValidation,
      runtimeEvidenceValidation,
      authEvidenceValidation,
      releaseValidation,
      valid: report.ready === true && missingCaseIds.length === 0 && unexpectedCaseIds.length === 0 && duplicateCaseIds.length === 0 && nonPassingCaseIds.length === 0 && missingEvidenceCaseIds.length === 0 && missingMutationEvidenceCaseIds.length === 0 && unpersistedExpectedVoidMutationAbortIds.length === 0 && unpersistedContextCloseCancellationIds.length === 0 && voidMutationBijectionValidation.valid && contextCloseCancellationSelfCheckReport.passed && contextCloseCancellationBijectionValidation.valid && expectedNextLinkPrefetchAbortEvidenceValidation.valid && nextLinkPrefetchClassifierValidation.valid && runtimeEvidenceValidation.valid && authEvidenceValidation.valid && releaseValidationValid,
    }
    await finalizeRunEvidence(run, {
      runId: run.id,
      startedAt: run.startedAt,
      finishedAt: new Date().toISOString(),
      status: validation.valid ? "PASS" : "FAIL",
      valid: validation.valid,
      readiness: validation.ready,
      registeredIds: registeredCaseIds,
      executedIds: executedCaseIds,
      failureReason: validation.valid ? null : {
        missingCaseIds,
        unexpectedCaseIds,
        duplicateCaseIds,
        nonPassingCaseIds,
        missingEvidenceCaseIds,
        missingMutationEvidenceCaseIds,
        unpersistedExpectedVoidMutationAbortIds,
        unpersistedContextCloseCancellationIds,
        voidMutationBijectionValidation,
        contextCloseCancellationSelfCheckReport,
        contextCloseCancellationBijectionValidation,
        expectedNextLinkPrefetchAbortEvidenceValidation,
        nextLinkPrefetchClassifierValidation,
        runtimePersistenceValidation,
        runtimeEvidenceValidation,
      },
      cases,
      ready: report.ready === true,
      readyReport: report,
      releaseBuildEvidence: run.releaseBuildEvidence,
      releaseValidation,
      expectedVoidMutationAborts: observedExpectedVoidMutationAborts,
      voidMutationBijectionValidation,
      contextCloseCancellations: observedContextCloseCancellations,
      contextCloseCancellationSelfCheckReport,
      contextCloseCancellationBijectionValidation,
      expectedNextLinkPrefetchAborts: observedExpectedNextLinkPrefetchAborts,
      expectedNextLinkPrefetchAbortEvidenceValidation,
      nextLinkPrefetchClassifierValidation,
      runtimeSessions: runtimeSessionRecords,
      runtimePersistenceValidation,
      runtimeEvidenceValidation,
      authSessions,
      authEvidenceValidation,
      validation,
    })
    return { validation, runRoot: run.root }
  }

  return { runCase: executeCase, finalize, verifyFrontendProxyTournament, runRoot: run.root, registeredCaseIds }
}

type IntegritySuite = Awaited<ReturnType<typeof createIntegritySuite>>
const CASE_TIMEOUT_MS = 8 * 60 * 1_000
let integritySuite: IntegritySuite | null = null
let integrityRun: RunEvidence | null = null

const finalizeInitializationFailure = async (error: unknown, readiness: boolean, readyReport: ReadyReport | null) => {
  if (!integrityRun) return
  const reason = error instanceof Error ? error.message : String(error)
  const failureReason: Record<string, unknown> = { initialization: reason }
  await finalizeRunEvidence(integrityRun, {
    runId: integrityRun.id,
    startedAt: integrityRun.startedAt,
    finishedAt: new Date().toISOString(),
    status: "FAIL",
    valid: false,
    readiness,
    registeredIds: REQUIRED_CASE_IDS,
    executedIds: [],
    failureReason,
    cases: [],
    ready: readiness,
    readyReport,
    releaseBuildEvidence: integrityRun.releaseBuildEvidence,
    releaseValidation: null,
    validation: {
      ready: readiness,
      requiredCaseIds: REQUIRED_CASE_IDS,
      registeredCaseIds: REQUIRED_CASE_IDS,
      executedCaseIds: [],
      missingCaseIds: REQUIRED_CASE_IDS,
      unexpectedCaseIds: [],
      duplicateCaseIds: [],
      nonPassingCaseIds: [],
      missingEvidenceCaseIds: REQUIRED_CASE_IDS,
      missingMutationEvidenceCaseIds: REQUIRED_CASE_IDS,
      releaseValidation: null,
      valid: false,
    },
  })
}

test.describe("Luna tournament integrity matrix", () => {
  test.describe.configure({ mode: "serial", timeout: CASE_TIMEOUT_MS })

  test.beforeAll(async ({ browser, request }) => {
    integrityRun = await createRunEvidence(config, { ready: false })
    let readyReport: ReadyReport | null = null
    try {
      readyReport = await readReadyReport(request, config)
      const fixtures = resolveFixtures(config, readyReport)
      const suite = await createIntegritySuite(browser, config, readyReport, fixtures, integrityRun)
      const proxyFixture = fixtures.find((fixture) => fixture.fixtureId === 9101)
      if (!proxyFixture) throw new Error("Ready report omitted fixture 9101 before frontend proxy smoke.")
      await suite.verifyFrontendProxyTournament(proxyFixture)
      integritySuite = suite
    } catch (error) {
      await finalizeInitializationFailure(error, readyReport?.ready === true, readyReport)
      throw error
    }
  })

  test.afterAll(async () => {
    if (integritySuite) {
      const result = await integritySuite.finalize()
      if (!result.validation.valid) throw new Error(`Tournament integrity final validation failed: ${JSON.stringify(result.validation)}`)
    }
  })

  for (const caseId of REQUIRED_CASE_IDS) {
    test(caseId, async () => {
      test.setTimeout(CASE_TIMEOUT_MS)
      if (!integritySuite) throw new Error(`Integrity suite was not initialized before case ${caseId}.`)
      await integritySuite.runCase(caseId)
    })
  }
})
