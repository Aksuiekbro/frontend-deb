import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { createHash, randomBytes } from "node:crypto"
import { lstat, mkdir, readFile, readdir, writeFile, chmod, rename, unlink } from "node:fs/promises"
import path from "node:path"

import { expect } from "@playwright/test"
import type {
  APIRequestContext,
  APIResponse,
  Browser,
  BrowserContext,
  Locator,
  Page,
  Request as PageRequest,
  Response as PageResponse,
} from "@playwright/test"

import {
  getParticipantName,
  getTeamMembers,
  resolveParticipantCurrentScore,
  resolveTeamCurrentWon,
} from "@/lib/match-result-slots"
import type { PageResult } from "@/types/page"
import type { MatchResponse, MatchResultRequest } from "@/types/tournament/match"
import type { RoundGroupResponse, RoundGroupType } from "@/types/tournament/round/round-group"
import type { SimpleRoundResponse } from "@/types/tournament/round/round"
import type { SimpleTeamResponse } from "@/types/tournament/team"
import { Role } from "@/types/user/user"
import { DebateFormat } from "@/types/tournament/tournament"
import type { SimpleTournamentResponse } from "@/types/tournament/tournament"

const execFileAsync = promisify(execFile)
export const EVIDENCE_ROOT = path.resolve("test-results/tournament-integrity/luna-browser-v2")
export const FIXTURE_IDS = [9101, 9102, 9103, 9104, 9105, 9106] as const
export const CONTROL_BASE_URL = "http://127.0.0.1:18081"
export const DEFAULT_READY_URL = `${CONTROL_BASE_URL}/ready`
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])

export type IntegrityConfig = {
  frontendBaseURL: string
  apiBaseURL: string
  readyURL: string
  organizerUsername: string
  organizerPassword: string
  debaterUsername: string
  debaterPassword: string
  allowWrites: true
}

export type IntegrityStage = "preliminary" | "team" | "solo"

export type IntegrityMatch = {
  id: number
  completed: boolean
  winnerParticipantId: number | null
  participantScoresComplete: boolean | null
  participantScoresRepairable: boolean | null
  teams: Array<{
    slot: "team1" | "team2" | "team3" | "team4"
    id: number
    name: string
    speakers: Array<{ id: number; name: string; score: number | null }>
    score: number | null
    won: boolean | null
  }>
  debaters: Array<{ id: number; name: string; score: number | null }>
  room: string | null
  judge: string | null
}

export type IntegrityRound = {
  id: number
  name: string
  roundNumber: number
  format: DebateFormat
  matches: IntegrityMatch[]
}

export type IntegrityStageSnapshot = {
  id: number
  type: RoundGroupType
  stage: IntegrityStage
  format: DebateFormat
  currentRoundNumber: number | null
  rounds: IntegrityRound[]
}

export type IntegrityInventory = {
  tournament: Pick<SimpleTournamentResponse, "id" | "name" | "preliminaryFormat" | "teamEliminationFormat">
  stages: IntegrityStageSnapshot[]
}

export type RuntimeConsoleDiagnostic = {
  level: "error" | "warn"
  argumentTypes: string[]
  argumentTemplates: string[]
  stack: string | null
  location: string | null
}

export type SessionPurpose = "ui-tournament" | "api-only" | "anonymous-ui"

export type RuntimeEvidencePhase = "open" | "closing" | "closed"

export type VoidMutationOwner = {
  caseName: string
  mutationName: string
}

export type VoidMutationTerminalOutcome = "pending" | "normal" | "accepted-abort" | "unexpected-failure"

export type ExpectedVoidMutationAbort = {
  correlationId: string
  caseName: string
  mutationName: string
  method: "PATCH"
  path: string
  status: 200
  failure: "net::ERR_ABORTED"
}

export type RequestEvidenceClassification =
  | "pending"
  | "response"
  | "expected-next-link-prefetch-abort"
  | "expected-void-mutation-abort"
  | "context-close-cancelled"
  | "expected-auth-probe-failure"
  | "blocked-request"
  | "unexpected-request-failure"

export type ContextCloseCancellationEvidence = {
  correlationId: string
  sequence: number
  closeBoundarySequence: number
  phase: "closing"
  method: "GET"
  path: string
  resourceType: "script" | "fetch"
  isLocalRequest: true
  isNavigationRequest: false
  query: { mode: string | null; rscPresent: boolean }
  headers: {
    rsc: string | null
    nextRouterPrefetch: string | null
    nextRouterSegmentPrefetch: string | null
  }
  responseObserved: false
  responseStatus: null
  failure: null
  voidMutationCorrelationId: null
  voidMutationOwner: null
  classification: "context-close-cancelled"
}

export type NextLinkPrefetchRequestEvidence = {
  correlationId: string
  sequence: number
  phaseAtRequest: RuntimeEvidencePhase
  url: string
  path: string
  query: { mode: string | null; rscPresent: boolean }
  method: string
  resourceType: string
  isLocalRequest: boolean
  isNavigationRequest: boolean
  sessionId: string | null
  sessionPurpose: SessionPurpose | null
  sessionExpectedRole: Role | null
  headers: {
    rsc: string | null
    nextRouterPrefetch: string | null
    nextRouterSegmentPrefetch: string | null
  }
  pagePathAtRequest: string | null
  pagePathAtFailure: string | null
  expectedTournamentPathAtRequest: string | null
  expectedTournamentPathAtFailure: string | null
  mainFrameAuthNavigationObserved: boolean
  responseObserved: boolean
  responseStatus: number | null
  failure: string | null
  classification: RequestEvidenceClassification
  voidMutationCorrelationId: string | null
  voidMutationOwner: VoidMutationOwner | null
  voidMutationTerminalOutcome: VoidMutationTerminalOutcome | null
}

export type ExpectedNextLinkPrefetchAbort = NextLinkPrefetchRequestEvidence & {
  classification: "expected-next-link-prefetch-abort"
  failure: "net::ERR_ABORTED"
}

export type RuntimeEvidence = {
  sessionId: string | null
  sessionPurpose: SessionPurpose | null
  sessionExpectedRole: Role | null
  phase: RuntimeEvidencePhase
  closeBoundarySequence: number | null
  consoleErrors: string[]
  consoleDiagnostics: RuntimeConsoleDiagnostic[]
  requestFailures: string[]
  httpErrors: Array<{ status: number; path: string }>
  localNextScriptResponses: Array<{ status: number; path: string }>
  expectedVoidMutationAborts: ExpectedVoidMutationAbort[]
  expectedNextLinkPrefetchAborts: ExpectedNextLinkPrefetchAbort[]
  contextCloseCancellations: ContextCloseCancellationEvidence[]
  requestEvidence: NextLinkPrefetchRequestEvidence[]
  unexpectedAuthNavigations: Array<{ path: string; pagePathAtRequest: string | null }>
  expectedAuthProbeResponses: Array<{ status: number; path: string }>
  expectedAuthProbeConsoleWarnings: string[]
  expectedAuthProbeFailures: string[]
  blockedRequests: string[]
}

export type VoidMutationTerminalRecord = {
  correlationId: string
  owner: VoidMutationOwner | null
  method: string
  path: string
  responseObserved: boolean
  responseStatus: number | null
  failure: string | null
  terminalOutcome: VoidMutationTerminalOutcome | null
}

export type VoidMutationTerminalReconciliation = {
  valid: boolean
  timedOut: boolean
  records: VoidMutationTerminalRecord[]
  acceptedAborts: ExpectedVoidMutationAbort[]
  pendingCorrelationIds: string[]
  orphanCorrelationIds: string[]
  duplicateCorrelationIds: string[]
  duplicateOwnerKeys: string[]
  invalidCorrelationIds: string[]
  missingRuntimeCorrelationIds: string[]
  missingRuntimeOwnerKeys: string[]
  errors: string[]
}

export type PersistedVoidMutationRecord = {
  correlationId: string
  caseName: string
  mutationName: string
  recordName: string
}

export type VoidMutationBijectionValidation = {
  valid: boolean
  acceptedCorrelationIds: string[]
  persistedCorrelationIds: string[]
  missingPersistedCorrelationIds: string[]
  orphanPersistedCorrelationIds: string[]
  duplicateAcceptedCorrelationIds: string[]
  duplicatePersistedCorrelationIds: string[]
  duplicateOwnerKeys: string[]
  orphanRuntimeCorrelationIds: string[]
  wrongMetadataCorrelationIds: string[]
  terminalErrors: string[]
  errors: string[]
}

export type SessionNavigationEvidence = {
  expectedPath: string | null
  status: number | null
  finalPath: string | null
  noAuthRedirect: boolean | null
  browserUsersMeStatus: number | null
}

export type SessionAuthEvidence = {
  sessionId: string
  purpose: SessionPurpose
  authPost: { method: "POST"; path: "/api/auth/login"; status: number } | null
  authGet: { method: "GET"; path: "/api/users/me"; status: number } | null
  usernamePresent: boolean
  passwordPresent: boolean
  expectedRole: Role | null
  verifiedRole: string | null
  verifiedUsernameHash: string | null
  verifiedUserId: number | null
  navigation: SessionNavigationEvidence
  navigationHistory: SessionNavigationEvidence[]
}

export type IntegritySession = {
  sessionId: string
  context: BrowserContext
  page: Page
  runtime: RuntimeEvidence
  authEvidence: SessionAuthEvidence
}

export type ReleaseBuildEvidence = {
  mode: "release-matrix"
  preBuildNextExistedBeforeRemoval: boolean
  preBuildNextRemoved: true
  envIsolationEvidencePath: string
  controlInstanceIdHash: string
  buildId: string
  buildLogPath: string
  buildLogHash: string
  buildExit: number
  explicitEnv: {
    BACKEND_URL: string
    NEXT_PUBLIC_API_URL: string
    NEXT_PUBLIC_PREVIEW_MODE: "false"
    NEXT_PUBLIC_PREVIEW_ROLE: "participant"
    NEXT_PUBLIC_DEMO_MODE: "false"
    NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: "1"
    TOURNAMENT_INTEGRITY_RELEASE_MATRIX: "1"
    NODE_ENV: "production"
  }
  packageLockHash: string
  sourceHashBeforeRun: string
}

export type ReadyReport = {
  ready: boolean
  instanceToken?: string
  instanceIdHash?: string
  [key: string]: unknown
}

export type IntegrityFixture = {
  fixtureId: number
  tournamentId: number
  resetURL: string
  resetMethod: "POST" | "PUT" | "PATCH"
  stateURL: string
}

export type RunEvidence = {
  id: string
  root: string
  manifestPath: string
  startedAt: string
  authSessions: SessionAuthEvidence[]
  persistedAuthEvidenceSessionIds: Set<string>
  releaseBuildEvidence: ReleaseBuildEvidence | null
}

export type RuntimeEvidencePersistenceRecordKind = "runtime-diagnostics" | "expected-next-link-prefetch" | "context-close-cancellation"

export type RuntimeEvidencePersistenceMetadata = {
  schemaVersion: 1
  source: "final-reconciled-per-session-runtime"
  sessionId: string
  recordKind: RuntimeEvidencePersistenceRecordKind
  snapshotHash: string
  sanitized: true
  contextClosed: boolean
  finalSuiteSnapshot: boolean
  runtimeDiagnosticsFile: string
  expectedNextLinkPrefetchEvidenceFile: string
  contextCloseCancellationEvidenceFile: string
}

export type RuntimeEvidencePersistenceRecords = {
  diagnostics: {
    sessionId: string
    preCloseRuntime: RuntimeEvidence | null
    finalRuntime: RuntimeEvidence
    runtime: RuntimeEvidence
    persistence: RuntimeEvidencePersistenceMetadata
  }
  prefetch: {
    sessionId: string
    expectedNextLinkPrefetchAborts: ExpectedNextLinkPrefetchAbort[]
    requestEvidence: NextLinkPrefetchRequestEvidence[]
    persistence: RuntimeEvidencePersistenceMetadata
  }
  closeCancellations: {
    sessionId: string
    contextCloseCancellations: ContextCloseCancellationEvidence[]
    persistence: RuntimeEvidencePersistenceMetadata
  }
}

export type RuntimeEvidencePersistenceFile = {
  fileName: string
  value: unknown
}

export type RuntimeEvidencePersistenceFiles = {
  diagnostics: RuntimeEvidencePersistenceFile[]
  prefetch: RuntimeEvidencePersistenceFile[]
  closeCancellations: RuntimeEvidencePersistenceFile[]
  readErrors: string[]
}

export type ExpectedRuntimeEvidencePersistence = {
  sessionId: string
  records: RuntimeEvidencePersistenceRecords
}

export type RuntimeEvidencePersistenceValidation = {
  valid: boolean
  errors: string[]
  expectedSessionIds: string[]
  actualDiagnosticsFileNames: string[]
  actualPrefetchFileNames: string[]
  actualDiagnosticsSessionIds: string[]
  actualPrefetchSessionIds: string[]
  missingDiagnosticsFileNames: string[]
  missingPrefetchFileNames: string[]
  missingDiagnosticsSessionIds: string[]
  missingPrefetchSessionIds: string[]
  extraDiagnosticsFileNames: string[]
  extraPrefetchFileNames: string[]
  actualCloseCancellationFileNames: string[]
  actualCloseCancellationSessionIds: string[]
  missingCloseCancellationFileNames: string[]
  missingCloseCancellationSessionIds: string[]
  extraCloseCancellationFileNames: string[]
  duplicateCloseCancellationFileNames: string[]
  duplicateDiagnosticsFileNames: string[]
  duplicatePrefetchFileNames: string[]
  missingSessionIds: string[]
  extraSessionIds: string[]
  staleSessionIds: string[]
  recordMismatches: Array<{ sessionId: string; recordKinds: RuntimeEvidencePersistenceRecordKind[]; issues: string[] }>
}

export type RuntimeEvidencePersistenceSelfCheckReport = {
  passed: true
  staleSnapshotDetected: true
  extraSessionDetected: true
  missingSessionDetected: true
  zeroAbortSessionValid: true
  zeroCloseCancellationSessionValid: true
  nonZeroCloseCancellationSessionValid: true
}

export type PersistedContextCloseCancellationRecord = {
  sessionId: string
  contextCloseCancellations: ContextCloseCancellationEvidence[]
}

export type ContextCloseCancellationBijectionValidation = {
  valid: boolean
  runtimeCorrelationIds: string[]
  persistedCorrelationIds: string[]
  missingPersistedCorrelationIds: string[]
  orphanPersistedCorrelationIds: string[]
  duplicateRuntimeCorrelationIds: string[]
  duplicatePersistedCorrelationIds: string[]
  duplicateRuntimeEvidenceCorrelationIds: string[]
  invalidRuntimeEvidenceCorrelationIds: string[]
  missingRuntimeEvidenceCorrelationIds: string[]
  invalidRuntimeCorrelationIds: string[]
  wrongMetadataCorrelationIds: string[]
  wrongSessionCorrelationIds: string[]
  errors: string[]
}

export type ContextCloseCancellationSelfCheckReport = {
  passed: true
  acceptedStaticFixtureCount: 2
  preClosePendingRejected: true
  apiRejected: true
  documentRejected: true
  navigationRejected: true
  authRejected: true
  appFetchRejected: true
  mutationRejected: true
  ownedVoidNeverCancelled: true
  httpErrorRejected: true
  failureRejected: true
  missingDurableRejected: true
  extraDurableRejected: true
  duplicateDurableRejected: true
  zeroBijectionAccepted: true
}

export type MutationResponse = {
  url: string
  method: string
  status: number
  ok: boolean
  requestBody: string | null
  responseBody: string
}

const stageByType: Partial<Record<RoundGroupType, IntegrityStage>> = {
  PRELIMINARY: "preliminary",
  TEAM_ELIMINATION: "team",
  SOLO_ELIMINATION: "solo",
}

const isLocalURL = (rawURL: string) => {
  const url = new URL(rawURL)
  return url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname)
}

const isExactAuthProbeURL = (rawURL: string) => {
  try {
    return new URL(rawURL).pathname === "/api/users/me"
  } catch {
    return false
  }
}

const isAuthProbeResource = (resourceType: string) => resourceType === "fetch" || resourceType === "xhr"
const isVoidMutationPath = (rawURL: string) => {
  const pathname = new URL(rawURL).pathname
  return /^\/api\/tournaments\/\d+\/round-groups\/\d+\/rounds\/\d+\/matches\/results$/.test(pathname) ||
    /^\/api\/tournaments\/\d+\/round-groups\/\d+\/proceed$/.test(pathname)
}
const isAllowedVoidMutationRequest = (rawURL: string, method: string) => method === "PATCH" && isVoidMutationPath(rawURL)
const isLocalNextScriptURL = (rawURL: string) => {
  const url = new URL(rawURL)
  return isLocalURL(rawURL) && url.pathname.startsWith("/_next/")
}

const pagePathFromURL = (rawURL: string) => {
  try {
    const url = new URL(rawURL)
    return isLocalURL(rawURL) ? url.pathname : null
  } catch {
    return null
  }
}

const selectedPrefetchHeader = (value: string | undefined) => {
  if (value === undefined) return null
  if (value === "") return ""
  return value === "1" ? "1" : "[present]"
}

const readSelectedPrefetchHeader = (headers: Record<string, string>, name: string) => {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name)
  return selectedPrefetchHeader(key ? headers[key] : undefined)
}

const sanitizeNextLinkURL = (rawURL: string) => {
  const url = new URL(rawURL)
  const rawMode = url.searchParams.get("mode")
  const mode = rawMode === "login" || rawMode === "register" ? rawMode : rawMode === null ? null : "[other]"
  const rawRsc = url.searchParams.get("_rsc")
  const query = [
    mode === null ? null : `mode=${encodeURIComponent(mode)}`,
    rawRsc === null ? null : `_rsc=${rawRsc.length > 0 ? "[present]" : "[empty]"}`,
  ].filter((entry): entry is string => entry !== null)
  return {
    url: `${url.pathname}${query.length > 0 ? `?${query.join("&")}` : ""}`,
    path: url.pathname,
    query: { mode, rscPresent: rawRsc !== null && rawRsc.length > 0 },
  }
}

type NextLinkPrefetchClassifierOverrides =
  Partial<Omit<NextLinkPrefetchRequestEvidence, "query" | "headers">> & {
    query?: Partial<NextLinkPrefetchRequestEvidence["query"]>
    headers?: Partial<NextLinkPrefetchRequestEvidence["headers"]>
  }

export function isExpectedNextLinkPrefetchAbort(request: NextLinkPrefetchRequestEvidence) {
  const expectedPath = request.expectedTournamentPathAtRequest
  return request.method === "GET" &&
    request.path === "/auth" &&
    (request.query.mode === "login" || request.query.mode === "register") &&
    request.query.rscPresent &&
    request.failure === "net::ERR_ABORTED" &&
    request.resourceType === "fetch" &&
    request.isNavigationRequest === false &&
    request.headers.rsc === "1" &&
    request.headers.nextRouterPrefetch === "1" &&
    request.headers.nextRouterSegmentPrefetch !== null &&
    request.responseObserved === false &&
    request.responseStatus === null &&
    expectedPath !== null &&
    /^\/tournament\/\d+$/.test(expectedPath) &&
    request.expectedTournamentPathAtFailure === expectedPath &&
    request.pagePathAtRequest === expectedPath &&
    request.pagePathAtFailure === expectedPath &&
    request.mainFrameAuthNavigationObserved === false
}

const makeNextLinkPrefetchClassifierFixture = (overrides: NextLinkPrefetchClassifierOverrides = {}): NextLinkPrefetchRequestEvidence => ({
  correlationId: "next-link-prefetch-self-check-1",
  sequence: 1,
  phaseAtRequest: "open",
  url: "/auth?mode=login&_rsc=[present]",
  path: "/auth",
  method: "GET",
  resourceType: "fetch",
  isLocalRequest: true,
  isNavigationRequest: false,
  sessionId: "prefetch-self-check-session",
  sessionPurpose: "ui-tournament",
  sessionExpectedRole: null,
  pagePathAtRequest: "/tournament/9102",
  pagePathAtFailure: "/tournament/9102",
  expectedTournamentPathAtRequest: "/tournament/9102",
  expectedTournamentPathAtFailure: "/tournament/9102",
  mainFrameAuthNavigationObserved: false,
  responseObserved: false,
  responseStatus: null,
  failure: "net::ERR_ABORTED",
  classification: "pending",
  voidMutationCorrelationId: null,
  voidMutationOwner: null,
  voidMutationTerminalOutcome: null,
  ...overrides,
  query: { mode: "login", rscPresent: true, ...overrides.query },
  headers: {
    rsc: "1",
    nextRouterPrefetch: "1",
    nextRouterSegmentPrefetch: "1",
    ...overrides.headers,
  },
})

export type NextLinkPrefetchClassifierSelfCheckReport = {
  passed: true
  caseCount: number
  negativeCaseCount: number
  caseNames: string[]
  conditions: string[]
}

const NEXT_LINK_PREFETCH_CLASSIFIER_CONDITIONS = [
  "method",
  "path",
  "mode",
  "rsc-query",
  "failure",
  "resource",
  "navigation",
  "rsc-header",
  "router-prefetch-header",
  "segment-prefetch-header",
  "response-observed",
  "response-status",
  "expected-path-present",
  "expected-path-format",
  "expected-path-at-failure",
  "page-path-at-request",
  "page-path-at-failure",
  "main-frame-auth-navigation",
]

export function assertExpectedNextLinkPrefetchAbortClassifierSelfChecks(): NextLinkPrefetchClassifierSelfCheckReport {
  const cases: Array<{ name: string; expected: boolean; overrides?: NextLinkPrefetchClassifierOverrides }> = [
    { name: "valid login prefetch", expected: true },
    { name: "valid register prefetch", expected: true, overrides: { query: { mode: "register" } } },
    { name: "wrong method", expected: false, overrides: { method: "POST" } },
    { name: "wrong path", expected: false, overrides: { path: "/api/auth/login" } },
    { name: "wrong mode", expected: false, overrides: { query: { mode: "reset" } } },
    { name: "missing mode", expected: false, overrides: { query: { mode: null } } },
    { name: "missing rsc query", expected: false, overrides: { query: { rscPresent: false } } },
    { name: "wrong failure", expected: false, overrides: { failure: "net::ERR_FAILED" } },
    { name: "document request", expected: false, overrides: { resourceType: "document" } },
    { name: "navigation request", expected: false, overrides: { isNavigationRequest: true } },
    { name: "missing rsc header", expected: false, overrides: { headers: { rsc: null } } },
    { name: "wrong rsc header", expected: false, overrides: { headers: { rsc: "[present]" } } },
    { name: "missing router prefetch header", expected: false, overrides: { headers: { nextRouterPrefetch: null } } },
    { name: "wrong router prefetch header", expected: false, overrides: { headers: { nextRouterPrefetch: "[present]" } } },
    { name: "missing segment prefetch header", expected: false, overrides: { headers: { nextRouterSegmentPrefetch: null } } },
    { name: "response observed with null status", expected: false, overrides: { responseObserved: true, responseStatus: null } },
    { name: "response status without observed response", expected: false, overrides: { responseObserved: false, responseStatus: 200 } },
    { name: "response observed", expected: false, overrides: { responseObserved: true, responseStatus: 200 } },
    { name: "page path at request mismatch alone", expected: false, overrides: { pagePathAtRequest: "/auth" } },
    { name: "failure path mismatch alone", expected: false, overrides: { pagePathAtFailure: "/auth" } },
    { name: "expected path absent", expected: false, overrides: { expectedTournamentPathAtRequest: null } },
    {
      name: "expected path format mismatch alone",
      expected: false,
      overrides: {
        expectedTournamentPathAtRequest: "/auth",
        expectedTournamentPathAtFailure: "/auth",
        pagePathAtRequest: "/auth",
        pagePathAtFailure: "/auth",
      },
    },
    { name: "expected path mismatch", expected: false, overrides: { expectedTournamentPathAtRequest: "/tournament/9103", expectedTournamentPathAtFailure: "/tournament/9103" } },
    { name: "expected failure path absent", expected: false, overrides: { expectedTournamentPathAtFailure: null } },
    { name: "expected failure path mismatch alone", expected: false, overrides: { expectedTournamentPathAtFailure: "/tournament/9103" } },
    { name: "main-frame auth navigation observed", expected: false, overrides: { mainFrameAuthNavigationObserved: true } },
    { name: "Java void mutation", expected: false, overrides: { method: "PATCH", path: "/api/tournaments/9102/round-groups/91021/proceed" } },
    { name: "actual auth document navigation", expected: false, overrides: { resourceType: "document", isNavigationRequest: true } },
  ]
  for (const entry of cases) {
    const actual = isExpectedNextLinkPrefetchAbort(makeNextLinkPrefetchClassifierFixture(entry.overrides))
    if (actual !== entry.expected) throw new Error(`Next-link prefetch classifier self-check failed for ${entry.name}.`)
  }
  return {
    passed: true,
    caseCount: cases.length,
    negativeCaseCount: cases.filter((entry) => !entry.expected).length,
    caseNames: cases.map((entry) => entry.name),
    conditions: [...NEXT_LINK_PREFETCH_CLASSIFIER_CONDITIONS],
  }
}

export const expectedNextLinkPrefetchAbortClassifierSelfCheckReport = assertExpectedNextLinkPrefetchAbortClassifierSelfChecks()

const isAPIPath = (pathname: string) => pathname === "/api" || pathname.startsWith("/api/")
const isAuthPath = (pathname: string) => pathname === "/auth" || pathname.startsWith("/auth/")
const isLocalNextStaticRouteChunkPath = (pathname: string) => /^\/_next\/static\/chunks\/.+\.js$/.test(pathname)

const isExplicitNonAuthNextRscPrefetch = (request: NextLinkPrefetchRequestEvidence) =>
  request.resourceType === "fetch" &&
  !isAPIPath(request.path) &&
  !isAuthPath(request.path) &&
  !request.path.startsWith("/_next/") &&
  request.query.rscPresent &&
  request.headers.rsc === "1" &&
  request.headers.nextRouterPrefetch === "1" &&
  request.headers.nextRouterSegmentPrefetch !== null

const isStrictContextCloseCancellationPath = (value: {
  path: string
  resourceType: "script" | "fetch"
  query: { mode: string | null; rscPresent: boolean }
  headers: ContextCloseCancellationEvidence["headers"]
}) =>
  (value.resourceType === "script" && isLocalNextStaticRouteChunkPath(value.path)) ||
  (value.resourceType === "fetch" &&
    !isAPIPath(value.path) &&
    !isAuthPath(value.path) &&
    !value.path.startsWith("/_next/") &&
    value.query.rscPresent &&
    value.headers.rsc === "1" &&
    value.headers.nextRouterPrefetch === "1" &&
    value.headers.nextRouterSegmentPrefetch !== null)

const isBenignContextCloseRequestShape = (
  request: NextLinkPrefetchRequestEvidence,
  closeBoundarySequence: number,
) =>
  Number.isInteger(closeBoundarySequence) &&
  closeBoundarySequence >= 0 &&
  request.sequence > closeBoundarySequence &&
  request.phaseAtRequest === "closing" &&
  request.method === "GET" &&
  request.isLocalRequest &&
  request.isNavigationRequest === false &&
  request.voidMutationCorrelationId === null &&
  request.voidMutationOwner === null &&
  request.responseObserved === false &&
  request.responseStatus === null &&
  request.failure === null &&
  request.classification === "pending" &&
  ((request.resourceType === "script" && isLocalNextStaticRouteChunkPath(request.path)) || isExplicitNonAuthNextRscPrefetch(request))

export function isContextCloseCancellationCandidate(
  request: NextLinkPrefetchRequestEvidence,
  closeBoundarySequence: number,
) {
  return isBenignContextCloseRequestShape(request, closeBoundarySequence)
}

const contextCloseCancellationKeys = [
  "correlationId",
  "sequence",
  "closeBoundarySequence",
  "phase",
  "method",
  "path",
  "resourceType",
  "isLocalRequest",
  "isNavigationRequest",
  "query",
  "headers",
  "responseObserved",
  "responseStatus",
  "failure",
  "voidMutationCorrelationId",
  "voidMutationOwner",
  "classification",
] as const

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

const isSelectedPrefetchHeaders = (value: unknown): value is ContextCloseCancellationEvidence["headers"] => {
  if (!isObjectRecord(value) || !hasExactKeys(value, ["rsc", "nextRouterPrefetch", "nextRouterSegmentPrefetch"])) return false
  return [value.rsc, value.nextRouterPrefetch, value.nextRouterSegmentPrefetch].every((entry) => entry === null || typeof entry === "string")
}

const isContextCloseCancellationEvidence = (value: unknown): value is ContextCloseCancellationEvidence => {
  if (!isObjectRecord(value) || !hasExactKeys(value, contextCloseCancellationKeys)) return false
  if (!isObjectRecord(value.query) || !hasExactKeys(value.query, ["mode", "rscPresent"])) return false
  if (value.query.mode !== null && typeof value.query.mode !== "string") return false
  if (typeof value.query.rscPresent !== "boolean" || !isSelectedPrefetchHeaders(value.headers)) return false
  return typeof value.correlationId === "string" &&
    value.correlationId.length > 0 &&
    typeof value.sequence === "number" &&
    Number.isInteger(value.sequence) &&
    typeof value.closeBoundarySequence === "number" &&
    Number.isInteger(value.closeBoundarySequence) &&
    value.closeBoundarySequence >= 0 &&
    value.sequence > value.closeBoundarySequence &&
    value.phase === "closing" &&
    value.method === "GET" &&
    typeof value.path === "string" &&
    (value.resourceType === "script" || value.resourceType === "fetch") &&
    value.isLocalRequest === true &&
    value.isNavigationRequest === false &&
    value.responseObserved === false &&
    value.responseStatus === null &&
    value.failure === null &&
    value.voidMutationCorrelationId === null &&
    value.voidMutationOwner === null &&
    value.classification === "context-close-cancelled" &&
    isStrictContextCloseCancellationPath({
      path: value.path,
      resourceType: value.resourceType,
      query: value.query as ContextCloseCancellationEvidence["query"],
      headers: value.headers,
    })
}

const asContextCloseCancellationEvidence = (
  request: NextLinkPrefetchRequestEvidence,
  closeBoundarySequence: number,
): ContextCloseCancellationEvidence => {
  if (!isContextCloseCancellationCandidate(request, closeBoundarySequence)) {
    throw new Error(`Request ${request.correlationId} is not an eligible context-close cancellation.`)
  }
  return {
    correlationId: request.correlationId,
    sequence: request.sequence,
    closeBoundarySequence,
    phase: "closing",
    method: "GET",
    path: request.path,
    resourceType: request.resourceType as "script" | "fetch",
    isLocalRequest: true,
    isNavigationRequest: false,
    query: { ...request.query },
    headers: { ...request.headers },
    responseObserved: false,
    responseStatus: null,
    failure: null,
    voidMutationCorrelationId: null,
    voidMutationOwner: null,
    classification: "context-close-cancelled",
  }
}

export function isExpectedContextCloseCancellation(
  request: NextLinkPrefetchRequestEvidence,
  closeBoundarySequence: number,
) {
  if (request.classification !== "context-close-cancelled") return false
  return isBenignContextCloseRequestShape({ ...request, classification: "pending" }, closeBoundarySequence)
}

export function reconcileContextCloseCancellations(evidence: RuntimeEvidence) {
  if (evidence.phase !== "closed" || evidence.closeBoundarySequence === null) return [...evidence.contextCloseCancellations]
  const observed = new Set(evidence.contextCloseCancellations.map((entry) => entry.correlationId))
  for (const request of evidence.requestEvidence) {
    if (!isContextCloseCancellationCandidate(request, evidence.closeBoundarySequence) || observed.has(request.correlationId)) continue
    request.classification = "context-close-cancelled"
    evidence.contextCloseCancellations.push(asContextCloseCancellationEvidence({ ...request, classification: "pending" }, evidence.closeBoundarySequence))
    observed.add(request.correlationId)
  }
  return [...evidence.contextCloseCancellations]
}

const hasExpectedAnonymousAuthProbeRequestShape = (request: NextLinkPrefetchRequestEvidence) => {
  const expectedPath = request.expectedTournamentPathAtRequest
  return request.isLocalRequest &&
    request.method === "GET" &&
    request.path === "/api/users/me" &&
    isAuthProbeResource(request.resourceType) &&
    request.isNavigationRequest === false &&
    request.sessionId !== null &&
    request.sessionId.length > 0 &&
    request.sessionPurpose === "anonymous-ui" &&
    request.sessionExpectedRole === null &&
    expectedPath !== null &&
    /^\/tournament\/\d+$/.test(expectedPath) &&
    request.pagePathAtRequest === expectedPath &&
    request.mainFrameAuthNavigationObserved === false &&
    request.responseObserved === true &&
    (request.responseStatus === 401 || request.responseStatus === 403)
}

export const isExpectedAuthProbeFailureEvidence = (request: NextLinkPrefetchRequestEvidence) =>
  hasExpectedAnonymousAuthProbeRequestShape(request) &&
  request.failure === "net::ERR_ABORTED" &&
  request.expectedTournamentPathAtFailure === request.expectedTournamentPathAtRequest &&
  request.pagePathAtFailure === request.expectedTournamentPathAtRequest

const isExpectedAuthProbeResponseEvidence = (request: NextLinkPrefetchRequestEvidence) =>
  hasExpectedAnonymousAuthProbeRequestShape(request) &&
  (request.failure === null || request.failure === "net::ERR_ABORTED")

const makeAuthProbeClassifierFixture = (overrides: NextLinkPrefetchClassifierOverrides = {}): NextLinkPrefetchRequestEvidence => ({
  ...makeNextLinkPrefetchClassifierFixture({
    correlationId: "auth-probe-self-check-1",
    url: "/api/users/me",
    path: "/api/users/me",
    query: { mode: null, rscPresent: false },
    method: "GET",
    resourceType: "fetch",
    isLocalRequest: true,
    isNavigationRequest: false,
    sessionId: "anonymous-auth-probe-self-check",
    sessionPurpose: "anonymous-ui",
    sessionExpectedRole: null,
    pagePathAtRequest: "/tournament/9102",
    pagePathAtFailure: "/tournament/9102",
    expectedTournamentPathAtRequest: "/tournament/9102",
    expectedTournamentPathAtFailure: "/tournament/9102",
    mainFrameAuthNavigationObserved: false,
    responseObserved: true,
    responseStatus: 401,
    failure: "net::ERR_ABORTED",
    classification: "pending",
    voidMutationCorrelationId: null,
    voidMutationOwner: null,
    voidMutationTerminalOutcome: null,
  }),
  ...overrides,
  query: { mode: null, rscPresent: false, ...overrides.query },
  headers: {
    rsc: null,
    nextRouterPrefetch: null,
    nextRouterSegmentPrefetch: null,
    ...overrides.headers,
  },
})

export type AuthProbeClassifierSelfCheckReport = {
  passed: true
  cleanCaseCount: number
  fatalCaseCount: number
  caseNames: string[]
}

export const RESPONSE_TIMEOUT_MS = 30_000
export const TAB_ACTIVATION_TIMEOUT_MS = 1_500
const TAB_HYDRATION_TIMEOUT_MS = 2_500
const TAB_ACTIVATION_RELOAD_TIMEOUT_MS = 1_500

const safeFilePart = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "")

const safePath = (rawURL: string) => {
  try {
    const url = new URL(rawURL)
    return `${url.pathname}${url.search}`
      .replace(/([?&]_rsc=)([^&]*)/gi, (_match, prefix: string, value: string) => `${prefix}${value ? "[present]" : "[empty]"}`)
      .replace(/(password|token|secret|authorization|cookie|username|email|phone|mobile|address|contact)=[^&]*/gi, "$1=[redacted]")
  } catch {
    return rawURL
      .replace(/([?&]_rsc=)([^&\s]*)/gi, (_match, prefix: string, value: string) => `${prefix}${value ? "[present]" : "[empty]"}`)
      .replace(/(password|token|secret|authorization|cookie|username|email|phone|mobile|address|contact)=\S+/gi, "$1=[redacted]")
  }
}

const sanitizeDiagnosticText = (value: string, sensitiveValues: readonly string[]) => {
  let sanitized = value
  for (const sensitiveValue of sensitiveValues) {
    if (sensitiveValue) sanitized = sanitized.split(sensitiveValue).join("[redacted]")
  }
  return sanitized.replace(/((?:password|token|secret|authorization|cookie|username|email|phone|mobile|address|contact)=)[^&\s]*/gi, "$1[redacted]")
}

const sanitizeRuntimeConsoleText = (value: string, sensitiveValues: readonly string[]) => sanitizeDiagnosticText(value, sensitiveValues)
  .replace(/https?:\/\/(?:localhost|127\.0\.0\.1|\[?::1\])(?::\d+)?/gi, "")
  .replace(/https?:\/\/[^\s)]+/gi, "[redacted-url]")
  .replace(/\/(?:Users|home)\/[^\s)]+/gi, "[redacted-path]")
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
  .slice(0, 8_192)

const sanitizeRuntimeConsoleLocation = (value: string | null, sensitiveValues: readonly string[]) => {
  if (!value) return null
  const sanitized = sanitizeRuntimeConsoleText(value, sensitiveValues)
  try {
    const url = new URL(sanitized)
    return isLocalURL(sanitized) ? url.pathname : "[redacted-external-location]"
  } catch {
    return sanitized.split(/[?#]/, 1)[0].slice(0, 2_048) || null
  }
}

const sanitizeRuntimeConsoleDiagnostic = (
  diagnostic: RuntimeConsoleDiagnostic,
  sensitiveValues: readonly string[],
): RuntimeConsoleDiagnostic => ({
  level: diagnostic.level,
  argumentTypes: diagnostic.argumentTypes.slice(0, 32).map((value) => value.slice(0, 64)),
  argumentTemplates: diagnostic.argumentTemplates.slice(0, 32).map((value) => sanitizeRuntimeConsoleText(value, sensitiveValues)),
  stack: diagnostic.stack ? sanitizeRuntimeConsoleText(diagnostic.stack, sensitiveValues) : null,
  location: sanitizeRuntimeConsoleLocation(diagnostic.location, sensitiveValues),
})

const sanitizeNextLinkPrefetchRequest = (
  entry: NextLinkPrefetchRequestEvidence,
  sensitiveValues: readonly string[],
): NextLinkPrefetchRequestEvidence => ({
  ...entry,
  url: sanitizeDiagnosticText(entry.url, sensitiveValues),
  path: sanitizeDiagnosticText(entry.path, sensitiveValues),
  query: { mode: entry.query.mode, rscPresent: entry.query.rscPresent },
  pagePathAtRequest: entry.pagePathAtRequest ? sanitizeDiagnosticText(entry.pagePathAtRequest, sensitiveValues) : null,
  pagePathAtFailure: entry.pagePathAtFailure ? sanitizeDiagnosticText(entry.pagePathAtFailure, sensitiveValues) : null,
  expectedTournamentPathAtRequest: entry.expectedTournamentPathAtRequest ? sanitizeDiagnosticText(entry.expectedTournamentPathAtRequest, sensitiveValues) : null,
  expectedTournamentPathAtFailure: entry.expectedTournamentPathAtFailure ? sanitizeDiagnosticText(entry.expectedTournamentPathAtFailure, sensitiveValues) : null,
})

const sanitizeExpectedNextLinkPrefetchAbort = (
  entry: ExpectedNextLinkPrefetchAbort,
  sensitiveValues: readonly string[],
): ExpectedNextLinkPrefetchAbort => ({
  ...sanitizeNextLinkPrefetchRequest(entry, sensitiveValues),
  classification: "expected-next-link-prefetch-abort",
  failure: "net::ERR_ABORTED",
})

const sanitizeContextCloseCancellation = (
  entry: ContextCloseCancellationEvidence,
  sensitiveValues: readonly string[],
): ContextCloseCancellationEvidence => ({
  ...entry,
  path: sanitizeDiagnosticText(entry.path, sensitiveValues),
  query: { ...entry.query },
  headers: { ...entry.headers },
  classification: "context-close-cancelled",
})

const sanitizeRuntimeEvidence = (runtime: RuntimeEvidence, sensitiveValues: readonly string[]): RuntimeEvidence => ({
  sessionId: runtime.sessionId,
  sessionPurpose: runtime.sessionPurpose,
  sessionExpectedRole: runtime.sessionExpectedRole,
  phase: runtime.phase,
  closeBoundarySequence: runtime.closeBoundarySequence,
  consoleErrors: runtime.consoleErrors.map((value) => sanitizeDiagnosticText(value, sensitiveValues)),
  consoleDiagnostics: runtime.consoleDiagnostics.map((value) => sanitizeRuntimeConsoleDiagnostic(value, sensitiveValues)),
  requestFailures: runtime.requestFailures.map((value) => sanitizeDiagnosticText(value, sensitiveValues)),
  httpErrors: runtime.httpErrors.map((value) => ({ ...value, path: sanitizeDiagnosticText(value.path, sensitiveValues) })),
  localNextScriptResponses: runtime.localNextScriptResponses.map((value) => ({ ...value, path: sanitizeDiagnosticText(value.path, sensitiveValues) })),
  expectedVoidMutationAborts: runtime.expectedVoidMutationAborts.map((value) => ({ ...value, path: sanitizeDiagnosticText(value.path, sensitiveValues) })),
  expectedNextLinkPrefetchAborts: runtime.expectedNextLinkPrefetchAborts.map((value) => sanitizeExpectedNextLinkPrefetchAbort(value, sensitiveValues)),
  contextCloseCancellations: runtime.contextCloseCancellations.map((value) => sanitizeContextCloseCancellation(value, sensitiveValues)),
  requestEvidence: runtime.requestEvidence.map((value) => sanitizeNextLinkPrefetchRequest(value, sensitiveValues)),
  unexpectedAuthNavigations: runtime.unexpectedAuthNavigations.map((value) => ({
    path: sanitizeDiagnosticText(value.path, sensitiveValues),
    pagePathAtRequest: value.pagePathAtRequest ? sanitizeDiagnosticText(value.pagePathAtRequest, sensitiveValues) : null,
  })),
  expectedAuthProbeResponses: runtime.expectedAuthProbeResponses.map((value) => ({ ...value, path: sanitizeDiagnosticText(value.path, sensitiveValues) })),
  expectedAuthProbeConsoleWarnings: runtime.expectedAuthProbeConsoleWarnings.map((value) => sanitizeDiagnosticText(value, sensitiveValues)),
  expectedAuthProbeFailures: runtime.expectedAuthProbeFailures.map((value) => sanitizeDiagnosticText(value, sensitiveValues)),
  blockedRequests: runtime.blockedRequests.map((value) => sanitizeDiagnosticText(value, sensitiveValues)),
})

export function sanitizeRuntimeEvidenceForPersistence(runtime: RuntimeEvidence, sensitiveValues: readonly string[]) {
  return sanitizeRuntimeEvidence(runtime, sensitiveValues)
}

const hasVoidMutationEvidenceShape = (request: NextLinkPrefetchRequestEvidence) =>
  request.isLocalRequest &&
  request.method === "PATCH" &&
  isVoidMutationPath(request.path.startsWith("/") ? `http://localhost${request.path}` : request.url) &&
  (request.resourceType === "fetch" || request.resourceType === "xhr") &&
  request.isNavigationRequest === false &&
  request.sessionId !== null &&
  request.sessionPurpose === "ui-tournament" &&
  request.sessionExpectedRole === Role.ORGANIZER

const isExpectedVoidMutationEvidence = (
  request: NextLinkPrefetchRequestEvidence,
): request is NextLinkPrefetchRequestEvidence & { voidMutationCorrelationId: string; voidMutationOwner: VoidMutationOwner } =>
  hasVoidMutationEvidenceShape(request) &&
  request.failure === "net::ERR_ABORTED" &&
  request.responseObserved === true &&
  request.responseStatus === 200 &&
  request.voidMutationCorrelationId !== null &&
  request.voidMutationOwner !== null &&
  request.voidMutationOwner.caseName.length > 0 &&
  request.voidMutationOwner.mutationName.length > 0 &&
  request.voidMutationTerminalOutcome === "accepted-abort"

const requestFailureDetail = (request: NextLinkPrefetchRequestEvidence) =>
  `${request.correlationId} ${request.method} ${request.url}: ${request.failure ?? "failed"}`

const detailBelongsToCorrelation = (detail: string, correlationId: string) => detail.startsWith(`${correlationId} `)

const removeRequestFailureDetail = (evidence: RuntimeEvidence, correlationId: string) => {
  evidence.requestFailures = evidence.requestFailures.filter((detail) => !detailBelongsToCorrelation(detail, correlationId))
  evidence.expectedAuthProbeFailures = evidence.expectedAuthProbeFailures.filter((detail) => !detailBelongsToCorrelation(detail, correlationId))
}

const appendRequestFailureDetail = (evidence: RuntimeEvidence, request: NextLinkPrefetchRequestEvidence) => {
  const detail = requestFailureDetail(request)
  if (!evidence.requestFailures.some((existing) => detailBelongsToCorrelation(existing, request.correlationId))) evidence.requestFailures.push(detail)
}

const appendExpectedAuthProbeFailureDetail = (evidence: RuntimeEvidence, request: NextLinkPrefetchRequestEvidence) => {
  const detail = requestFailureDetail(request)
  if (!evidence.expectedAuthProbeFailures.some((existing) => detailBelongsToCorrelation(existing, request.correlationId))) evidence.expectedAuthProbeFailures.push(detail)
}

const asExpectedNextLinkPrefetchAbort = (request: NextLinkPrefetchRequestEvidence): ExpectedNextLinkPrefetchAbort => ({
  ...request,
  classification: "expected-next-link-prefetch-abort",
  failure: "net::ERR_ABORTED",
})

const asExpectedVoidMutationAbort = (request: NextLinkPrefetchRequestEvidence): ExpectedVoidMutationAbort => {
  if (request.voidMutationCorrelationId === null || request.voidMutationOwner === null) {
    throw new Error("Expected void mutation abort requires a correlation ID and owner.")
  }
  return {
    correlationId: request.voidMutationCorrelationId,
    caseName: request.voidMutationOwner.caseName,
    mutationName: request.voidMutationOwner.mutationName,
    method: "PATCH",
    path: request.path,
    status: 200,
    failure: "net::ERR_ABORTED",
  }
}

const voidMutationOwnerKey = (owner: VoidMutationOwner | null) => owner ? `${owner.caseName}\u0000${owner.mutationName}` : null

const isExpectedVoidMutationNormal = (request: NextLinkPrefetchRequestEvidence) =>
  hasVoidMutationEvidenceShape(request) &&
  request.voidMutationCorrelationId !== null &&
  request.voidMutationOwner !== null &&
  request.responseObserved === true &&
  request.responseStatus === 200 &&
  request.failure === null &&
  request.voidMutationOwner.caseName.length > 0 &&
  request.voidMutationOwner.mutationName.length > 0 &&
  request.voidMutationTerminalOutcome === "normal"

const uniqueSorted = (values: string[]) => [...new Set(values)].sort()

export function validateVoidMutationTerminalEvidence(
  evidence: RuntimeEvidence,
  expectedOwners: readonly VoidMutationOwner[] = [],
): VoidMutationTerminalReconciliation {
  const runtimeEntries = evidence.requestEvidence.filter((entry) => entry.voidMutationCorrelationId !== null)
  const correlationIds = runtimeEntries.map((entry) => entry.voidMutationCorrelationId as string)
  const duplicateCorrelationIds = uniqueSorted(correlationIds.filter((id, index) => correlationIds.indexOf(id) !== index))
  const records = runtimeEntries.map((entry): VoidMutationTerminalRecord => ({
    correlationId: entry.voidMutationCorrelationId as string,
    owner: entry.voidMutationOwner,
    method: entry.method,
    path: entry.path,
    responseObserved: entry.responseObserved,
    responseStatus: entry.responseStatus,
    failure: entry.failure,
    terminalOutcome: entry.voidMutationTerminalOutcome,
  }))
  const orphanCorrelationIds = records.filter((record) => record.owner === null).map((record) => record.correlationId)
  const pendingCorrelationIds = records.filter((record) => record.terminalOutcome === "pending" || record.terminalOutcome === null).map((record) => record.correlationId)
  const ownerKeys = records.map((record) => voidMutationOwnerKey(record.owner)).filter((key): key is string => key !== null)
  const duplicateOwnerKeys = uniqueSorted(ownerKeys.filter((key, index) => ownerKeys.indexOf(key) !== index))
  const invalidCorrelationIds = records
    .filter((record) => {
      const request = evidence.requestEvidence.find((entry) => entry.voidMutationCorrelationId === record.correlationId)
      return !request || (!isExpectedVoidMutationEvidence(request) && !isExpectedVoidMutationNormal(request))
    })
    .map((record) => record.correlationId)
  const expectedEntries = evidence.expectedVoidMutationAborts
  const missingRuntimeCorrelationIds = expectedEntries
    .map((entry) => entry.correlationId)
    .filter((correlationId) => !runtimeEntries.some((entry) => entry.voidMutationCorrelationId === correlationId))
  const expectedEntryInvalidCorrelationIds = expectedEntries
    .filter((entry) => {
      const request = runtimeEntries.find((candidate) => candidate.voidMutationCorrelationId === entry.correlationId)
      return entry.method !== "PATCH" || entry.status !== 200 || entry.failure !== "net::ERR_ABORTED" ||
        entry.caseName.length === 0 || entry.mutationName.length === 0 ||
        !request || !isExpectedVoidMutationEvidence(request) ||
        request.path !== entry.path ||
        request.voidMutationOwner?.caseName !== entry.caseName ||
        request.voidMutationOwner?.mutationName !== entry.mutationName
    })
    .map((entry) => entry.correlationId)
  const missingRuntimeOwnerKeys = expectedOwners
    .map(voidMutationOwnerKey)
    .filter((key): key is string => key !== null && !ownerKeys.includes(key))
  const acceptedAborts = runtimeEntries
    .filter((entry): entry is NextLinkPrefetchRequestEvidence & { voidMutationCorrelationId: string; voidMutationOwner: VoidMutationOwner } => isExpectedVoidMutationEvidence(entry))
    .map(asExpectedVoidMutationAbort)
  const errors = [
    ...duplicateCorrelationIds.map((id) => `duplicate void mutation correlation ${id}`),
    ...duplicateOwnerKeys.map((key) => `duplicate void mutation owner ${key}`),
    ...orphanCorrelationIds.map((id) => `orphan void mutation correlation ${id}`),
    ...pendingCorrelationIds.map((id) => `pending void mutation correlation ${id}`),
    ...invalidCorrelationIds.map((id) => `invalid void mutation correlation ${id}`),
    ...expectedEntryInvalidCorrelationIds.map((id) => `invalid persisted void mutation correlation ${id}`),
    ...missingRuntimeCorrelationIds.map((id) => `missing runtime void mutation correlation ${id}`),
    ...missingRuntimeOwnerKeys.map((key) => `missing runtime void mutation owner ${key}`),
  ]
  return {
    valid: errors.length === 0,
    timedOut: pendingCorrelationIds.length > 0 || missingRuntimeOwnerKeys.length > 0,
    records,
    acceptedAborts,
    pendingCorrelationIds: uniqueSorted(pendingCorrelationIds),
    orphanCorrelationIds: uniqueSorted(orphanCorrelationIds),
    duplicateCorrelationIds,
    duplicateOwnerKeys,
    invalidCorrelationIds: uniqueSorted([...invalidCorrelationIds, ...expectedEntryInvalidCorrelationIds]),
    missingRuntimeCorrelationIds: uniqueSorted(missingRuntimeCorrelationIds),
    missingRuntimeOwnerKeys: uniqueSorted(missingRuntimeOwnerKeys),
    errors,
  }
}

const ownerKey = (caseName: string, mutationName: string) => `${caseName}\u0000${mutationName}`

export function validateVoidMutationBijection(
  reconciliations: readonly VoidMutationTerminalReconciliation[],
  persistedRecords: readonly PersistedVoidMutationRecord[],
): VoidMutationBijectionValidation {
  const acceptedAborts = reconciliations.flatMap((reconciliation) => reconciliation.acceptedAborts)
  const acceptedCorrelationIds = acceptedAborts.map((entry) => entry.correlationId)
  const persistedCorrelationIds = persistedRecords.map((entry) => entry.correlationId)
  const duplicateAcceptedCorrelationIds = uniqueSorted(acceptedCorrelationIds.filter((id, index) => acceptedCorrelationIds.indexOf(id) !== index))
  const duplicatePersistedCorrelationIds = uniqueSorted(persistedCorrelationIds.filter((id, index) => persistedCorrelationIds.indexOf(id) !== index))
  const acceptedByCorrelation = new Map(acceptedAborts.map((entry) => [entry.correlationId, entry]))
  const persistedByCorrelation = new Map(persistedRecords.map((entry) => [entry.correlationId, entry]))
  const missingPersistedCorrelationIds = uniqueSorted(acceptedCorrelationIds.filter((id) => !persistedByCorrelation.has(id)))
  const orphanPersistedCorrelationIds = uniqueSorted(persistedCorrelationIds.filter((id) => !acceptedByCorrelation.has(id)))
  const wrongMetadataCorrelationIds = uniqueSorted(persistedRecords
    .filter((entry) => {
      const accepted = acceptedByCorrelation.get(entry.correlationId)
      return accepted !== undefined && (
        entry.caseName !== accepted.caseName ||
        entry.mutationName !== accepted.mutationName ||
        entry.recordName !== accepted.mutationName ||
        entry.caseName.length === 0 ||
        entry.mutationName.length === 0
      )
    })
    .map((entry) => entry.correlationId))
  const ownerKeys = acceptedAborts.map((entry) => ownerKey(entry.caseName, entry.mutationName))
  const duplicateOwnerKeys = uniqueSorted(ownerKeys.filter((key, index) => ownerKeys.indexOf(key) !== index))
  const orphanRuntimeCorrelationIds = uniqueSorted(reconciliations.flatMap((reconciliation) => reconciliation.orphanCorrelationIds))
  const terminalErrors = uniqueSorted(reconciliations.flatMap((reconciliation) => reconciliation.errors))
  const errors = [
    ...duplicateAcceptedCorrelationIds.map((id) => `duplicate accepted void mutation correlation ${id}`),
    ...duplicatePersistedCorrelationIds.map((id) => `duplicate persisted void mutation record ${id}`),
    ...duplicateOwnerKeys.map((key) => `duplicate accepted void mutation owner ${key}`),
    ...orphanRuntimeCorrelationIds.map((id) => `orphan accepted void mutation correlation ${id}`),
    ...missingPersistedCorrelationIds.map((id) => `accepted void mutation correlation has no persisted mutation record ${id}`),
    ...orphanPersistedCorrelationIds.map((id) => `persisted void mutation record has no accepted correlation ${id}`),
    ...wrongMetadataCorrelationIds.map((id) => `wrong persisted void mutation metadata ${id}`),
    ...terminalErrors,
  ]
  return {
    valid: errors.length === 0,
    acceptedCorrelationIds: uniqueSorted(acceptedCorrelationIds),
    persistedCorrelationIds: uniqueSorted(persistedCorrelationIds),
    missingPersistedCorrelationIds,
    orphanPersistedCorrelationIds,
    duplicateAcceptedCorrelationIds,
    duplicatePersistedCorrelationIds,
    duplicateOwnerKeys,
    orphanRuntimeCorrelationIds,
    wrongMetadataCorrelationIds,
    terminalErrors,
    errors,
  }
}

export function reconcileRuntimeEvidence(evidence: RuntimeEvidence) {
  const expectedNextLinkPrefetchAborts: ExpectedNextLinkPrefetchAbort[] = []
  const expectedVoidMutationAborts: RuntimeEvidence["expectedVoidMutationAborts"] = []

  for (const request of evidence.requestEvidence) {
    if (request.classification === "context-close-cancelled" && evidence.closeBoundarySequence !== null && isExpectedContextCloseCancellation(request, evidence.closeBoundarySequence)) continue

    if (request.voidMutationCorrelationId !== null && isExpectedVoidMutationEvidence(request)) {
      request.classification = "expected-void-mutation-abort"
      expectedVoidMutationAborts.push(asExpectedVoidMutationAbort(request))
      removeRequestFailureDetail(evidence, request.correlationId)
      continue
    }

    if (request.failure === null) {
      if (request.classification !== "response" && request.classification !== "pending") {
        request.classification = request.responseObserved ? "response" : "pending"
      }
      continue
    }

    if (isExpectedNextLinkPrefetchAbort(request)) {
      request.classification = "expected-next-link-prefetch-abort"
      expectedNextLinkPrefetchAborts.push(asExpectedNextLinkPrefetchAbort(request))
      removeRequestFailureDetail(evidence, request.correlationId)
      continue
    }

    if (isExpectedAuthProbeFailureEvidence(request)) {
      request.classification = "expected-auth-probe-failure"
      removeRequestFailureDetail(evidence, request.correlationId)
      continue
    }

    if (request.classification === "blocked-request") continue
    request.classification = "unexpected-request-failure"
    if (isExactAuthProbeURL(request.url)) appendExpectedAuthProbeFailureDetail(evidence, request)
    appendRequestFailureDetail(evidence, request)
  }

  evidence.expectedNextLinkPrefetchAborts = expectedNextLinkPrefetchAborts
  evidence.expectedVoidMutationAborts = expectedVoidMutationAborts
}

const RUNTIME_CONSOLE_DIAGNOSTIC_BRIDGE = "__debetterRecordRuntimeConsoleDiagnostic"

const normalizeRuntimeConsoleDiagnostic = (value: unknown): RuntimeConsoleDiagnostic | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (record.level !== "error" && record.level !== "warn") return null
  const argumentTypes = Array.isArray(record.argumentTypes)
    ? record.argumentTypes.filter((entry): entry is string => typeof entry === "string")
    : []
  const argumentTemplates = Array.isArray(record.argumentTemplates)
    ? record.argumentTemplates.filter((entry): entry is string => typeof entry === "string")
    : []
  return sanitizeRuntimeConsoleDiagnostic({
    level: record.level,
    argumentTypes,
    argumentTemplates,
    stack: typeof record.stack === "string" ? record.stack : null,
    location: typeof record.location === "string" ? record.location : null,
  }, [])
}

const normalizeURL = (value: string) => value.replace(/\/+$/, "")

export function loadIntegrityConfig(): IntegrityConfig {
  const frontendBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
  const apiBaseURL = normalizeURL(process.env.TOURNAMENT_INTEGRITY_API_BASE_URL ?? "http://localhost:18080/api")
  const readyURL = DEFAULT_READY_URL
  const organizerUsername = (
    process.env.TOURNAMENT_INTEGRITY_ORGANIZER_USERNAME ??
    process.env.TOURNAMENT_INTEGRITY_USERNAME ??
    process.env.SOL_BACKEND_USERNAME
  )?.trim()
  const organizerPassword =
    process.env.TOURNAMENT_INTEGRITY_ORGANIZER_PASSWORD ??
    process.env.TOURNAMENT_INTEGRITY_PASSWORD ??
    process.env.SOL_BACKEND_PASSWORD
  const debaterUsername = (
    process.env.TOURNAMENT_INTEGRITY_DEBATER_USERNAME ??
    process.env.SOL_BACKEND_DEBATER_USERNAME
  )?.trim()
  const debaterPassword =
    process.env.TOURNAMENT_INTEGRITY_DEBATER_PASSWORD ??
    process.env.SOL_BACKEND_DEBATER_PASSWORD

  for (const [name, value] of [["PLAYWRIGHT_BASE_URL", frontendBaseURL], ["TOURNAMENT_INTEGRITY_API_BASE_URL", apiBaseURL], ["TOURNAMENT_INTEGRITY_READY_URL", readyURL]] as const) {
    if (!isLocalURL(value)) throw new Error(`${name} must be an http localhost URL.`)
  }

  const frontendURL = new URL(frontendBaseURL)
  if (frontendURL.port !== "3000" && frontendURL.port !== "3001") {
    throw new Error("The integrity matrix only permits the localhost frontend on port 3000 or 3001.")
  }

  const apiURL = new URL(apiBaseURL)
  if (apiURL.port !== "18080" || apiURL.pathname.replace(/\/+$/, "") !== "/api") {
    throw new Error("The integrity matrix only permits the isolated backend http://localhost:18080/api.")
  }
  if (!organizerUsername || !organizerPassword || !debaterUsername || !debaterPassword) {
    throw new Error("Integrity credentials must be supplied through environment variables for organizer and debater contexts.")
  }
  if (process.env.TOURNAMENT_INTEGRITY_ALLOW_WRITES !== "1") {
    throw new Error("Set TOURNAMENT_INTEGRITY_ALLOW_WRITES=1 to execute the strict fixture mutation matrix.")
  }

  return {
    frontendBaseURL,
    apiBaseURL,
    readyURL,
    organizerUsername,
    organizerPassword,
    debaterUsername,
    debaterPassword,
    allowWrites: true,
  }
}

const redact = (value: unknown, key?: string): unknown => {
  if (key && /(password|token|secret|authorization|cookie|credential)/i.test(key)) return "[REDACTED]"
  if (Array.isArray(value)) return value.map((item) => redact(item))
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]))
  }
  return value
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stableValue(child)]))
  }
  return value
}

export const stableJSONString = (value: unknown) => JSON.stringify(stableValue(value))

export const hashValue = (value: unknown) => createHash("sha256").update(stableJSONString(value)).digest("hex")

const RUNTIME_DIAGNOSTICS_FILE_PREFIX = "runtime-diagnostics-"
const EXPECTED_NEXT_LINK_PREFETCH_FILE_PREFIX = "expectedNextLinkPrefetchAborts-"
const CONTEXT_CLOSE_CANCELLATION_FILE_PREFIX = "context-close-cancellations-"

export const runtimeEvidencePersistenceFileNames = (sessionId: string) => {
  const safeSessionId = safeFilePart(sessionId)
  if (!safeSessionId) throw new Error("Runtime evidence persistence requires a non-empty session ID.")
  return {
    diagnostics: `${RUNTIME_DIAGNOSTICS_FILE_PREFIX}${safeSessionId}.json`,
    prefetch: `${EXPECTED_NEXT_LINK_PREFETCH_FILE_PREFIX}${safeSessionId}.json`,
    closeCancellations: `${CONTEXT_CLOSE_CANCELLATION_FILE_PREFIX}${safeSessionId}.json`,
  }
}

export function buildRuntimeEvidencePersistenceRecords(
  sessionId: string,
  finalRuntime: RuntimeEvidence,
  preCloseRuntime: RuntimeEvidence | null,
  options: { contextClosed: boolean; finalSuiteSnapshot: boolean },
): RuntimeEvidencePersistenceRecords {
  const files = runtimeEvidencePersistenceFileNames(sessionId)
  const snapshotHash = hashValue(finalRuntime)
  const baseMetadata = {
    schemaVersion: 1 as const,
    source: "final-reconciled-per-session-runtime" as const,
    sessionId,
    snapshotHash,
    sanitized: true as const,
    contextClosed: options.contextClosed,
    finalSuiteSnapshot: options.finalSuiteSnapshot,
    runtimeDiagnosticsFile: files.diagnostics,
    expectedNextLinkPrefetchEvidenceFile: files.prefetch,
    contextCloseCancellationEvidenceFile: files.closeCancellations,
  }
  return {
    diagnostics: {
      sessionId,
      preCloseRuntime,
      finalRuntime,
      runtime: finalRuntime,
      persistence: { ...baseMetadata, recordKind: "runtime-diagnostics" },
    },
    prefetch: {
      sessionId,
      expectedNextLinkPrefetchAborts: finalRuntime.expectedNextLinkPrefetchAborts,
      requestEvidence: finalRuntime.requestEvidence,
      persistence: { ...baseMetadata, recordKind: "expected-next-link-prefetch" },
    },
    closeCancellations: {
      sessionId,
      contextCloseCancellations: finalRuntime.contextCloseCancellations,
      persistence: { ...baseMetadata, recordKind: "context-close-cancellation" },
    },
  }
}

const RELEASE_SOURCE_ROOTS = [
  "app",
  "components",
  "client",
  "hooks",
  "lib",
  "types",
  "styles",
  "public",
  "e2e",
  "components.json",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.mjs",
  "package.json",
  "package-lock.json",
  "playwright.config.ts",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
]
const RELEASE_EXCLUDED_DIRECTORY_NAMES = new Set([".git", ".next", "node_modules", "test-results"])

const isReleaseSourcePathExcluded = (relativePath: string) => {
  const segments = relativePath.split(path.sep)
  const basename = segments[segments.length - 1] ?? ""
  return segments.some((segment) => RELEASE_EXCLUDED_DIRECTORY_NAMES.has(segment) || /(?:secret|credential|password|token)/i.test(segment)) ||
    basename === ".npmrc" ||
    basename.startsWith(".env") ||
    /(?:secret|credential|password|token)/i.test(basename)
}

async function collectReleaseSourceFiles(root: string, relativePath: string, files: string[]) {
  if (isReleaseSourcePathExcluded(relativePath)) return
  const absolutePath = path.join(root, relativePath)
  let info
  try {
    info = await lstat(absolutePath)
  } catch {
    return
  }
  if (info.isFile()) {
    files.push(relativePath)
    return
  }
  if (!info.isDirectory()) return
  const entries = await readdir(absolutePath, { withFileTypes: true })
  for (const entry of entries) {
    await collectReleaseSourceFiles(root, path.join(relativePath, entry.name), files)
  }
}

export async function computeRelevantSourceHash(root = process.cwd()) {
  const files: string[] = []
  for (const relativePath of RELEASE_SOURCE_ROOTS) {
    await collectReleaseSourceFiles(root, relativePath, files)
  }
  files.sort()
  const digest = createHash("sha256")
  for (const relativePath of files) {
    const contentHash = createHash("sha256").update(await readFile(path.join(root, relativePath))).digest("hex")
    digest.update(`${relativePath.split(path.sep).join("/")}\0${contentHash}\n`)
  }
  return digest.digest("hex")
}

export function databaseDelta(before: unknown, after: unknown) {
  const beforeHash = hashValue(before)
  const afterHash = hashValue(after)
  const beforeObject = before && typeof before === "object" ? before as Record<string, unknown> : {}
  const afterObject = after && typeof after === "object" ? after as Record<string, unknown> : {}
  const changedKeys = Array.from(new Set([...Object.keys(beforeObject), ...Object.keys(afterObject)])).filter((key) =>
    stableJSONString(beforeObject[key]) !== stableJSONString(afterObject[key]),
  ).sort()
  return { changed: beforeHash !== afterHash, beforeHash, afterHash, changedKeys }
}

async function gitOutput(args: string[]) {
  const result = await execFileAsync("git", args, { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024 })
  return result.stdout.trim()
}

const RELEASE_MATRIX_EXPLICIT_ENV: ReleaseBuildEvidence["explicitEnv"] = {
  BACKEND_URL: "http://localhost:18080/api",
  NEXT_PUBLIC_API_URL: "/api",
  NEXT_PUBLIC_PREVIEW_MODE: "false",
  NEXT_PUBLIC_PREVIEW_ROLE: "participant",
  NEXT_PUBLIC_DEMO_MODE: "false",
  NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: "1",
  TOURNAMENT_INTEGRITY_RELEASE_MATRIX: "1",
  NODE_ENV: "production",
}

const isSha256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value)

async function readReleaseBuildEvidence(): Promise<ReleaseBuildEvidence | null> {
  if (process.env.TOURNAMENT_INTEGRITY_RELEASE_MATRIX !== "1") return null
  for (const [name, expected] of Object.entries(RELEASE_MATRIX_EXPLICIT_ENV)) {
    if (process.env[name] !== expected) throw new Error(`Release matrix environment ${name} does not match the strict local release contract.`)
  }
  const evidencePath = process.env.TOURNAMENT_INTEGRITY_RELEASE_BUILD_EVIDENCE_PATH
  if (!evidencePath) throw new Error("Release matrix build evidence path is required.")

  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(evidencePath, "utf8"))
  } catch (error) {
    throw new Error(`Release matrix build evidence could not be read: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Release matrix build evidence must be an object.")
  }
  const evidence = parsed as Partial<ReleaseBuildEvidence>
  if (evidence.mode !== "release-matrix" || evidence.preBuildNextRemoved !== true || typeof evidence.preBuildNextExistedBeforeRemoval !== "boolean" || evidence.buildExit !== 0 || typeof evidence.buildId !== "string" || evidence.buildId.length === 0) {
    throw new Error("Release matrix build evidence does not prove a successful release build.")
  }
  if (typeof evidence.buildLogPath !== "string" || path.isAbsolute(evidence.buildLogPath) || evidence.buildLogPath.split("/").includes("..")) {
    throw new Error("Release matrix build evidence contains an invalid build log path.")
  }
  if (typeof evidence.envIsolationEvidencePath !== "string" || path.isAbsolute(evidence.envIsolationEvidencePath) || evidence.envIsolationEvidencePath.split("/").includes("..")) {
    throw new Error("Release matrix build evidence contains an invalid environment-isolation proof path.")
  }
  if (!isSha256(evidence.controlInstanceIdHash)) throw new Error("Release matrix build evidence is missing the controller instance identity hash.")
  if (!isSha256(evidence.buildLogHash) || !isSha256(evidence.packageLockHash) || !isSha256(evidence.sourceHashBeforeRun)) {
    throw new Error("Release matrix build evidence is missing a valid SHA-256 hash.")
  }
  if (stableJSONString(evidence.explicitEnv) !== stableJSONString(RELEASE_MATRIX_EXPLICIT_ENV)) {
    throw new Error("Release matrix build evidence environment does not match the strict local release contract.")
  }
  const buildLogPath = path.join(process.cwd(), evidence.buildLogPath)
  try {
    await lstat(buildLogPath)
  } catch {
    throw new Error(`Release matrix build log is missing: ${evidence.buildLogPath}`)
  }
  const buildLogHash = createHash("sha256").update(await readFile(buildLogPath)).digest("hex")
  if (buildLogHash !== evidence.buildLogHash) throw new Error("Release matrix build log hash does not match persisted evidence.")
  const packageLockHash = createHash("sha256").update(await readFile(path.join(process.cwd(), "package-lock.json"))).digest("hex")
  if (packageLockHash !== evidence.packageLockHash) throw new Error("Release matrix package-lock hash does not match persisted evidence.")
  const envProofPath = path.join(process.cwd(), evidence.envIsolationEvidencePath)
  let envProof: unknown
  try {
    envProof = JSON.parse(await readFile(envProofPath, "utf8"))
  } catch {
    throw new Error("Release matrix environment-isolation proof is missing.")
  }
  if (!envProof || typeof envProof !== "object" || (envProof as Record<string, unknown>).mode !== "project-env-isolation" || (envProof as Record<string, unknown>).restored !== false || (envProof as Record<string, unknown>).contentsPersisted !== false || (envProof as Record<string, unknown>).contentHashesPersisted !== false) {
    throw new Error("Release matrix environment-isolation proof is not sanitized or is not active at startup.")
  }
  let buildIdOnDisk: string
  try {
    buildIdOnDisk = (await readFile(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8")).trim()
  } catch {
    throw new Error("Release matrix .next/BUILD_ID is missing after build.")
  }
  if (buildIdOnDisk !== evidence.buildId) {
    throw new Error("Release matrix BUILD_ID does not match persisted build evidence.")
  }
  if (process.env.TOURNAMENT_INTEGRITY_RELEASE_BUILD_ID !== evidence.buildId) {
    throw new Error("Release matrix runtime build ID does not match persisted build evidence.")
  }
  if (process.env.TOURNAMENT_INTEGRITY_RELEASE_SOURCE_HASH_BEFORE_RUN !== evidence.sourceHashBeforeRun) {
    throw new Error("Release matrix runtime source hash does not match persisted build evidence.")
  }
  if (await computeRelevantSourceHash() !== evidence.sourceHashBeforeRun) {
    throw new Error("Release matrix source changed after build and before Playwright startup.")
  }
  return evidence as ReleaseBuildEvidence
}

export async function createRunEvidence(config: IntegrityConfig, readyReport: ReadyReport): Promise<RunEvidence> {
  const startedAt = new Date().toISOString()
  const id = `${startedAt.replace(/[-:.TZ]/g, "")}-${process.pid}-${randomBytes(4).toString("hex")}`
  const root = path.join(EVIDENCE_ROOT, "runs", safeFilePart(id))
  await mkdir(path.join(root, "screenshots"), { recursive: true })
  const releaseBuildEvidence = await readReleaseBuildEvidence()
  const status = await gitOutput(["status", "--short"])
  const unstagedDiff = await gitOutput(["diff", "--no-ext-diff", "--binary"])
  const stagedDiff = await gitOutput(["diff", "--cached", "--no-ext-diff", "--binary"])
  const untracked = await gitOutput(["ls-files", "--others", "--exclude-standard"])
  const workingTreeHash = createHash("sha256").update(`${unstagedDiff}\n${stagedDiff}\n${untracked}`).digest("hex")
  const manifest = {
    runId: id,
    startedAt,
    frontendHead: await gitOutput(["rev-parse", "HEAD"]),
    frontendStatusHash: hashValue(status),
    fullUnstagedDiffHash: createHash("sha256").update(unstagedDiff).digest("hex"),
    fullStagedDiffHash: createHash("sha256").update(stagedDiff).digest("hex"),
    workingTreeHash,
    releaseBuildEvidence,
    fixtureIds: FIXTURE_IDS,
    URLs: {
      frontend: config.frontendBaseURL,
      backend: config.apiBaseURL,
      ready: config.readyURL,
    },
    commands: [
      "npm test -- --runInBand",
      "npm run lint",
      "npm run build",
      "PLAYWRIGHT_SKIP_WEBSERVER=0 npm run test:e2e -- e2e/tournament-results-integrity.spec.ts",
    ],
    readyReport: redact(readyReport),
  }
  await writeFile(path.join(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" })
  return {
    id,
    root,
    manifestPath: path.join(root, "manifest.json"),
    startedAt,
    authSessions: [],
    persistedAuthEvidenceSessionIds: new Set(),
    releaseBuildEvidence,
  }
}

export type RunRecordWriteOptions = {
  overwrite?: boolean
}

export async function writeRunRecord(run: RunEvidence, name: string, value: unknown, options: RunRecordWriteOptions = {}) {
  const filePath = path.join(run.root, `${safeFilePart(name)}.json`)
  const serialized = `${JSON.stringify(redact(value), null, 2)}\n`
  if (!options.overwrite) {
    await writeFile(filePath, serialized, { flag: "wx" })
    return filePath
  }

  const temporaryPath = `${filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`
  try {
    await writeFile(temporaryPath, serialized, { flag: "wx" })
    await rename(temporaryPath, filePath)
  } finally {
    try {
      await unlink(temporaryPath)
    } catch {
      // The atomic rename already removed the temporary path.
    }
  }
  return filePath
}

const recordNameFromFileName = (fileName: string) => fileName.endsWith(".json") ? fileName.slice(0, -5) : fileName

export async function writeRuntimeEvidencePersistence(run: RunEvidence, records: RuntimeEvidencePersistenceRecords) {
  if (records.diagnostics.sessionId !== records.prefetch.sessionId || records.diagnostics.sessionId !== records.closeCancellations.sessionId) {
    throw new Error("Runtime evidence diagnostics, prefetch, and close-cancellation records must use the same session ID.")
  }
  const files = runtimeEvidencePersistenceFileNames(records.diagnostics.sessionId)
  if (records.diagnostics.persistence.runtimeDiagnosticsFile !== files.diagnostics ||
    records.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile !== files.prefetch ||
    records.closeCancellations.persistence.contextCloseCancellationEvidenceFile !== files.closeCancellations) {
    throw new Error(`Runtime evidence persistence metadata does not match the session ${records.diagnostics.sessionId} file names.`)
  }
  await writeRunRecord(run, recordNameFromFileName(files.diagnostics), records.diagnostics, { overwrite: true })
  await writeRunRecord(run, recordNameFromFileName(files.prefetch), records.prefetch, { overwrite: true })
  await writeRunRecord(run, recordNameFromFileName(files.closeCancellations), records.closeCancellations, { overwrite: true })
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value)
const persistenceRecordSessionId = (value: unknown) => {
  if (!isObjectRecord(value) || typeof value.sessionId !== "string") return null
  return value.sessionId
}

export async function readRuntimeEvidencePersistenceFiles(run: RunEvidence): Promise<RuntimeEvidencePersistenceFiles> {
  const entries = await readdir(run.root, { withFileTypes: true })
  const relevantEntries = entries.filter((entry) => entry.name.startsWith(RUNTIME_DIAGNOSTICS_FILE_PREFIX) || entry.name.startsWith(EXPECTED_NEXT_LINK_PREFETCH_FILE_PREFIX) || entry.name.startsWith(CONTEXT_CLOSE_CANCELLATION_FILE_PREFIX))
  const diagnostics: RuntimeEvidencePersistenceFile[] = []
  const prefetch: RuntimeEvidencePersistenceFile[] = []
  const closeCancellations: RuntimeEvidencePersistenceFile[] = []
  const readErrors: string[] = []

  for (const entry of relevantEntries) {
    const isDiagnostics = entry.name.startsWith(RUNTIME_DIAGNOSTICS_FILE_PREFIX)
    const isPrefetch = entry.name.startsWith(EXPECTED_NEXT_LINK_PREFETCH_FILE_PREFIX)
    const target = isDiagnostics ? diagnostics : isPrefetch ? prefetch : closeCancellations
    let value: unknown = null
    if (!entry.isFile()) {
      readErrors.push(`${entry.name}: persistence entry is not a file`)
    } else if (!entry.name.endsWith(".json")) {
      readErrors.push(`${entry.name}: persistence entry is not a JSON file`)
    } else {
      try {
        value = JSON.parse(await readFile(path.join(run.root, entry.name), "utf8")) as unknown
      } catch (error) {
        readErrors.push(`${entry.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    target.push({ fileName: entry.name, value })
  }

  return {
    diagnostics: diagnostics.sort((a, b) => a.fileName.localeCompare(b.fileName)),
    prefetch: prefetch.sort((a, b) => a.fileName.localeCompare(b.fileName)),
    closeCancellations: closeCancellations.sort((a, b) => a.fileName.localeCompare(b.fileName)),
    readErrors,
  }
}

const RUNTIME_FATAL_EVIDENCE_FIELDS = [
  "consoleErrors",
  "requestFailures",
  "httpErrors",
  "unexpectedAuthNavigations",
  "expectedAuthProbeFailures",
  "blockedRequests",
] as const

const compareRuntimeEvidencePersistenceRecord = (
  actual: unknown,
  expected: RuntimeEvidencePersistenceRecords["diagnostics"] | RuntimeEvidencePersistenceRecords["prefetch"] | RuntimeEvidencePersistenceRecords["closeCancellations"],
  kind: RuntimeEvidencePersistenceRecordKind,
) => {
  if (!isObjectRecord(actual)) return [`${kind}: persisted record is not an object`]
  const issues: string[] = []
  if (actual.sessionId !== expected.sessionId) issues.push(`${kind}: session ID mismatch`)
  if (stableJSONString(actual.persistence) !== stableJSONString(expected.persistence)) issues.push(`${kind}: persistence metadata mismatch`)

  if (kind === "runtime-diagnostics") {
    const expectedDiagnostics = expected as RuntimeEvidencePersistenceRecords["diagnostics"]
    if (stableJSONString(actual.preCloseRuntime) !== stableJSONString(expectedDiagnostics.preCloseRuntime)) issues.push(`${kind}: pre-close runtime mismatch`)
    if (stableJSONString(actual.finalRuntime) !== stableJSONString(expectedDiagnostics.finalRuntime)) issues.push(`${kind}: final reconciled runtime mismatch`)
    if (stableJSONString(actual.runtime) !== stableJSONString(expectedDiagnostics.runtime)) issues.push(`${kind}: runtime snapshot mismatch`)
    for (const field of RUNTIME_FATAL_EVIDENCE_FIELDS) {
      if (stableJSONString(isObjectRecord(actual.finalRuntime) ? actual.finalRuntime[field] : undefined) !== stableJSONString(expectedDiagnostics.finalRuntime[field])) {
        issues.push(`${kind}: fatal error field ${field} mismatch`)
      }
    }
    if (stableJSONString(isObjectRecord(actual.finalRuntime) ? actual.finalRuntime.consoleDiagnostics : undefined) !== stableJSONString(expectedDiagnostics.finalRuntime.consoleDiagnostics)) {
      issues.push(`${kind}: runtime diagnostics mismatch`)
    }
    if (stableJSONString(isObjectRecord(actual.finalRuntime) ? actual.finalRuntime.expectedNextLinkPrefetchAborts : undefined) !== stableJSONString(expectedDiagnostics.finalRuntime.expectedNextLinkPrefetchAborts)) {
      issues.push(`${kind}: classified prefetch abort records mismatch`)
    }
    if (stableJSONString(isObjectRecord(actual.finalRuntime) ? actual.finalRuntime.requestEvidence : undefined) !== stableJSONString(expectedDiagnostics.finalRuntime.requestEvidence)) {
      issues.push(`${kind}: request correlation IDs, paths, headers, and statuses mismatch`)
    }
  } else {
    if (kind === "expected-next-link-prefetch") {
      const expectedPrefetch = expected as RuntimeEvidencePersistenceRecords["prefetch"]
      if (stableJSONString(actual.expectedNextLinkPrefetchAborts) !== stableJSONString(expectedPrefetch.expectedNextLinkPrefetchAborts)) issues.push(`${kind}: classified prefetch abort records mismatch`)
      if (stableJSONString(actual.requestEvidence) !== stableJSONString(expectedPrefetch.requestEvidence)) issues.push(`${kind}: request correlation IDs, paths, headers, and statuses mismatch`)
    } else {
      const expectedCloseCancellations = expected as RuntimeEvidencePersistenceRecords["closeCancellations"]
      if (!isExactContextCloseCancellationArray(actual.contextCloseCancellations)) issues.push(`${kind}: close-cancellation evidence contains unexpected or missing fields`)
      if (stableJSONString(actual.contextCloseCancellations) !== stableJSONString(expectedCloseCancellations.contextCloseCancellations)) issues.push(`${kind}: close-cancellation evidence mismatch`)
    }
  }

  if (stableJSONString(actual) !== stableJSONString(expected)) issues.push(`${kind}: exact persisted record mismatch`)
  return [...new Set(issues)]
}

const isExactContextCloseCancellationArray = (value: unknown): value is ContextCloseCancellationEvidence[] =>
  Array.isArray(value) && value.every(isContextCloseCancellationEvidence)

const duplicateNames = (names: string[]) => [...new Set(names.filter((name, index) => names.indexOf(name) !== index))].sort()

export function validateRuntimeEvidencePersistence(
  expected: readonly ExpectedRuntimeEvidencePersistence[],
  actual: RuntimeEvidencePersistenceFiles,
): RuntimeEvidencePersistenceValidation {
  const expectedSessionIds = expected.map(({ sessionId }) => sessionId)
  const expectedDiagnostics = new Map(expected.map(({ sessionId, records }) => [sessionId, { fileName: records.diagnostics.persistence.runtimeDiagnosticsFile, value: records.diagnostics }]))
  const expectedPrefetch = new Map(expected.map(({ sessionId, records }) => [sessionId, { fileName: records.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile, value: records.prefetch }]))
  const expectedCloseCancellations = new Map(expected.map(({ sessionId, records }) => [sessionId, { fileName: records.closeCancellations.persistence.contextCloseCancellationEvidenceFile, value: records.closeCancellations }]))
  const expectedDiagnosticsFileNames = [...expectedDiagnostics.values()].map(({ fileName }) => fileName)
  const expectedPrefetchFileNames = [...expectedPrefetch.values()].map(({ fileName }) => fileName)
  const expectedCloseCancellationFileNames = [...expectedCloseCancellations.values()].map(({ fileName }) => fileName)
  const actualDiagnosticsFileNames = actual.diagnostics.map(({ fileName }) => fileName).sort()
  const actualPrefetchFileNames = actual.prefetch.map(({ fileName }) => fileName).sort()
  const actualCloseCancellationFileNames = actual.closeCancellations.map(({ fileName }) => fileName).sort()
  const missingDiagnosticsFileNames = expectedDiagnosticsFileNames.filter((fileName) => !actualDiagnosticsFileNames.includes(fileName)).sort()
  const missingPrefetchFileNames = expectedPrefetchFileNames.filter((fileName) => !actualPrefetchFileNames.includes(fileName)).sort()
  const missingCloseCancellationFileNames = expectedCloseCancellationFileNames.filter((fileName) => !actualCloseCancellationFileNames.includes(fileName)).sort()
  const extraDiagnosticsFileNames = actualDiagnosticsFileNames.filter((fileName) => !expectedDiagnosticsFileNames.includes(fileName)).sort()
  const extraPrefetchFileNames = actualPrefetchFileNames.filter((fileName) => !expectedPrefetchFileNames.includes(fileName)).sort()
  const extraCloseCancellationFileNames = actualCloseCancellationFileNames.filter((fileName) => !expectedCloseCancellationFileNames.includes(fileName)).sort()
  const duplicateDiagnosticsFileNames = duplicateNames(actualDiagnosticsFileNames)
  const duplicatePrefetchFileNames = duplicateNames(actualPrefetchFileNames)
  const duplicateCloseCancellationFileNames = duplicateNames(actualCloseCancellationFileNames)
  const actualDiagnosticsSessionIds = [...new Set(actual.diagnostics.map(({ value }) => persistenceRecordSessionId(value)).filter((sessionId): sessionId is string => sessionId !== null))].sort()
  const actualPrefetchSessionIds = [...new Set(actual.prefetch.map(({ value }) => persistenceRecordSessionId(value)).filter((sessionId): sessionId is string => sessionId !== null))].sort()
  const actualCloseCancellationSessionIds = [...new Set(actual.closeCancellations.map(({ value }) => persistenceRecordSessionId(value)).filter((sessionId): sessionId is string => sessionId !== null))].sort()
  const actualSessionIds = [...new Set([...actualDiagnosticsSessionIds, ...actualPrefetchSessionIds, ...actualCloseCancellationSessionIds])].sort()
  const missingDiagnosticsSessionIds = expected
    .filter(({ records }) => !actualDiagnosticsFileNames.includes(records.diagnostics.persistence.runtimeDiagnosticsFile))
    .map(({ sessionId }) => sessionId)
  const missingPrefetchSessionIds = expected
    .filter(({ records }) => !actualPrefetchFileNames.includes(records.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile))
    .map(({ sessionId }) => sessionId)
  const missingCloseCancellationSessionIds = expected
    .filter(({ records }) => !actualCloseCancellationFileNames.includes(records.closeCancellations.persistence.contextCloseCancellationEvidenceFile))
    .map(({ sessionId }) => sessionId)
  const missingSessionIds = expectedSessionIds.filter((sessionId) => !actualSessionIds.includes(sessionId))
  const extraSessionIds = actualSessionIds.filter((sessionId) => !expectedSessionIds.includes(sessionId))
  const recordMismatches: RuntimeEvidencePersistenceValidation["recordMismatches"] = []

  for (const { sessionId, records } of expected) {
    const diagnosticsMatches = actual.diagnostics.filter(({ fileName }) => fileName === records.diagnostics.persistence.runtimeDiagnosticsFile)
    const prefetchMatches = actual.prefetch.filter(({ fileName }) => fileName === records.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile)
    const closeCancellationMatches = actual.closeCancellations.filter(({ fileName }) => fileName === records.closeCancellations.persistence.contextCloseCancellationEvidenceFile)
    const diagnosticIssues = diagnosticsMatches.length === 1
      ? compareRuntimeEvidencePersistenceRecord(diagnosticsMatches[0].value, records.diagnostics, "runtime-diagnostics")
      : []
    const prefetchIssues = prefetchMatches.length === 1
      ? compareRuntimeEvidencePersistenceRecord(prefetchMatches[0].value, records.prefetch, "expected-next-link-prefetch")
      : []
    const closeCancellationIssues = closeCancellationMatches.length === 1
      ? compareRuntimeEvidencePersistenceRecord(closeCancellationMatches[0].value, records.closeCancellations, "context-close-cancellation")
      : []
    const issues = [...diagnosticIssues, ...prefetchIssues, ...closeCancellationIssues]
    const recordKinds: RuntimeEvidencePersistenceRecordKind[] = []
    if (diagnosticIssues.length > 0) recordKinds.push("runtime-diagnostics")
    if (prefetchIssues.length > 0) recordKinds.push("expected-next-link-prefetch")
    if (closeCancellationIssues.length > 0) recordKinds.push("context-close-cancellation")
    if (issues.length > 0) recordMismatches.push({ sessionId, recordKinds, issues })
  }

  const staleSessionIds = recordMismatches.map(({ sessionId }) => sessionId)
  const errors = [
    ...actual.readErrors,
    ...missingDiagnosticsFileNames.map((fileName) => `missing runtime diagnostics file ${fileName}`),
    ...missingPrefetchFileNames.map((fileName) => `missing expected prefetch evidence file ${fileName}`),
    ...missingCloseCancellationFileNames.map((fileName) => `missing context-close cancellation evidence file ${fileName}`),
    ...extraDiagnosticsFileNames.map((fileName) => `extra runtime diagnostics file ${fileName}`),
    ...extraPrefetchFileNames.map((fileName) => `extra expected prefetch evidence file ${fileName}`),
    ...extraCloseCancellationFileNames.map((fileName) => `extra context-close cancellation evidence file ${fileName}`),
    ...duplicateDiagnosticsFileNames.map((fileName) => `duplicate runtime diagnostics file ${fileName}`),
    ...duplicatePrefetchFileNames.map((fileName) => `duplicate expected prefetch evidence file ${fileName}`),
    ...duplicateCloseCancellationFileNames.map((fileName) => `duplicate context-close cancellation evidence file ${fileName}`),
    ...missingSessionIds.map((sessionId) => `missing runtime evidence session ${sessionId}`),
    ...extraSessionIds.map((sessionId) => `extra runtime evidence session ${sessionId}`),
    ...recordMismatches.flatMap(({ sessionId, issues }) => issues.map((issue) => `${sessionId}: ${issue}`)),
  ]
  return {
    valid: errors.length === 0,
    errors,
    expectedSessionIds,
    actualDiagnosticsFileNames,
    actualPrefetchFileNames,
    actualCloseCancellationFileNames,
    actualDiagnosticsSessionIds,
    actualPrefetchSessionIds,
    actualCloseCancellationSessionIds,
    missingDiagnosticsFileNames,
    missingPrefetchFileNames,
    missingCloseCancellationFileNames,
    missingDiagnosticsSessionIds,
    missingPrefetchSessionIds,
    missingCloseCancellationSessionIds,
    extraDiagnosticsFileNames,
    extraPrefetchFileNames,
    extraCloseCancellationFileNames,
    duplicateDiagnosticsFileNames,
    duplicatePrefetchFileNames,
    duplicateCloseCancellationFileNames,
    missingSessionIds,
    extraSessionIds,
    staleSessionIds,
    recordMismatches,
  }
}

const makeSyntheticRuntimeEvidence = (): RuntimeEvidence => ({
  sessionId: "synthetic-runtime-session",
  sessionPurpose: "ui-tournament",
  sessionExpectedRole: Role.ORGANIZER,
  phase: "closed",
  closeBoundarySequence: 0,
  consoleErrors: [],
  consoleDiagnostics: [],
  requestFailures: [],
  httpErrors: [],
  localNextScriptResponses: [],
  expectedVoidMutationAborts: [],
  expectedNextLinkPrefetchAborts: [],
  contextCloseCancellations: [],
  requestEvidence: [],
  unexpectedAuthNavigations: [],
  expectedAuthProbeResponses: [],
  expectedAuthProbeConsoleWarnings: [],
  expectedAuthProbeFailures: [],
  blockedRequests: [],
})

export function assertRuntimeEvidencePersistenceSelfChecks(): RuntimeEvidencePersistenceSelfCheckReport {
  const sessionId = "runtime-persistence-self-check"
  const runtime = makeSyntheticRuntimeEvidence()
  const expectedRecords = buildRuntimeEvidencePersistenceRecords(sessionId, runtime, null, { contextClosed: true, finalSuiteSnapshot: true })
  const expected = [{ sessionId, records: expectedRecords }]
  const expectedFiles: RuntimeEvidencePersistenceFiles = {
    diagnostics: [{ fileName: expectedRecords.diagnostics.persistence.runtimeDiagnosticsFile, value: expectedRecords.diagnostics }],
    prefetch: [{ fileName: expectedRecords.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile, value: expectedRecords.prefetch }],
    closeCancellations: [{ fileName: expectedRecords.closeCancellations.persistence.contextCloseCancellationEvidenceFile, value: expectedRecords.closeCancellations }],
    readErrors: [],
  }
  const zeroAbortValidation = validateRuntimeEvidencePersistence(expected, expectedFiles)
  if (!zeroAbortValidation.valid) throw new Error(`Runtime evidence persistence zero-abort self-check failed: ${JSON.stringify(zeroAbortValidation.errors)}`)

  const closeRequest = makeNextLinkPrefetchClassifierFixture({
    correlationId: "runtime-persistence-self-check-close",
    sequence: 1,
    phaseAtRequest: "closing",
    path: "/_next/static/chunks/app/tournament/close-self-check.js",
    url: "/_next/static/chunks/app/tournament/close-self-check.js",
    resourceType: "script",
    responseObserved: false,
    responseStatus: null,
    failure: null,
    classification: "pending",
  })
  const closeRuntime: RuntimeEvidence = { ...runtime, sessionId: "runtime-persistence-self-check-close", requestEvidence: [closeRequest], contextCloseCancellations: [] }
  reconcileContextCloseCancellations(closeRuntime)
  const closeRecords = buildRuntimeEvidencePersistenceRecords(closeRuntime.sessionId!, closeRuntime, null, { contextClosed: true, finalSuiteSnapshot: true })
  const closeValidation = validateRuntimeEvidencePersistence(
    [{ sessionId: closeRuntime.sessionId!, records: closeRecords }],
    {
      diagnostics: [{ fileName: closeRecords.diagnostics.persistence.runtimeDiagnosticsFile, value: closeRecords.diagnostics }],
      prefetch: [{ fileName: closeRecords.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile, value: closeRecords.prefetch }],
      closeCancellations: [{ fileName: closeRecords.closeCancellations.persistence.contextCloseCancellationEvidenceFile, value: closeRecords.closeCancellations }],
      readErrors: [],
    },
  )
  if (!closeValidation.valid || closeRuntime.contextCloseCancellations.length !== 1) {
    throw new Error(`Runtime evidence persistence close-cancellation self-check failed: ${JSON.stringify(closeValidation.errors)}`)
  }

  const staleRuntime = { ...runtime, consoleErrors: ["synthetic late console error"] }
  const staleRecords = buildRuntimeEvidencePersistenceRecords(sessionId, staleRuntime, null, { contextClosed: true, finalSuiteSnapshot: true })
  const staleValidation = validateRuntimeEvidencePersistence(expected, {
    diagnostics: [{ fileName: expectedRecords.diagnostics.persistence.runtimeDiagnosticsFile, value: staleRecords.diagnostics }],
    prefetch: expectedFiles.prefetch,
    closeCancellations: expectedFiles.closeCancellations,
    readErrors: [],
  })
  if (staleValidation.valid || !staleValidation.staleSessionIds.includes(sessionId)) {
    throw new Error("Runtime evidence persistence stale-snapshot self-check failed.")
  }

  const extraSessionId = "runtime-persistence-self-check-extra"
  const extraRecords = buildRuntimeEvidencePersistenceRecords(extraSessionId, runtime, null, { contextClosed: true, finalSuiteSnapshot: true })
  const extraValidation = validateRuntimeEvidencePersistence(expected, {
    diagnostics: [...expectedFiles.diagnostics, { fileName: extraRecords.diagnostics.persistence.runtimeDiagnosticsFile, value: extraRecords.diagnostics }],
    prefetch: [...expectedFiles.prefetch, { fileName: extraRecords.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile, value: extraRecords.prefetch }],
    closeCancellations: [...expectedFiles.closeCancellations, { fileName: extraRecords.closeCancellations.persistence.contextCloseCancellationEvidenceFile, value: extraRecords.closeCancellations }],
    readErrors: [],
  })
  if (extraValidation.valid || !extraValidation.extraSessionIds.includes(extraSessionId)) {
    throw new Error("Runtime evidence persistence extra-session self-check failed.")
  }

  const missingValidation = validateRuntimeEvidencePersistence(expected, { diagnostics: [], prefetch: [], closeCancellations: [], readErrors: [] })
  if (missingValidation.valid || !missingValidation.missingSessionIds.includes(sessionId)) {
    throw new Error("Runtime evidence persistence missing-session self-check failed.")
  }

  return {
    passed: true,
    staleSnapshotDetected: true,
    extraSessionDetected: true,
    missingSessionDetected: true,
    zeroAbortSessionValid: true,
    zeroCloseCancellationSessionValid: true,
    nonZeroCloseCancellationSessionValid: true,
  }
}

export const runtimeEvidencePersistenceSelfCheckReport = assertRuntimeEvidencePersistenceSelfChecks()

export type VoidMutationTerminalSelfCheckReport = {
  passed: true
  normalTerminalAccepted: true
  acceptedAbortTerminalAccepted: true
  orphanRejected: true
  duplicateRejected: true
  wrongPathRejected: true
  wrongStatusRejected: true
  missingRuntimeRejected: true
  delayedRequestfailedCaptured: true
  roundTripDurableReadback: true
  bijectionAccepted: true
  bijectionMissingRejected: true
}

export const VOID_MUTATION_TERMINAL_RECONCILIATION_TIMEOUT_MS = 5_000
export const DELAYED_REQUESTFAILED_SELF_CHECK_DELAY_MS = 75

const makeVoidMutationSelfCheckRequest = (overrides: NextLinkPrefetchClassifierOverrides = {}) => makeNextLinkPrefetchClassifierFixture({
  correlationId: "void-mutation-self-check-1",
  url: "/api/tournaments/9101/round-groups/1/rounds/1/matches/results",
  path: "/api/tournaments/9101/round-groups/1/rounds/1/matches/results",
  method: "PATCH",
  resourceType: "fetch",
  isLocalRequest: true,
  isNavigationRequest: false,
  sessionId: "void-mutation-self-check-session",
  sessionPurpose: "ui-tournament",
  sessionExpectedRole: Role.ORGANIZER,
  pagePathAtRequest: "/tournament/9101",
  pagePathAtFailure: "/tournament/9101",
  expectedTournamentPathAtRequest: "/tournament/9101",
  expectedTournamentPathAtFailure: "/tournament/9101",
  responseObserved: true,
  responseStatus: 200,
  failure: "net::ERR_ABORTED",
  classification: "expected-void-mutation-abort",
  voidMutationCorrelationId: "void-mutation-self-check-1",
  voidMutationOwner: { caseName: "self-check-case", mutationName: "self-check-mutation" },
  voidMutationTerminalOutcome: "accepted-abort",
  ...overrides,
})

const makeVoidMutationSelfCheckRuntime = (
  requests: NextLinkPrefetchRequestEvidence[],
  expectedVoidMutationAborts = requests.filter((request) => isExpectedVoidMutationEvidence(request)).map(asExpectedVoidMutationAbort),
): RuntimeEvidence => ({
  ...makeSyntheticRuntimeEvidence(),
  requestEvidence: requests,
  expectedVoidMutationAborts,
})

export function assertVoidMutationTerminalSelfChecks(): VoidMutationTerminalSelfCheckReport {
  const acceptedRequest = makeVoidMutationSelfCheckRequest()
  const acceptedRuntime = makeVoidMutationSelfCheckRuntime([acceptedRequest])
  const acceptedValidation = validateVoidMutationTerminalEvidence(acceptedRuntime)
  if (!acceptedValidation.valid || acceptedValidation.acceptedAborts.length !== 1) throw new Error("Void mutation accepted-abort self-check failed.")

  const normalRequest = makeVoidMutationSelfCheckRequest({
    failure: null,
    classification: "response",
    voidMutationTerminalOutcome: "normal",
  })
  const normalValidation = validateVoidMutationTerminalEvidence(makeVoidMutationSelfCheckRuntime([normalRequest], []))
  if (!normalValidation.valid || normalValidation.acceptedAborts.length !== 0) throw new Error("Void mutation normal-terminal self-check failed.")

  const orphanRequest = makeVoidMutationSelfCheckRequest({ voidMutationOwner: null })
  const orphanValidation = validateVoidMutationTerminalEvidence(makeVoidMutationSelfCheckRuntime([orphanRequest], []))
  if (orphanValidation.valid || !orphanValidation.orphanCorrelationIds.includes("void-mutation-self-check-1")) throw new Error("Void mutation orphan self-check failed.")

  const duplicateRequest = makeVoidMutationSelfCheckRequest()
  const duplicateValidation = validateVoidMutationTerminalEvidence(makeVoidMutationSelfCheckRuntime([acceptedRequest, duplicateRequest]))
  if (duplicateValidation.valid || !duplicateValidation.duplicateCorrelationIds.includes("void-mutation-self-check-1")) throw new Error("Void mutation duplicate self-check failed.")

  const wrongPathRequest = makeVoidMutationSelfCheckRequest({
    path: "/api/tournaments/9101/round-groups/1/proceed/extra",
    url: "/api/tournaments/9101/round-groups/1/proceed/extra",
  })
  const wrongPathValidation = validateVoidMutationTerminalEvidence(makeVoidMutationSelfCheckRuntime([wrongPathRequest], []))
  if (wrongPathValidation.valid || !wrongPathValidation.invalidCorrelationIds.includes("void-mutation-self-check-1")) throw new Error("Void mutation wrong-path self-check failed.")

  const wrongStatusRequest = makeVoidMutationSelfCheckRequest({ responseStatus: 500 })
  const wrongStatusValidation = validateVoidMutationTerminalEvidence(makeVoidMutationSelfCheckRuntime([wrongStatusRequest], []))
  if (wrongStatusValidation.valid || !wrongStatusValidation.invalidCorrelationIds.includes("void-mutation-self-check-1")) throw new Error("Void mutation wrong-status self-check failed.")

  const missingRuntimeValidation = validateVoidMutationTerminalEvidence(makeVoidMutationSelfCheckRuntime([], [asExpectedVoidMutationAbort(acceptedRequest)]))
  if (missingRuntimeValidation.valid || !missingRuntimeValidation.missingRuntimeCorrelationIds.includes("void-mutation-self-check-1")) throw new Error("Void mutation missing-runtime self-check failed.")

  const delayedRequest = makeVoidMutationSelfCheckRequest({
    failure: null,
    classification: "response",
    voidMutationTerminalOutcome: "pending",
  })
  const delayedRuntime = makeVoidMutationSelfCheckRuntime([delayedRequest], [])
  const pendingValidation = validateVoidMutationTerminalEvidence(delayedRuntime)
  if (pendingValidation.valid || VOID_MUTATION_TERMINAL_RECONCILIATION_TIMEOUT_MS <= DELAYED_REQUESTFAILED_SELF_CHECK_DELAY_MS) throw new Error("Delayed requestfailed terminal self-check did not remain bounded.")
  delayedRequest.failure = "net::ERR_ABORTED"
  delayedRequest.classification = "expected-void-mutation-abort"
  delayedRequest.voidMutationTerminalOutcome = "accepted-abort"
  delayedRuntime.expectedVoidMutationAborts = [asExpectedVoidMutationAbort(delayedRequest)]
  const delayedValidation = validateVoidMutationTerminalEvidence(delayedRuntime)
  if (!delayedValidation.valid || delayedValidation.acceptedAborts.length !== 1) throw new Error("Delayed requestfailed terminal self-check failed.")

  const records = buildRuntimeEvidencePersistenceRecords(acceptedRuntime.sessionId!, acceptedRuntime, null, { contextClosed: true, finalSuiteSnapshot: true })
  const roundTripValidation = validateRuntimeEvidencePersistence(
    [{ sessionId: acceptedRuntime.sessionId!, records }],
    {
      diagnostics: [{ fileName: records.diagnostics.persistence.runtimeDiagnosticsFile, value: records.diagnostics }],
      prefetch: [{ fileName: records.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile, value: records.prefetch }],
      closeCancellations: [{ fileName: records.closeCancellations.persistence.contextCloseCancellationEvidenceFile, value: records.closeCancellations }],
      readErrors: [],
    },
  )
  if (!roundTripValidation.valid) throw new Error(`Void mutation durable readback self-check failed: ${JSON.stringify(roundTripValidation.errors)}`)

  const acceptedBijection = validateVoidMutationBijection(
    [acceptedValidation],
    [{ correlationId: acceptedRequest.voidMutationCorrelationId!, caseName: "self-check-case", mutationName: "self-check-mutation", recordName: "self-check-mutation" }],
  )
  if (!acceptedBijection.valid) throw new Error(`Void mutation bijection self-check failed: ${JSON.stringify(acceptedBijection.errors)}`)
  const missingBijection = validateVoidMutationBijection([acceptedValidation], [])
  if (missingBijection.valid || !missingBijection.missingPersistedCorrelationIds.includes("void-mutation-self-check-1")) {
    throw new Error("Void mutation missing-persisted-record self-check failed.")
  }

  return {
    passed: true,
    normalTerminalAccepted: true,
    acceptedAbortTerminalAccepted: true,
    orphanRejected: true,
    duplicateRejected: true,
    wrongPathRejected: true,
    wrongStatusRejected: true,
    missingRuntimeRejected: true,
    delayedRequestfailedCaptured: true,
    roundTripDurableReadback: true,
    bijectionAccepted: true,
    bijectionMissingRejected: true,
  }
}

export const voidMutationTerminalSelfCheckReport = assertVoidMutationTerminalSelfChecks()

export type ContextCloseCancellationSelfCheckOverrides = Partial<Omit<NextLinkPrefetchRequestEvidence, "query" | "headers">> & {
  query?: Partial<NextLinkPrefetchRequestEvidence["query"]>
  headers?: Partial<NextLinkPrefetchRequestEvidence["headers"]>
}

const makeContextCloseCancellationFixture = (overrides: ContextCloseCancellationSelfCheckOverrides = {}) => makeNextLinkPrefetchClassifierFixture({
  correlationId: "context-close-self-check-1",
  sequence: 11,
  phaseAtRequest: "closing",
  url: "/_next/static/chunks/app/tournament/page-close-check.js",
  path: "/_next/static/chunks/app/tournament/page-close-check.js",
  method: "GET",
  resourceType: "script",
  isLocalRequest: true,
  isNavigationRequest: false,
  responseObserved: false,
  responseStatus: null,
  failure: null,
  classification: "pending",
  voidMutationCorrelationId: null,
  voidMutationOwner: null,
  voidMutationTerminalOutcome: null,
  ...overrides,
  query: { mode: null, rscPresent: false, ...overrides.query },
  headers: {
    rsc: null,
    nextRouterPrefetch: null,
    nextRouterSegmentPrefetch: null,
    ...overrides.headers,
  },
})

export function validateContextCloseCancellationBijection(
  runtimes: readonly RuntimeEvidence[],
  persistedRecords: readonly PersistedContextCloseCancellationRecord[],
): ContextCloseCancellationBijectionValidation {
  const runtimeEntries = runtimes.flatMap((runtime) => runtime.requestEvidence
    .filter((entry) => entry.classification === "context-close-cancelled")
    .map((entry) => ({ sessionId: runtime.sessionId, boundary: runtime.closeBoundarySequence, entry })))
  const runtimeEvidenceEntries = runtimes.flatMap((runtime) => runtime.contextCloseCancellations
    .map((entry) => ({ sessionId: runtime.sessionId, entry })))
  const persistedEntries = persistedRecords.flatMap((record) => record.contextCloseCancellations
    .map((entry) => ({ sessionId: record.sessionId, entry })))
  const runtimeCorrelationIds = runtimeEntries.map(({ entry }) => entry.correlationId)
  const persistedCorrelationIds = persistedEntries.map(({ entry }) => entry.correlationId)
  const runtimeEvidenceCorrelationIds = runtimeEvidenceEntries.map(({ entry }) => entry.correlationId)
  const duplicateRuntimeCorrelationIds = uniqueSorted(runtimeCorrelationIds.filter((id, index) => runtimeCorrelationIds.indexOf(id) !== index))
  const duplicatePersistedCorrelationIds = uniqueSorted(persistedCorrelationIds.filter((id, index) => persistedCorrelationIds.indexOf(id) !== index))
  const duplicateRuntimeEvidenceCorrelationIds = uniqueSorted(runtimeEvidenceCorrelationIds.filter((id, index) => runtimeEvidenceCorrelationIds.indexOf(id) !== index))
  const runtimeByCorrelation = new Map(runtimeEntries.map(({ entry, sessionId, boundary }) => [entry.correlationId, { entry, sessionId, boundary }]))
  const runtimeEvidenceByCorrelation = new Map(runtimeEvidenceEntries.map(({ entry, sessionId }) => [entry.correlationId, { entry, sessionId }]))
  const persistedByCorrelation = new Map(persistedEntries.map(({ entry, sessionId }) => [entry.correlationId, { entry, sessionId }]))
  const missingPersistedCorrelationIds = uniqueSorted(runtimeCorrelationIds.filter((id) => !persistedByCorrelation.has(id)))
  const orphanPersistedCorrelationIds = uniqueSorted(persistedCorrelationIds.filter((id) => !runtimeByCorrelation.has(id)))
  const missingRuntimeEvidenceCorrelationIds = uniqueSorted(runtimeCorrelationIds.filter((id) => !runtimeEvidenceByCorrelation.has(id)))
  const orphanRuntimeEvidenceCorrelationIds = uniqueSorted(runtimeEvidenceCorrelationIds.filter((id) => !runtimeByCorrelation.has(id)))
  const invalidRuntimeCorrelationIds = uniqueSorted(runtimeEntries
    .filter(({ entry, sessionId, boundary }) => sessionId === null || boundary === null || !isExpectedContextCloseCancellation(entry, boundary))
    .map(({ entry }) => entry.correlationId))
  const invalidRuntimeEvidenceCorrelationIds = uniqueSorted(runtimeEvidenceEntries
    .filter(({ entry, sessionId }) => {
      const runtime = runtimeByCorrelation.get(entry.correlationId)
      if (!runtime || sessionId !== runtime.sessionId || runtime.boundary === null) return true
      if (!isContextCloseCancellationEvidence(entry) || !isExpectedContextCloseCancellation(runtime.entry, runtime.boundary)) return true
      const expected = asContextCloseCancellationEvidence({ ...runtime.entry, classification: "pending" }, runtime.boundary)
      return stableJSONString(entry) !== stableJSONString(expected)
    })
    .map(({ entry }) => entry.correlationId))
  const wrongMetadataCorrelationIds = uniqueSorted(persistedEntries
    .filter(({ entry }) => {
      const runtime = runtimeByCorrelation.get(entry.correlationId)
      if (!runtime) return false
      if (!isContextCloseCancellationEvidence(entry) || runtime.boundary === null || !isExpectedContextCloseCancellation(runtime.entry, runtime.boundary)) return true
      const expected = asContextCloseCancellationEvidence({ ...runtime.entry, classification: "pending" }, runtime.boundary)
      return stableJSONString(entry) !== stableJSONString(expected)
    })
    .map(({ entry }) => entry.correlationId))
  const wrongSessionCorrelationIds = uniqueSorted(persistedEntries
    .filter(({ entry, sessionId }) => {
      const runtime = runtimeByCorrelation.get(entry.correlationId)
      return runtime !== undefined && runtime.sessionId !== null && runtime.sessionId !== sessionId
    })
    .map(({ entry }) => entry.correlationId))
  const errors = [
    ...duplicateRuntimeCorrelationIds.map((id) => `duplicate runtime context-close cancellation correlation ${id}`),
    ...duplicatePersistedCorrelationIds.map((id) => `duplicate durable context-close cancellation correlation ${id}`),
    ...duplicateRuntimeEvidenceCorrelationIds.map((id) => `duplicate runtime context-close evidence correlation ${id}`),
    ...missingPersistedCorrelationIds.map((id) => `runtime context-close cancellation has no durable evidence ${id}`),
    ...orphanPersistedCorrelationIds.map((id) => `durable context-close cancellation has no runtime entry ${id}`),
    ...missingRuntimeEvidenceCorrelationIds.map((id) => `runtime context-close cancellation has no runtime evidence ${id}`),
    ...orphanRuntimeEvidenceCorrelationIds.map((id) => `runtime context-close evidence has no classified request ${id}`),
    ...invalidRuntimeCorrelationIds.map((id) => `invalid runtime context-close cancellation ${id}`),
    ...invalidRuntimeEvidenceCorrelationIds.map((id) => `invalid runtime context-close evidence ${id}`),
    ...wrongMetadataCorrelationIds.map((id) => `wrong durable context-close cancellation metadata ${id}`),
    ...wrongSessionCorrelationIds.map((id) => `wrong durable context-close cancellation session ${id}`),
  ]
  return {
    valid: errors.length === 0,
    runtimeCorrelationIds: uniqueSorted(runtimeCorrelationIds),
    persistedCorrelationIds: uniqueSorted(persistedCorrelationIds),
    missingPersistedCorrelationIds,
    orphanPersistedCorrelationIds,
    duplicateRuntimeCorrelationIds,
    duplicatePersistedCorrelationIds,
    duplicateRuntimeEvidenceCorrelationIds,
    invalidRuntimeEvidenceCorrelationIds,
    missingRuntimeEvidenceCorrelationIds,
    invalidRuntimeCorrelationIds,
    wrongMetadataCorrelationIds,
    wrongSessionCorrelationIds,
    errors,
  }
}

export function readPersistedContextCloseCancellationRecords(files: RuntimeEvidencePersistenceFiles): PersistedContextCloseCancellationRecord[] {
  return files.closeCancellations.flatMap(({ value }) => {
    if (!isObjectRecord(value) || typeof value.sessionId !== "string" || !Array.isArray(value.contextCloseCancellations)) return []
    return [{ sessionId: value.sessionId, contextCloseCancellations: value.contextCloseCancellations as ContextCloseCancellationEvidence[] }]
  })
}

export function assertContextCloseCancellationSelfChecks(): ContextCloseCancellationSelfCheckReport {
  const staticRequests = [
    makeContextCloseCancellationFixture({ correlationId: "context-close-self-check-static-1", sequence: 11 }),
    makeContextCloseCancellationFixture({
      correlationId: "context-close-self-check-static-2",
      sequence: 12,
      path: "/tournament/9101",
      url: "/tournament/9101?_rsc=[present]",
      resourceType: "fetch",
      query: { rscPresent: true },
      headers: { rsc: "1", nextRouterPrefetch: "1", nextRouterSegmentPrefetch: "1" },
    }),
  ]
  const boundary = 10
  if (!staticRequests.every((request) => isContextCloseCancellationCandidate(request, boundary))) {
    throw new Error("Context-close cancellation static fixture self-check failed.")
  }

  const preCloseRequest = makeContextCloseCancellationFixture({ correlationId: "context-close-self-check-pre-close", sequence: boundary, phaseAtRequest: "open" })
  if (isContextCloseCancellationCandidate(preCloseRequest, boundary)) throw new Error("Context-close cancellation pre-close self-check failed.")

  const negativeCases: Array<{ name: string; request: NextLinkPrefetchRequestEvidence }> = [
    { name: "API path", request: makeContextCloseCancellationFixture({ path: "/api/tournaments/9101", url: "/api/tournaments/9101", resourceType: "fetch", query: { rscPresent: true }, headers: { rsc: "1", nextRouterPrefetch: "1", nextRouterSegmentPrefetch: "1" } }) },
    { name: "document", request: makeContextCloseCancellationFixture({ resourceType: "document" }) },
    { name: "navigation", request: makeContextCloseCancellationFixture({ isNavigationRequest: true }) },
    { name: "auth RSC prefetch", request: makeContextCloseCancellationFixture({ path: "/auth", url: "/auth?_rsc=[present]", resourceType: "fetch", query: { rscPresent: true }, headers: { rsc: "1", nextRouterPrefetch: "1", nextRouterSegmentPrefetch: "1" } }) },
    { name: "app fetch", request: makeContextCloseCancellationFixture({ path: "/tournament/9101", url: "/tournament/9101", resourceType: "fetch" }) },
    { name: "unsettled response classification", request: makeContextCloseCancellationFixture({ classification: "response" }) },
    { name: "owned mutation", request: makeContextCloseCancellationFixture({ method: "PATCH", path: "/api/tournaments/9101/round-groups/1/proceed", url: "/api/tournaments/9101/round-groups/1/proceed", resourceType: "fetch", voidMutationCorrelationId: "void-mutation-context-close-self-check", voidMutationOwner: { caseName: "self-check-case", mutationName: "owned" }, voidMutationTerminalOutcome: "pending" }) },
    { name: "HTTP error", request: makeContextCloseCancellationFixture({ responseObserved: true, responseStatus: 500, classification: "response" }) },
    { name: "request failure", request: makeContextCloseCancellationFixture({ failure: "net::ERR_FAILED", classification: "unexpected-request-failure" }) },
  ]
  for (const { name, request } of negativeCases) {
    if (isContextCloseCancellationCandidate(request, boundary)) throw new Error(`Context-close cancellation ${name} self-check failed.`)
  }

  const acceptedRuntime: RuntimeEvidence = {
    ...makeSyntheticRuntimeEvidence(),
    sessionId: "context-close-self-check-session",
    phase: "closed",
    closeBoundarySequence: boundary,
    requestEvidence: staticRequests,
    contextCloseCancellations: [],
  }
  reconcileContextCloseCancellations(acceptedRuntime)
  if (acceptedRuntime.contextCloseCancellations.length !== 2 || acceptedRuntime.requestEvidence.some((request) => request.classification !== "context-close-cancelled")) {
    throw new Error("Context-close cancellation terminal classification self-check failed.")
  }
  assertRuntimeEvidenceIsClean(acceptedRuntime)

  const preCloseRuntime = { ...acceptedRuntime, requestEvidence: [preCloseRequest], contextCloseCancellations: [] }
  let preCloseRejected = false
  try {
    assertRuntimeEvidenceIsClean(preCloseRuntime)
  } catch {
    preCloseRejected = true
  }
  if (!preCloseRejected) throw new Error("Context-close cancellation pre-close pending request was not fatal.")

  const negativeRuntimeFailures = negativeCases.map(({ request }) => ({
    ...acceptedRuntime,
    requestEvidence: [request],
    contextCloseCancellations: [],
    httpErrors: request.responseStatus !== null && request.responseStatus >= 400 ? [{ status: request.responseStatus, path: request.path }] : [],
  }))
  if (!negativeRuntimeFailures.every((runtime) => {
    reconcileContextCloseCancellations(runtime)
    try {
      assertRuntimeEvidenceIsClean(runtime)
      return false
    } catch {
      return true
    }
  })) throw new Error("Context-close cancellation negative runtime self-check failed.")
  const ownedVoidRuntime = negativeRuntimeFailures.find((runtime) => runtime.requestEvidence[0].voidMutationCorrelationId !== null)
  if (!ownedVoidRuntime || ownedVoidRuntime.contextCloseCancellations.length !== 0) throw new Error("Owned void mutation was context-close cancelled.")

  const persisted = [{ sessionId: acceptedRuntime.sessionId!, contextCloseCancellations: acceptedRuntime.contextCloseCancellations }]
  const acceptedBijection = validateContextCloseCancellationBijection([acceptedRuntime], persisted)
  if (!acceptedBijection.valid || acceptedBijection.runtimeCorrelationIds.length !== 2) throw new Error("Context-close cancellation accepted bijection self-check failed.")
  const persistedRecords = buildRuntimeEvidencePersistenceRecords(acceptedRuntime.sessionId!, acceptedRuntime, null, { contextClosed: true, finalSuiteSnapshot: true })
  const persistedValidation = validateRuntimeEvidencePersistence(
    [{ sessionId: acceptedRuntime.sessionId!, records: persistedRecords }],
    {
      diagnostics: [{ fileName: persistedRecords.diagnostics.persistence.runtimeDiagnosticsFile, value: persistedRecords.diagnostics }],
      prefetch: [{ fileName: persistedRecords.prefetch.persistence.expectedNextLinkPrefetchEvidenceFile, value: persistedRecords.prefetch }],
      closeCancellations: [{ fileName: persistedRecords.closeCancellations.persistence.contextCloseCancellationEvidenceFile, value: persistedRecords.closeCancellations }],
      readErrors: [],
    },
  )
  if (!persistedValidation.valid) throw new Error(`Context-close cancellation exact persistence self-check failed: ${JSON.stringify(persistedValidation.errors)}`)
  const zeroRuntime = { ...makeSyntheticRuntimeEvidence(), phase: "closed" as const, closeBoundarySequence: 0 }
  const zeroBijection = validateContextCloseCancellationBijection([zeroRuntime], [{ sessionId: zeroRuntime.sessionId!, contextCloseCancellations: [] }])
  if (!zeroBijection.valid) throw new Error("Context-close cancellation zero bijection self-check failed.")
  const missingBijection = validateContextCloseCancellationBijection([acceptedRuntime], [])
  if (missingBijection.valid || missingBijection.missingPersistedCorrelationIds.length !== 2) throw new Error("Context-close cancellation missing durable self-check failed.")
  const extraEvidence = { ...acceptedRuntime.contextCloseCancellations[0], correlationId: "context-close-self-check-extra" }
  const extraBijection = validateContextCloseCancellationBijection([acceptedRuntime], [{ sessionId: acceptedRuntime.sessionId!, contextCloseCancellations: [...acceptedRuntime.contextCloseCancellations, extraEvidence] }])
  if (extraBijection.valid || !extraBijection.orphanPersistedCorrelationIds.includes("context-close-self-check-extra")) throw new Error("Context-close cancellation extra durable self-check failed.")
  const duplicateBijection = validateContextCloseCancellationBijection([acceptedRuntime], [{ sessionId: acceptedRuntime.sessionId!, contextCloseCancellations: [...acceptedRuntime.contextCloseCancellations, acceptedRuntime.contextCloseCancellations[0]] }])
  if (duplicateBijection.valid || !duplicateBijection.duplicatePersistedCorrelationIds.includes(acceptedRuntime.contextCloseCancellations[0].correlationId)) throw new Error("Context-close cancellation duplicate durable self-check failed.")

  return {
    passed: true,
    acceptedStaticFixtureCount: 2,
    preClosePendingRejected: true,
    apiRejected: true,
    documentRejected: true,
    navigationRejected: true,
    authRejected: true,
    appFetchRejected: true,
    mutationRejected: true,
    ownedVoidNeverCancelled: true,
    httpErrorRejected: true,
    failureRejected: true,
    missingDurableRejected: true,
    extraDurableRejected: true,
    duplicateDurableRejected: true,
    zeroBijectionAccepted: true,
  }
}

export const contextCloseCancellationSelfCheckReport = assertContextCloseCancellationSelfChecks()

export async function captureCheckpoint(page: Page, run: RunEvidence, name: string) {
  const filePath = path.join(run.root, "screenshots", `${safeFilePart(name)}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  return filePath
}

export async function finalizeRunEvidence(run: RunEvidence, value: unknown) {
  await writeRunRecord(run, "final-report", value)
  const entries = await readdir(run.root, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(run.root, entry.name)
    if (entry.isDirectory()) {
      const nested = await readdir(entryPath)
      for (const nestedName of nested) await chmod(path.join(entryPath, nestedName), 0o444)
      await chmod(entryPath, 0o555)
    } else {
      await chmod(entryPath, 0o444)
    }
  }
  await chmod(run.root, 0o555)
}

let runtimeEvidenceInstanceCounter = 0

type RuntimeEvidenceState = {
  expectedTournamentPath: string | null
  mainFrameAuthNavigationObserved: boolean
  sessionId: string | null
  sessionPurpose: SessionPurpose | null
  sessionExpectedRole: Role | null
  phase: RuntimeEvidencePhase
  requestSequence: number
  pendingVoidMutationOwners: VoidMutationOwner[]
  lastVoidMutationReconciliation: VoidMutationTerminalReconciliation | null
  voidMutationWaiters: Set<() => void>
}
const runtimeEvidenceStates = new WeakMap<RuntimeEvidence, RuntimeEvidenceState>()

export type RuntimeClosingBoundary = {
  closeBoundarySequence: number
  phase: "closing"
}

export function setRuntimeExpectedTournamentPath(runtime: RuntimeEvidence, expectedPath: string) {
  const state = runtimeEvidenceStates.get(runtime)
  if (!state) throw new Error("Runtime evidence is not attached to a page.")
  state.expectedTournamentPath = expectedPath
}

export function registerVoidMutationOwnership(runtime: RuntimeEvidence, owner: VoidMutationOwner) {
  const state = runtimeEvidenceStates.get(runtime)
  if (!state) throw new Error("Runtime evidence is not attached to a page.")
  if (!owner.caseName || !owner.mutationName) throw new Error("Void mutation ownership requires caseName and mutationName.")
  const key = voidMutationOwnerKey(owner)
  if (state.pendingVoidMutationOwners.some((pending) => voidMutationOwnerKey(pending) === key)) {
    throw new Error(`Duplicate pending void mutation owner ${key}.`)
  }
  state.pendingVoidMutationOwners.push({ ...owner })
  state.lastVoidMutationReconciliation = null
}

export function beginRuntimeClosing(runtime: RuntimeEvidence): RuntimeClosingBoundary {
  const state = runtimeEvidenceStates.get(runtime)
  if (!state) throw new Error("Runtime evidence is not attached to a page.")
  if (runtime.phase !== "open" || state.phase !== "open") throw new Error(`Runtime closing boundary cannot start from phase ${runtime.phase}.`)
  if (state.pendingVoidMutationOwners.length > 0) throw new Error("Runtime closing boundary cannot cross with owned void mutations pending.")
  const boundary = { closeBoundarySequence: state.requestSequence, phase: "closing" as const }
  state.phase = boundary.phase
  runtime.phase = boundary.phase
  runtime.closeBoundarySequence = boundary.closeBoundarySequence
  return boundary
}

export function finishRuntimeClose(runtime: RuntimeEvidence) {
  const state = runtimeEvidenceStates.get(runtime)
  if (!state) throw new Error("Runtime evidence is not attached to a page.")
  if (runtime.phase === "closed" && state.phase === "closed") return [...runtime.contextCloseCancellations]
  if (runtime.phase !== "closing" || state.phase !== "closing" || runtime.closeBoundarySequence === null) {
    throw new Error(`Runtime close cannot finish from phase ${runtime.phase}.`)
  }
  state.phase = "closed"
  runtime.phase = "closed"
  return reconcileContextCloseCancellations(runtime)
}

const voidMutationTerminalStateSettled = (evidence: RuntimeEvidence, state: RuntimeEvidenceState) =>
  state.pendingVoidMutationOwners.length === 0 &&
  evidence.requestEvidence
    .filter((entry) => entry.voidMutationCorrelationId !== null)
    .every((entry) => entry.voidMutationTerminalOutcome !== null && entry.voidMutationTerminalOutcome !== "pending")

const notifyVoidMutationTerminalWaiters = (state: RuntimeEvidenceState) => {
  for (const waiter of [...state.voidMutationWaiters]) waiter()
}

export async function reconcileVoidMutationTerminal(
  runtime: RuntimeEvidence,
  options: { timeoutMs?: number } = {},
): Promise<VoidMutationTerminalReconciliation> {
  const state = runtimeEvidenceStates.get(runtime)
  if (!state) throw new Error("Runtime evidence is not attached to a page.")
  if (state.lastVoidMutationReconciliation && voidMutationTerminalStateSettled(runtime, state)) return state.lastVoidMutationReconciliation
  const timeoutMs = options.timeoutMs ?? VOID_MUTATION_TERMINAL_RECONCILIATION_TIMEOUT_MS
  let timedOut = false
  if (!voidMutationTerminalStateSettled(runtime, state)) {
    await new Promise<void>((resolve) => {
      let completed = false
      let timeout: ReturnType<typeof setTimeout> | null = null
      const complete = (didTimeout: boolean) => {
        if (completed) return
        completed = true
        if (timeout) clearTimeout(timeout)
        state.voidMutationWaiters.delete(check)
        timedOut = didTimeout
        resolve()
      }
      const check = () => {
        if (voidMutationTerminalStateSettled(runtime, state)) complete(false)
      }
      state.voidMutationWaiters.add(check)
      timeout = setTimeout(() => complete(true), timeoutMs)
      check()
    })
  }
  const reconciliation = validateVoidMutationTerminalEvidence(runtime, state.pendingVoidMutationOwners)
  const result = { ...reconciliation, timedOut: timedOut || reconciliation.timedOut }
  state.lastVoidMutationReconciliation = result
  return result
}

export type RuntimeEvidenceSessionOptions = {
  sessionId?: string | null
  purpose?: SessionPurpose | null
  expectedRole?: Role | null
  expectedTournamentPath?: string | null
}

export async function attachRuntimeEvidence(page: Page, options: RuntimeEvidenceSessionOptions = {}): Promise<RuntimeEvidence> {
  const responseStatusByRequest = new Map<PageRequest, number>()
  const nextLinkRequestByRequest = new Map<PageRequest, NextLinkPrefetchRequestEvidence>()
  const runtimeInstanceId = ++runtimeEvidenceInstanceCounter
  let nextCorrelationId = 0
  let nextLinkCorrelationId = 0
  const evidence: RuntimeEvidence = { sessionId: options.sessionId ?? null, sessionPurpose: options.purpose ?? null, sessionExpectedRole: options.expectedRole ?? null, phase: "open", closeBoundarySequence: null, consoleErrors: [], consoleDiagnostics: [], requestFailures: [], httpErrors: [], localNextScriptResponses: [], expectedVoidMutationAborts: [], expectedNextLinkPrefetchAborts: [], contextCloseCancellations: [], requestEvidence: [], unexpectedAuthNavigations: [], expectedAuthProbeResponses: [], expectedAuthProbeConsoleWarnings: [], expectedAuthProbeFailures: [], blockedRequests: [] }
  const runtimeState: RuntimeEvidenceState = {
    expectedTournamentPath: options.expectedTournamentPath ?? null,
    mainFrameAuthNavigationObserved: false,
    sessionId: evidence.sessionId,
    sessionPurpose: evidence.sessionPurpose,
    sessionExpectedRole: evidence.sessionExpectedRole,
    phase: evidence.phase,
    requestSequence: 0,
    pendingVoidMutationOwners: [],
    lastVoidMutationReconciliation: null,
    voidMutationWaiters: new Set(),
  }
  runtimeEvidenceStates.set(evidence, runtimeState)
  await page.exposeFunction(RUNTIME_CONSOLE_DIAGNOSTIC_BRIDGE, (value: unknown) => {
    const diagnostic = normalizeRuntimeConsoleDiagnostic(value)
    if (diagnostic) evidence.consoleDiagnostics.push(diagnostic)
  })
  await page.addInitScript(() => {
    const target = window as Window & {
      __debetterRecordRuntimeConsoleDiagnostic?: (value: unknown) => void
    }
    const notMountedWarning = "Can't perform a React state update on a component that hasn't mounted yet"
    const sanitizeText = (value: string) => value
      .replace(/https?:\/\/(?:localhost|127\.0\.0\.1|\[?::1\])(?::\d+)?/gi, "")
      .replace(/https?:\/\/[^\s)]+/gi, "[redacted-url]")
      .replace(/((?:password|token|secret|authorization|cookie|username|email)\s*[=:]\s*)[^\s,&}]+/gi, "$1[redacted]")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
      .slice(0, 8_192)
    const argumentType = (value: unknown) => {
      if (value === null) return "null"
      if (Array.isArray(value)) return "array"
      return typeof value
    }
    const argumentTemplate = (value: unknown) => {
      if (typeof value === "string") return sanitizeText(value)
      if (value === null) return "null"
      if (Array.isArray(value)) return "[array]"
      return `[${typeof value}]`
    }
    const isNotMountedWarning = (value: unknown) => typeof value === "string" && value.includes(notMountedWarning)
    const location = window.location.pathname.replace(/\/(?:profile|users?)\/[^/]+/gi, "/[redacted]")

    for (const level of ["error", "warn"] as const) {
      const original = console[level]
      console[level] = (...args: unknown[]) => {
        if (args.some(isNotMountedWarning)) {
          try {
            target.__debetterRecordRuntimeConsoleDiagnostic?.({
              level,
              argumentTypes: args.map(argumentType),
              argumentTemplates: args.map(argumentTemplate),
              stack: sanitizeText(new Error().stack ?? ""),
              location,
            })
          } catch {
            // Diagnostic capture must never change console behavior.
          }
        }
        Reflect.apply(original, console, args)
      }
    }
  })
  page.on("console", (message) => {
    if (message.type() !== "error") return
    if (/ERR_BLOCKED_BY_CLIENT/i.test(message.text())) {
      evidence.blockedRequests.push(`console: ${message.text()}`)
      return
    }
    if (/server responded with a status of (401|403)/i.test(message.text()) && evidence.expectedAuthProbeResponses.length > 0) {
      evidence.expectedAuthProbeConsoleWarnings.push(message.text())
      return
    }
    evidence.consoleErrors.push(message.text())
  })
  page.on("request", (request) => {
    const sequence = ++runtimeState.requestSequence
    const requestURL = new URL(request.url())
    const isLocalRequest = isLocalURL(request.url())
    const rawMode = requestURL.searchParams.get("mode")
    const rawRsc = requestURL.searchParams.get("_rsc")
    const sanitizedURL = requestURL.pathname === "/auth" ? sanitizeNextLinkURL(request.url()) : {
      url: safePath(request.url()),
      path: requestURL.pathname,
      query: {
        mode: rawMode === "login" || rawMode === "register" ? rawMode : rawMode === null ? null : "[other]",
        rscPresent: rawRsc !== null && rawRsc.length > 0,
      },
    }
    const requestEvidence: NextLinkPrefetchRequestEvidence = {
      correlationId: `runtime-request-${runtimeInstanceId}-${++nextLinkCorrelationId}`,
      sequence,
      phaseAtRequest: runtimeState.phase,
      url: sanitizedURL.url,
      path: sanitizedURL.path,
      query: sanitizedURL.query,
      method: request.method(),
      resourceType: request.resourceType(),
      isLocalRequest,
      isNavigationRequest: request.isNavigationRequest(),
      sessionId: runtimeState.sessionId,
      sessionPurpose: runtimeState.sessionPurpose,
      sessionExpectedRole: runtimeState.sessionExpectedRole,
      headers: {
        rsc: readSelectedPrefetchHeader(request.headers(), "rsc"),
        nextRouterPrefetch: readSelectedPrefetchHeader(request.headers(), "next-router-prefetch"),
        nextRouterSegmentPrefetch: readSelectedPrefetchHeader(request.headers(), "next-router-segment-prefetch"),
      },
      pagePathAtRequest: pagePathFromURL(page.url()),
      pagePathAtFailure: null,
      expectedTournamentPathAtRequest: runtimeState.expectedTournamentPath,
      expectedTournamentPathAtFailure: null,
      mainFrameAuthNavigationObserved: runtimeState.mainFrameAuthNavigationObserved,
      responseObserved: false,
      responseStatus: null,
      failure: null,
      classification: "pending",
      voidMutationCorrelationId: null,
      voidMutationOwner: null,
      voidMutationTerminalOutcome: null,
    }
    evidence.requestEvidence.push(requestEvidence)
    nextLinkRequestByRequest.set(request, requestEvidence)
    if (request.isNavigationRequest() && requestURL.pathname === "/auth") {
      runtimeState.mainFrameAuthNavigationObserved = true
      evidence.unexpectedAuthNavigations.push({ path: safePath(request.url()), pagePathAtRequest: requestEvidence.pagePathAtRequest })
    }
    if (isLocalRequest && isAllowedVoidMutationRequest(request.url(), request.method())) {
      const voidMutationCorrelationId = `void-mutation-${runtimeInstanceId}-${++nextCorrelationId}`
      requestEvidence.voidMutationCorrelationId = voidMutationCorrelationId
      const owner = runtimeState.pendingVoidMutationOwners.shift() ?? null
      requestEvidence.voidMutationOwner = owner
      requestEvidence.voidMutationTerminalOutcome = "pending"
    }
  })
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText
    const responseStatus = responseStatusByRequest.get(request)
    const requestEvidence = nextLinkRequestByRequest.get(request)
    const detail = requestEvidence
      ? requestFailureDetail(requestEvidence)
      : `${request.method()} ${safePath(request.url())}: ${failure ?? "failed"}`
    if (requestEvidence) {
      requestEvidence.failure = failure ?? null
      requestEvidence.pagePathAtFailure = pagePathFromURL(page.url())
      requestEvidence.expectedTournamentPathAtFailure = runtimeState.expectedTournamentPath
      requestEvidence.mainFrameAuthNavigationObserved = runtimeState.mainFrameAuthNavigationObserved
      requestEvidence.responseObserved = responseStatus !== undefined
      requestEvidence.responseStatus = responseStatus ?? null
    }
    if (requestEvidence && requestEvidence.voidMutationCorrelationId !== null) {
      const acceptedAbort = isExpectedVoidMutationEvidence({
        ...requestEvidence,
        failure: failure ?? null,
        voidMutationTerminalOutcome: "accepted-abort",
      })
      requestEvidence.voidMutationTerminalOutcome = acceptedAbort
        ? "accepted-abort"
        : "unexpected-failure"
      requestEvidence.classification = requestEvidence.voidMutationTerminalOutcome === "accepted-abort"
        ? "expected-void-mutation-abort"
        : "unexpected-request-failure"
    } else if (requestEvidence && isExpectedNextLinkPrefetchAbort(requestEvidence)) {
      requestEvidence.classification = "expected-next-link-prefetch-abort"
    } else if (!isLocalURL(request.url())) {
      if (requestEvidence) requestEvidence.classification = "blocked-request"
      evidence.blockedRequests.push(detail)
    } else if (requestEvidence?.path === "/api/users/me") {
      if (requestEvidence) requestEvidence.classification = "unexpected-request-failure"
      appendExpectedAuthProbeFailureDetail(evidence, requestEvidence ?? {
        correlationId: "unknown",
        url: safePath(request.url()),
        path: "/api/users/me",
        query: { mode: null, rscPresent: false },
        method: request.method(),
        resourceType: request.resourceType(),
        isLocalRequest: true,
        isNavigationRequest: request.isNavigationRequest(),
        sessionId: runtimeState.sessionId,
        sessionPurpose: runtimeState.sessionPurpose,
        sessionExpectedRole: runtimeState.sessionExpectedRole,
        headers: { rsc: null, nextRouterPrefetch: null, nextRouterSegmentPrefetch: null },
        pagePathAtRequest: pagePathFromURL(page.url()),
        pagePathAtFailure: pagePathFromURL(page.url()),
        expectedTournamentPathAtRequest: runtimeState.expectedTournamentPath,
        expectedTournamentPathAtFailure: runtimeState.expectedTournamentPath,
        mainFrameAuthNavigationObserved: runtimeState.mainFrameAuthNavigationObserved,
        responseObserved: responseStatus !== undefined,
        responseStatus: responseStatus ?? null,
        failure: failure ?? null,
        classification: "unexpected-request-failure",
        voidMutationCorrelationId: null,
        voidMutationOwner: null,
        voidMutationTerminalOutcome: null,
      })
    } else {
      if (requestEvidence) requestEvidence.classification = "unexpected-request-failure"
      evidence.requestFailures.push(detail)
    }
    reconcileRuntimeEvidence(evidence)
    notifyVoidMutationTerminalWaiters(runtimeState)
  })
  page.on("requestfinished", (request) => {
    const requestEvidence = nextLinkRequestByRequest.get(request)
    if (!requestEvidence) return
    const responseStatus = responseStatusByRequest.get(request)
    if (responseStatus !== undefined && !requestEvidence.responseObserved) {
      requestEvidence.responseObserved = true
      requestEvidence.responseStatus = responseStatus
    }
    if (requestEvidence.voidMutationCorrelationId !== null) {
      requestEvidence.voidMutationTerminalOutcome = requestEvidence.failure === null && requestEvidence.responseObserved && requestEvidence.responseStatus === 200
        ? "normal"
        : "unexpected-failure"
      if (requestEvidence.voidMutationTerminalOutcome === "unexpected-failure") requestEvidence.classification = "unexpected-request-failure"
    } else if (requestEvidence.failure === null && requestEvidence.classification === "pending") {
      requestEvidence.classification = "response"
    }
    reconcileRuntimeEvidence(evidence)
    notifyVoidMutationTerminalWaiters(runtimeState)
  })
  page.on("response", (response) => {
    responseStatusByRequest.set(response.request(), response.status())
    const requestEvidence = nextLinkRequestByRequest.get(response.request())
    if (requestEvidence) {
      requestEvidence.responseObserved = true
      requestEvidence.responseStatus = response.status()
      if (requestEvidence.classification === "pending") requestEvidence.classification = "response"
    }
    if (response.request().resourceType() === "script" && isLocalNextScriptURL(response.url())) {
      evidence.localNextScriptResponses.push({ status: response.status(), path: safePath(response.url()) })
    }
    if (response.status() < 400) return
    const error = { status: response.status(), path: safePath(response.url()) }
    if (requestEvidence && isExpectedAuthProbeResponseEvidence(requestEvidence)) evidence.expectedAuthProbeResponses.push(error)
    else evidence.httpErrors.push(error)
  })
  return evidence
}

function validateRuntimeContextCloseCancellationEvidence(evidence: RuntimeEvidence) {
  const boundary = evidence.closeBoundarySequence
  const classifiedEntries = evidence.requestEvidence.filter((entry) => entry.classification === "context-close-cancelled")
  const cancellationIds = evidence.contextCloseCancellations.map((entry) => entry.correlationId)
  const classifiedIds = classifiedEntries.map((entry) => entry.correlationId)
  const duplicateCancellationIds = uniqueSorted(cancellationIds.filter((id, index) => cancellationIds.indexOf(id) !== index))
  const missingCancellationIds = uniqueSorted(classifiedIds.filter((id) => !cancellationIds.includes(id)))
  const orphanCancellationIds = uniqueSorted(cancellationIds.filter((id) => !classifiedIds.includes(id)))
  const invalidClassifiedIds = uniqueSorted(classifiedEntries
    .filter((entry) => {
      if (evidence.phase !== "closed" || boundary === null || !isExpectedContextCloseCancellation(entry, boundary)) return true
      const persisted = evidence.contextCloseCancellations.find((candidate) => candidate.correlationId === entry.correlationId)
      if (!persisted || !isContextCloseCancellationEvidence(persisted)) return true
      const expected = asContextCloseCancellationEvidence({ ...entry, classification: "pending" }, boundary)
      return stableJSONString(persisted) !== stableJSONString(expected)
    })
    .map((entry) => entry.correlationId))
  const invalidCancellationIds = uniqueSorted(evidence.contextCloseCancellations
    .filter((entry) => {
      if (evidence.phase !== "closed" || boundary === null || !isContextCloseCancellationEvidence(entry)) return true
      const request = evidence.requestEvidence.find((candidate) => candidate.correlationId === entry.correlationId)
      if (!request || request.classification !== "context-close-cancelled" || !isExpectedContextCloseCancellation(request, boundary)) return true
      const expected = asContextCloseCancellationEvidence({ ...request, classification: "pending" }, boundary)
      return stableJSONString(entry) !== stableJSONString(expected)
    })
    .map((entry) => entry.correlationId))
  return [
    ...duplicateCancellationIds.map((id) => `duplicate context-close cancellation correlation ${id}`),
    ...missingCancellationIds.map((id) => `classified context-close cancellation has no runtime evidence ${id}`),
    ...orphanCancellationIds.map((id) => `runtime context-close evidence has no classified request ${id}`),
    ...invalidClassifiedIds.map((id) => `invalid classified context-close cancellation ${id}`),
    ...invalidCancellationIds.map((id) => `invalid context-close cancellation evidence ${id}`),
  ]
}

export function assertRuntimeEvidenceIsClean(evidence: RuntimeEvidence) {
  reconcileContextCloseCancellations(evidence)
  const recordedExpectedNextLinkPrefetchAborts = evidence.expectedNextLinkPrefetchAborts
  const invalidRecordedExpectedNextLinkPrefetchAbortCorrelationIds = recordedExpectedNextLinkPrefetchAborts
    .filter((entry) => !isExpectedNextLinkPrefetchAbort(entry))
    .map((entry) => entry.correlationId)
  reconcileRuntimeEvidence(evidence)
  const sanitized = sanitizeRuntimeEvidence(evidence, [])
  const contextCloseCancellationErrors = validateRuntimeContextCloseCancellationEvidence(sanitized)
  const requestCorrelationIds = sanitized.requestEvidence.map((entry) => entry.correlationId)
  const duplicateRequestCorrelationIds = [...new Set(requestCorrelationIds.filter((id, index) => requestCorrelationIds.indexOf(id) !== index))]
  const invalidClassifiedNextLinkPrefetchCorrelationIds = sanitized.requestEvidence
    .filter((entry) => entry.classification === "expected-next-link-prefetch-abort" && !isExpectedNextLinkPrefetchAbort(entry))
    .map((entry) => entry.correlationId)
  const invalidRequestTerminalStateCorrelationIds = sanitized.requestEvidence
    .filter((entry) =>
      (entry.responseObserved && entry.responseStatus === null) ||
      (!entry.responseObserved && entry.responseStatus !== null) ||
      (entry.failure === null && !entry.responseObserved && entry.responseStatus === null && entry.classification !== "context-close-cancelled"),
    )
    .map((entry) => entry.correlationId)
  const unsettledRequestCorrelationIds = sanitized.requestEvidence
    .filter((entry) => entry.classification === "pending" || invalidRequestTerminalStateCorrelationIds.includes(entry.correlationId))
    .map((entry) => entry.correlationId)
  const unexpectedRequestCorrelationIds = sanitized.requestEvidence
    .filter((entry) => entry.classification === "unexpected-request-failure")
    .map((entry) => entry.correlationId)
  const voidMutationValidation = validateVoidMutationTerminalEvidence(sanitized)
  const errors = {
    consoleErrors: sanitized.consoleErrors,
    requestFailures: sanitized.requestFailures,
    httpErrors: sanitized.httpErrors,
    expectedAuthProbeFailures: sanitized.expectedAuthProbeFailures,
    unexpectedAuthNavigations: sanitized.unexpectedAuthNavigations,
    blockedRequests: sanitized.blockedRequests,
    invalidRecordedExpectedNextLinkPrefetchAbortCorrelationIds,
    invalidClassifiedNextLinkPrefetchCorrelationIds,
    invalidRequestTerminalStateCorrelationIds,
    duplicateRequestCorrelationIds,
    unsettledRequestCorrelationIds,
    unexpectedRequestCorrelationIds,
    voidMutationValidation: voidMutationValidation.errors,
    contextCloseCancellationErrors,
  }
  const nonEmpty = Object.fromEntries(Object.entries(errors).filter(([, values]) => values.length > 0))
  if (Object.keys(nonEmpty).length > 0) {
    throw new Error(`Runtime evidence errors: ${JSON.stringify(nonEmpty)}`)
  }
}

export function assertExpectedAuthProbeClassifierSelfChecks(): AuthProbeClassifierSelfCheckReport {
  const cases: Array<{ name: string; expectedClean: boolean; overrides?: NextLinkPrefetchClassifierOverrides }> = [
    { name: "anonymous 401 response abort", expectedClean: true, overrides: { responseStatus: 401 } },
    { name: "anonymous 403 response abort", expectedClean: true, overrides: { responseStatus: 403 } },
    { name: "anonymous no response", expectedClean: false, overrides: { responseObserved: false, responseStatus: null } },
    { name: "anonymous 500 response", expectedClean: false, overrides: { responseStatus: 500 } },
    { name: "anonymous POST", expectedClean: false, overrides: { method: "POST" } },
    { name: "anonymous navigation", expectedClean: false, overrides: { isNavigationRequest: true } },
    { name: "authenticated wrong session", expectedClean: false, overrides: { sessionPurpose: "ui-tournament", sessionExpectedRole: Role.ORGANIZER } },
    { name: "anonymous wrong expected path", expectedClean: false, overrides: { expectedTournamentPathAtRequest: "/tournament/9103", expectedTournamentPathAtFailure: "/tournament/9103" } },
  ]
  const runtimeFor = (request: NextLinkPrefetchRequestEvidence): RuntimeEvidence => {
    const detail = requestFailureDetail(request)
    return {
      sessionId: request.sessionId,
      sessionPurpose: request.sessionPurpose,
      sessionExpectedRole: request.sessionExpectedRole,
      phase: "closed",
      closeBoundarySequence: 0,
      consoleErrors: [],
      consoleDiagnostics: [],
      requestFailures: request.failure === null ? [] : [detail],
      httpErrors: request.responseStatus === 500 ? [{ status: 500, path: request.path }] : [],
      localNextScriptResponses: [],
      expectedVoidMutationAborts: [],
      expectedNextLinkPrefetchAborts: [],
      contextCloseCancellations: [],
      requestEvidence: [request],
      unexpectedAuthNavigations: [],
      expectedAuthProbeResponses: [],
      expectedAuthProbeConsoleWarnings: [],
      expectedAuthProbeFailures: request.path === "/api/users/me" && request.failure !== null ? [detail] : [],
      blockedRequests: [],
    }
  }
  for (const entry of cases) {
    const request = makeAuthProbeClassifierFixture(entry.overrides)
    const actualClean = isExpectedAuthProbeFailureEvidence(request)
    if (actualClean !== entry.expectedClean) throw new Error(`Auth probe classifier self-check failed for ${entry.name}.`)
    const runtime = runtimeFor(request)
    reconcileRuntimeEvidence(runtime)
    let clean = true
    try {
      assertRuntimeEvidenceIsClean(runtime)
    } catch {
      clean = false
    }
    if (clean !== entry.expectedClean) throw new Error(`Auth probe reconciliation self-check failed for ${entry.name}.`)
  }
  return {
    passed: true,
    cleanCaseCount: cases.filter((entry) => entry.expectedClean).length,
    fatalCaseCount: cases.filter((entry) => !entry.expectedClean).length,
    caseNames: cases.map((entry) => entry.name),
  }
}

export const expectedAuthProbeClassifierSelfCheckReport = assertExpectedAuthProbeClassifierSelfChecks()

export async function activateTab(page: Page, tabName: string, previousTabName: string, settledLocator: Locator) {
  const tab = page.getByRole("tab", { name: tabName, exact: true })
  const previousTab = page.getByRole("tab", { name: previousTabName, exact: true })
  const hydratedTablist = page.locator('[data-tournament-tabs-hydrated="true"]')
  const diagnostic = async (suffix: string) => {
    const directory = path.join(EVIDENCE_ROOT, "tab-diagnostics")
    const diagnosticPath = path.join(directory, `tab-${safeFilePart(tabName)}-${Date.now()}-${suffix}.png`)
    await mkdir(directory, { recursive: true })
    try {
      await page.screenshot({ path: diagnosticPath, fullPage: true, timeout: TAB_ACTIVATION_RELOAD_TIMEOUT_MS })
      return diagnosticPath
    } catch (error) {
      return `${diagnosticPath} unavailable: ${error instanceof Error ? error.message : String(error)}`
    }
  }
  const attempt = async () => {
    await Promise.all([
      expect(hydratedTablist).toBeVisible({ timeout: TAB_HYDRATION_TIMEOUT_MS }),
      expect(page.getByRole("tablist")).toBeVisible({ timeout: TAB_HYDRATION_TIMEOUT_MS }),
      expect(tab).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS }),
    ])
    if (await tab.getAttribute("aria-selected", { timeout: TAB_ACTIVATION_TIMEOUT_MS }) !== "true") {
      await tab.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
    }
    await Promise.all([
      expect(tab).toHaveAttribute("aria-selected", "true", { timeout: TAB_ACTIVATION_TIMEOUT_MS }),
      expect(previousTab).toHaveAttribute("aria-selected", "false", { timeout: TAB_ACTIVATION_TIMEOUT_MS }),
      expect(settledLocator).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS }),
    ])
  }

  try {
    await attempt()
  } catch (firstError) {
    const firstDiagnosticPath = await diagnostic("first")
    try {
      await page.reload({ waitUntil: "domcontentloaded", timeout: TAB_ACTIVATION_RELOAD_TIMEOUT_MS })
    } catch (reloadError) {
      throw new Error(`Tab ${tabName} hydration retry could not start. First diagnostic: ${firstDiagnosticPath}. First error: ${firstError instanceof Error ? firstError.message : String(firstError)}. Reload error: ${reloadError instanceof Error ? reloadError.message : String(reloadError)}`)
    }
    try {
      await attempt()
    } catch (secondError) {
      const secondDiagnosticPath = await diagnostic("retry")
      let bodyText = "<unavailable>"
      try {
        bodyText = (await page.locator("body").innerText({ timeout: TAB_ACTIVATION_RELOAD_TIMEOUT_MS })).slice(0, 1_200)
      } catch (bodyError) {
        bodyText = `<unavailable: ${bodyError instanceof Error ? bodyError.message : String(bodyError)}>`
      }
      throw new Error(`Tab ${tabName} did not activate after one hydration retry. First diagnostic: ${firstDiagnosticPath}. Retry diagnostic: ${secondDiagnosticPath}. URL: ${page.url()}. Body: ${bodyText}. First error: ${firstError instanceof Error ? firstError.message : String(firstError)}. Retry error: ${secondError instanceof Error ? secondError.message : String(secondError)}`)
    }
  }
}

export async function guardLocalRequests(page: Page) {
  await page.route("**/*", async (route) => {
    const requestURL = route.request().url()
    if (/^https?:/i.test(requestURL) && !isLocalURL(requestURL)) {
      await route.abort("blockedbyclient")
      return
    }
    await route.continue()
  })
}

export async function readMutationResponse(
  response: APIResponse | PageResponse,
  fallback: { method: string; requestBody?: string | null } = { method: "GET" },
): Promise<MutationResponse> {
  const responseWithRequest = response as unknown as {
    request?: () => { method: () => string; postData: () => string | null }
  }
  const request = responseWithRequest.request?.()
  const requestMethod = request?.method() ?? fallback.method
  let responseBody: string
  try {
    responseBody = await response.text()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const emptyBodyMessage = "Network.getResponseBody: No data found for resource with given identifier"
    const protocolEmptyBodyMessage = "Protocol error (Network.getResponseBody): No data found for resource with given identifier"
    const exactEmptyBodyErrors = new Set([
      emptyBodyMessage,
      protocolEmptyBodyMessage,
      `response.text: ${protocolEmptyBodyMessage}`,
    ])
    const isPageResponse = typeof (response as PageResponse).frame === "function"
    const isAllowedEmptyBody = isPageResponse && requestMethod === "PATCH" && response.status() === 200 && isVoidMutationPath(response.url()) && exactEmptyBodyErrors.has(errorMessage)
    if (!isAllowedEmptyBody) throw error
    responseBody = ""
  }
  return {
    url: safePath(response.url()),
    method: requestMethod,
    status: response.status(),
    ok: response.ok(),
    requestBody: request?.postData() ?? fallback.requestBody ?? null,
    responseBody,
  }
}

const apiURL = (config: IntegrityConfig, endpoint: string) => `${normalizeURL(config.apiBaseURL)}${endpoint}`
const frontendAPIURL = (config: IntegrityConfig, endpoint: string) => `${normalizeURL(config.frontendBaseURL)}${endpoint}`
const AUTH_LOGIN_PATH = "/api/auth/login"
const USERS_ME_PATH = "/api/users/me"
let sessionCounter = 0

const emptyNavigationEvidence = (): SessionNavigationEvidence => ({
  expectedPath: null,
  status: null,
  finalPath: null,
  noAuthRedirect: null,
  browserUsersMeStatus: null,
})

const anonymousAuthEvidence = (sessionId: string): SessionAuthEvidence => ({
  sessionId,
  purpose: "anonymous-ui",
  authPost: null,
  authGet: null,
  usernamePresent: false,
  passwordPresent: false,
  expectedRole: null,
  verifiedRole: null,
  verifiedUsernameHash: null,
  verifiedUserId: null,
  navigation: emptyNavigationEvidence(),
  navigationHistory: [],
})

const nextSessionId = () => `session-${process.pid}-${++sessionCounter}-${randomBytes(4).toString("hex")}`

async function authenticateContext(
  context: BrowserContext,
  config: IntegrityConfig,
  username: string,
  password: string,
  expectedRole: Role,
  purpose: "ui-tournament" | "api-only",
): Promise<SessionAuthEvidence> {
  const sessionId = nextSessionId()
  const loginResponse = await context.request.post(frontendAPIURL(config, AUTH_LOGIN_PATH), {
    data: { username, password, rememberMe: false },
    failOnStatusCode: false,
    timeout: RESPONSE_TIMEOUT_MS,
  })
  const authPost = { method: "POST" as const, path: AUTH_LOGIN_PATH as "/api/auth/login", status: loginResponse.status() }
  expect(authPost.status, `${purpose} auth POST must return 200`).toBe(200)

  const usersMeResponse = await context.request.get(frontendAPIURL(config, USERS_ME_PATH), {
    failOnStatusCode: false,
    timeout: RESPONSE_TIMEOUT_MS,
  })
  const authGet = { method: "GET" as const, path: USERS_ME_PATH as "/api/users/me", status: usersMeResponse.status() }
  expect(authGet.status, `${purpose} auth GET must return 200`).toBe(200)

  let identity: Record<string, unknown>
  try {
    const body: unknown = await usersMeResponse.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("identity response was not an object")
    identity = body as Record<string, unknown>
  } catch {
    throw new Error(`${purpose} auth GET returned an unreadable identity response.`)
  }
  const verifiedRole = typeof identity.role === "string" ? identity.role : null
  expect(verifiedRole, `${purpose} auth GET role`).toBe(expectedRole)
  if (typeof identity.username !== "string" || identity.username !== username) {
    throw new Error(`${purpose} auth GET username did not match the submitted identity.`)
  }
  const verifiedUsernameHash = hashValue(identity.username)
  const verifiedUserId = typeof identity.id === "number" ? identity.id : null

  return {
    sessionId,
    purpose,
    authPost,
    authGet,
    usernamePresent: username.length > 0,
    passwordPresent: password.length > 0,
    expectedRole,
    verifiedRole,
    verifiedUsernameHash,
    verifiedUserId,
    navigation: emptyNavigationEvidence(),
    navigationHistory: [],
  }
}

async function createPageSession(
  context: BrowserContext,
  authEvidence: SessionAuthEvidence,
  expectedTournamentPath: string | null = null,
): Promise<IntegritySession> {
  const page = await context.newPage()
  const runtime = await attachRuntimeEvidence(page, {
    sessionId: authEvidence.sessionId,
    purpose: authEvidence.purpose,
    expectedRole: authEvidence.expectedRole,
    expectedTournamentPath,
  })
  await guardLocalRequests(page)
  return { sessionId: authEvidence.sessionId, context, page, runtime, authEvidence }
}

export async function openOrganizerSession(
  browser: Browser,
  config: IntegrityConfig,
  purpose: "ui-tournament" | "api-only",
  expectedTournamentPath: string | null = null,
) {
  const context = await browser.newContext({ baseURL: config.frontendBaseURL })
  try {
    const authEvidence = await authenticateContext(context, config, config.organizerUsername, config.organizerPassword, Role.ORGANIZER, purpose)
    return await createPageSession(context, authEvidence, expectedTournamentPath)
  } catch (error) {
    await context.close()
    throw error
  }
}

export async function openDebaterSession(browser: Browser, config: IntegrityConfig, expectedTournamentPath: string | null = null) {
  const context = await browser.newContext({ baseURL: config.frontendBaseURL })
  try {
    const authEvidence = await authenticateContext(context, config, config.debaterUsername, config.debaterPassword, Role.PARTICIPANT, "ui-tournament")
    return await createPageSession(context, authEvidence, expectedTournamentPath)
  } catch (error) {
    await context.close()
    throw error
  }
}

export async function openAnonymousSession(browser: Browser, config: IntegrityConfig, expectedTournamentPath: string | null = null) {
  const context = await browser.newContext({ baseURL: config.frontendBaseURL })
  return createPageSession(context, anonymousAuthEvidence(nextSessionId()), expectedTournamentPath)
}

export async function getJSON<T>(request: APIRequestContext, config: IntegrityConfig, endpoint: string): Promise<T> {
  const response = await request.get(apiURL(config, endpoint), { failOnStatusCode: false })
  const body = await response.text()
  if (!response.ok()) throw new Error(`GET ${endpoint} returned ${response.status()}: ${body}`)
  return JSON.parse(body) as T
}

const pageContent = <T>(value: PageResult<T> | T[]) => Array.isArray(value) ? value : value.content

const toNumberOrNull = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null

const teamMembersById = (teams: SimpleTeamResponse[]) => new Map(teams.map((team) => [team.id, team]))

function summarizeMatch(match: MatchResponse, teams: Map<number, SimpleTeamResponse>): IntegrityMatch {
  const teamSlots = (["team1", "team2", "team3", "team4"] as const).flatMap((slot) => {
    const team = match[slot]
    if (!team) return []
    const members = getTeamMembers(team, teams)
    const score = toNumberOrNull((match as unknown as Record<string, unknown>)[`${slot}Score`])
    const won = resolveTeamCurrentWon(match, slot, team.id)
    return [{
      slot,
      id: team.id,
      name: team.name,
      speakers: members.map((member, index) => ({
        id: member.id,
        name: getParticipantName(member, `Speaker ${index + 1}`),
        score: toNumberOrNull(resolveParticipantCurrentScore(match, slot, team.id, member.id, index)),
      })),
      score,
      won: typeof won === "boolean" ? won : null,
    }]
  })
  const debaters = (["debater1", "debater2"] as const).flatMap((slot) => {
    const debater = match[slot]
    if (!debater) return []
    return [{
      id: debater.id,
      name: getParticipantName(debater, `Debater ${debater.id}`),
      score: toNumberOrNull((match as unknown as Record<string, unknown>)[`${slot}Score`]),
    }]
  })
  return {
    id: match.id,
    completed: match.completed,
    winnerParticipantId: toNumberOrNull(match.winnerParticipantId),
    participantScoresComplete: typeof match.participantScoresComplete === "boolean" ? match.participantScoresComplete : null,
    participantScoresRepairable: typeof match.participantScoresRepairable === "boolean" ? match.participantScoresRepairable : null,
    teams: teamSlots,
    debaters,
    room: match.location ?? null,
    judge: match.judge?.fullName ?? null,
  }
}

export type IntegrityTeamStanding = {
  id: number
  name: string
  preliminaryScore: number | null
}

export async function collectTeamStandings(context: BrowserContext, config: IntegrityConfig, tournamentId: number) {
  const response = await getJSON<PageResult<SimpleTeamResponse & { preliminaryScore?: number | null }>>(
    context.request,
    config,
    `/tournaments/${tournamentId}/teams?page=0&size=100`,
  )
  return pageContent(response).map((team) => ({
    id: team.id,
    name: team.name,
    preliminaryScore: toNumberOrNull(team.preliminaryScore),
  })) as IntegrityTeamStanding[]
}

export async function collectTournamentInventory(context: BrowserContext, config: IntegrityConfig, tournamentId: number): Promise<IntegrityInventory> {
  const request = context.request
  const tournament = await getJSON<SimpleTournamentResponse>(request, config, `/tournaments/${tournamentId}`)
  const teamsResponse = await getJSON<PageResult<SimpleTeamResponse>>(request, config, `/tournaments/${tournamentId}/teams?page=0&size=100`)
  const teams = teamMembersById(pageContent(teamsResponse))
  const groups = await getJSON<RoundGroupResponse[]>(request, config, `/tournaments/${tournamentId}/round-groups`)
  const stages: IntegrityStageSnapshot[] = []

  for (const group of groups) {
    const stage = stageByType[group.type]
    if (!stage) throw new Error(`Unsupported round group type ${String(group.type)}`)
    const rounds = await getJSON<SimpleRoundResponse[]>(request, config, `/tournaments/${tournamentId}/round-groups/${group.id}/rounds`)
    const roundSnapshots: IntegrityRound[] = []
    for (const round of rounds) {
      const matchesResponse = await getJSON<PageResult<MatchResponse>>(
        request,
        config,
        `/tournaments/${tournamentId}/round-groups/${group.id}/rounds/${round.id}/matches?page=0&size=100`,
      )
      roundSnapshots.push({
        id: round.id,
        name: round.name,
        roundNumber: round.roundNumber,
        format: round.customFormat ?? group.format,
        matches: pageContent(matchesResponse).map((match) => summarizeMatch(match, teams)),
      })
    }
    stages.push({
      id: group.id,
      type: group.type,
      stage,
      format: group.format,
      currentRoundNumber: group.currentRoundNumber,
      rounds: roundSnapshots.sort((a, b) => a.roundNumber - b.roundNumber),
    })
  }

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      preliminaryFormat: tournament.preliminaryFormat,
      teamEliminationFormat: tournament.teamEliminationFormat,
    },
    stages,
  }
}

export async function collectRawMatch(context: BrowserContext, config: IntegrityConfig, tournamentId: number, groupId: number, roundId: number, matchId: number) {
  const page = await getJSON<PageResult<MatchResponse>>(context.request, config, `/tournaments/${tournamentId}/round-groups/${groupId}/rounds/${roundId}/matches?page=0&size=100`)
  return pageContent(page).find((match) => match.id === matchId)
}

export async function collectRawMatchEvidence(context: BrowserContext, config: IntegrityConfig, tournamentId: number, groupId: number, roundId: number, matchId: number) {
  const response = await context.request.get(
    apiURL(config, `/tournaments/${tournamentId}/round-groups/${groupId}/rounds/${roundId}/matches?page=0&size=100`),
    { failOnStatusCode: false, timeout: RESPONSE_TIMEOUT_MS },
  )
  const body = await response.text()
  expect(response.status(), `raw match ${matchId} evidence endpoint must return 200`).toBe(200)
  const page = JSON.parse(body) as PageResult<MatchResponse> | MatchResponse[]
  const value = pageContent(page).find((match) => match.id === matchId)
  return { status: response.status(), bodyHash: hashValue(body), value }
}

export async function readReadyReport(request: APIRequestContext, config: IntegrityConfig): Promise<ReadyReport> {
  const response = await request.get(config.readyURL, { failOnStatusCode: false, timeout: RESPONSE_TIMEOUT_MS })
  const body = await response.text()
  if (!response.ok()) throw new Error(`Backend ready report returned ${response.status()}.`)
  const report = JSON.parse(body) as ReadyReport
  if (report.ready !== true) throw new Error("Backend ready report did not declare ready=true.")
  const expectedToken = process.env.TOURNAMENT_INTEGRITY_CONTROL_INSTANCE_TOKEN
  if (!expectedToken || !/^[a-f0-9]{64}$/.test(expectedToken) || report.instanceToken !== expectedToken) {
    throw new Error("Control readiness did not prove the current per-run instance token.")
  }
  const expectedInstanceIdHash = createHash("sha256").update(expectedToken).digest("hex")
  if (report.instanceIdHash !== expectedInstanceIdHash) {
    throw new Error("Control readiness instance identity hash did not match the current token.")
  }
  return report
}

const fixtureReportEntry = (report: ReadyReport, fixtureId: number): Record<string, unknown> => {
  const fixtures = report.fixtures
  if (Array.isArray(fixtures)) {
    const entry = fixtures.find((candidate) => candidate && typeof candidate === "object" && Number((candidate as Record<string, unknown>).fixtureId) === fixtureId)
    return (entry ?? {}) as Record<string, unknown>
  }
  if (fixtures && typeof fixtures === "object") {
    const entry = (fixtures as Record<string, unknown>)[String(fixtureId)]
    return entry && typeof entry === "object" ? entry as Record<string, unknown> : {}
  }
  return {}
}

const firstString = (...values: unknown[]) => values.find((value): value is string => typeof value === "string" && value.length > 0)

export function resolveFixtures(config: IntegrityConfig, report: ReadyReport): IntegrityFixture[] {
  return FIXTURE_IDS.map((fixtureId) => {
    const entry = fixtureReportEntry(report, fixtureId)
    if (Number(entry.fixtureId) !== fixtureId) throw new Error(`Ready report must explicitly provide fixture ${fixtureId}.`)
    const tournamentId = Number(entry.tournamentId)
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) throw new Error(`Ready report has no tournament ID for fixture ${fixtureId}.`)
    const resetEndpoint = firstString(entry.resetURL, entry.resetUrl, entry.resetEndpoint, (entry.endpoints as Record<string, unknown> | undefined)?.reset)
    const stateEndpoint = firstString(entry.dbStateURL, entry.dbStateUrl, entry.stateURL, entry.stateUrl, entry.dbStateEndpoint, (entry.endpoints as Record<string, unknown> | undefined)?.dbState, (entry.endpoints as Record<string, unknown> | undefined)?.state)
    if (!resetEndpoint) throw new Error(`Ready report must explicitly provide a reset endpoint for fixture ${fixtureId}.`)
    if (!stateEndpoint) throw new Error(`Ready report must explicitly provide a DB-state endpoint for fixture ${fixtureId}.`)
    const resetURL = `${CONTROL_BASE_URL}/fixtures/${fixtureId}/reset`
    const stateURL = `${CONTROL_BASE_URL}/fixtures/${fixtureId}/state`
    if (resetEndpoint !== resetURL || stateEndpoint !== stateURL) throw new Error(`Ready report returned a non-canonical control endpoint for fixture ${fixtureId}.`)
    const method = String(entry.resetMethod ?? entry.resetHttpMethod ?? "").toUpperCase()
    if (!method) throw new Error(`Ready report must explicitly provide a reset method for fixture ${fixtureId}.`)
    if (method !== "POST" && method !== "PUT" && method !== "PATCH") throw new Error(`Unsupported reset method for fixture ${fixtureId}.`)
    return { fixtureId, tournamentId, resetURL, resetMethod: method, stateURL }
  })
}

export async function resetFixture(context: BrowserContext, fixture: IntegrityFixture, scenario?: string) {
  const options = { failOnStatusCode: false, ...(scenario ? { data: { scenario } } : {}) }
  const response = fixture.resetMethod === "POST"
    ? await context.request.post(fixture.resetURL, options)
    : fixture.resetMethod === "PUT"
      ? await context.request.put(fixture.resetURL, options)
      : await context.request.patch(fixture.resetURL, options)
  const result = await readMutationResponse(response, {
    method: fixture.resetMethod,
    requestBody: scenario ? JSON.stringify({ scenario }) : null,
  })
  expect(result.status, `fixture ${fixture.fixtureId} reset must return 200`).toBe(200)
  return result
}

export async function readDatabaseState(context: BrowserContext, fixture: IntegrityFixture) {
  const response = await context.request.get(fixture.stateURL, { failOnStatusCode: false, timeout: RESPONSE_TIMEOUT_MS })
  const body = await response.text()
  expect(response.status(), `fixture ${fixture.fixtureId} DB state endpoint must return 200`).toBe(200)
  return JSON.parse(body) as unknown
}

export async function submitResultsDirect(context: BrowserContext, config: IntegrityConfig, fixture: IntegrityFixture, groupId: number, roundId: number, payload: MatchResultRequest[]) {
  const response = await context.request.patch(
    apiURL(config, `/tournaments/${fixture.tournamentId}/round-groups/${groupId}/rounds/${roundId}/matches/results`),
    { data: payload, failOnStatusCode: false },
  )
  return readMutationResponse(response, { method: "PATCH", requestBody: JSON.stringify(payload) })
}

export async function proceedDirect(context: BrowserContext, config: IntegrityConfig, fixture: IntegrityFixture, groupId: number) {
  const response = await context.request.patch(
    apiURL(config, `/tournaments/${fixture.tournamentId}/round-groups/${groupId}/proceed`),
    { failOnStatusCode: false },
  )
  return readMutationResponse(response, { method: "PATCH", requestBody: null })
}

export function findStage(inventory: IntegrityInventory, stage: IntegrityStage) {
  const value = inventory.stages.find((candidate) => candidate.stage === stage)
  if (!value) throw new Error(`Fixture ${inventory.tournament.id} has no ${stage} stage.`)
  return value
}

export function findRound(stage: IntegrityStageSnapshot, roundNumber: number) {
  const value = stage.rounds.find((round) => round.roundNumber === roundNumber)
  if (!value) throw new Error(`${stage.stage} has no round ${roundNumber}.`)
  return value
}

export function buildValidExpectedPoints(match: IntegrityMatch, seed = 0) {
  const values = new Map<number, number>()
  let index = 0
  const base = 60 + seed * 10
  for (const team of match.teams) {
    for (const speaker of team.speakers) values.set(speaker.id, base + index++)
  }
  for (const debater of match.debaters) values.set(debater.id, base + index++)
  return values
}

export function buildValidResult(
  match: IntegrityMatch,
  format: DebateFormat,
  seed = 0,
  stage: IntegrityStage = "preliminary",
): MatchResultRequest {
  const expectedPoints = buildValidExpectedPoints(match, seed)
  if (match.teams.length) {
    const winnerCount = format === "BPF" || match.teams.length >= 4 ? 2 : 1
    const teamResults = match.teams.map((team, index) => ({
      teamId: team.id,
      won: index < winnerCount,
      ...(stage === "preliminary"
        ? { participantScores: team.speakers.map((speaker) => ({ participantId: speaker.id, score: expectedPoints.get(speaker.id) ?? 70 })) }
        : {}),
    }))
    return { matchId: match.id, teamResults }
  }
  if (stage === "solo") {
    const winner = match.debaters[0]
    if (!winner) throw new Error(`Match ${match.id} has no debater to select as winner.`)
    return { matchId: match.id, winnerParticipantId: winner.id }
  }
  return {
    matchId: match.id,
    participantScores: match.debaters.map((debater) => ({ participantId: debater.id, score: expectedPoints.get(debater.id) ?? 70 })),
  }
}

export function buildContradictoryResult(match: IntegrityMatch, format: DebateFormat = DebateFormat.APF): MatchResultRequest {
  const scoreByParticipant = buildValidExpectedPoints(match, 1)
  if (match.teams.length) {
    return {
      matchId: match.id,
      teamResults: match.teams.map((team) => ({
        teamId: team.id,
        won: true,
        participantScores: team.speakers.map((speaker) => ({ participantId: speaker.id, score: scoreByParticipant.get(speaker.id) ?? 70 })),
      })),
    }
  }
  return {
    matchId: match.id,
    participantScores: match.debaters.map((debater) => ({ participantId: debater.id, score: scoreByParticipant.get(debater.id) ?? (format === "LD" ? 70 : 70) })),
  }
}

export function buildRepairExpectedPoints(match: IntegrityMatch) {
  const values = new Map<number, number>()
  for (const team of match.teams) {
    if (team.speakers.length === 0 || team.score === null) continue
    const base = Math.floor(team.score / team.speakers.length)
    let remainder = team.score - base * team.speakers.length
    team.speakers.forEach((speaker) => {
      values.set(speaker.id, base + (remainder > 0 ? 1 : 0))
      remainder -= 1
    })
  }
  return values
}

export async function fillValidMatch(
  page: Page,
  match: IntegrityMatch,
  format: DebateFormat,
  seed = 0,
  stage: IntegrityStage = "preliminary",
) {
  const expectedPoints = buildValidExpectedPoints(match, seed)
  if (match.teams.length) {
    const winnerCount = format === "BPF" || match.teams.length >= 4 ? 2 : 1
    for (const [index, team] of match.teams.entries()) {
      const result = index < winnerCount ? "winner" : "not winner"
      await page.getByRole("button", { name: `Mark ${team.name} as ${result} in match ${match.id}`, exact: true }).click()
    }
    if (stage === "preliminary") {
      for (const team of match.teams) {
        for (const speaker of team.speakers) {
          await page.getByLabel(`Speaker points for ${speaker.name} in match ${match.id}`, { exact: true }).fill(String(expectedPoints.get(speaker.id) ?? 70))
        }
      }
    }
  } else if (stage === "solo") {
    const winner = match.debaters[0]
    if (!winner) throw new Error(`Match ${match.id} has no debater to select as winner.`)
    await page.getByRole("button", { name: `Mark ${winner.name} as winner in match ${match.id}`, exact: true }).click()
  } else {
    for (const debater of match.debaters) {
      await page.getByLabel(`Speaker points for ${debater.name} in match ${match.id}`, { exact: true }).fill(String(expectedPoints.get(debater.id) ?? 70))
    }
  }
  return stage === "preliminary" ? expectedPoints : new Map<number, number>()
}

export async function fillRepairableMatch(page: Page, match: IntegrityMatch) {
  const expectedPoints = buildRepairExpectedPoints(match)
  for (const team of match.teams) {
    const result = team.won === true ? "winner" : "not winner"
    await page.getByRole("button", { name: `Mark ${team.name} as ${result} in match ${match.id}`, exact: true }).click()
    for (const speaker of team.speakers) {
      const score = expectedPoints.get(speaker.id)
      if (typeof score !== "number") throw new Error(`No repair score for participant ${speaker.id}.`)
      await page.getByLabel(`Speaker points for ${speaker.name} in match ${match.id}`, { exact: true }).fill(String(score))
    }
  }
  return expectedPoints
}

const ELIMINATION_RESULTS_ROUND_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  "1/16": "1/16",
  "1/8": "1/8",
  "1/4": "1/4",
  "1/2": "1/2",
  Semifinal: "1/2",
  Quarterfinal: "1/4",
  Octofinal: "1/8",
  "Double Octofinal": "1/16",
  "Round of 32": "1/16",
  Final: "Final",
  "Grand Final": "Final",
})

const PAIRING_STAGE_LABELS: Readonly<Record<IntegrityStage, string>> = Object.freeze({
  preliminary: "Preliminary",
  team: "Team elimination",
  solo: "Solo elimination",
})
const CANONICAL_PAIRING_STAGES: readonly IntegrityStage[] = ["preliminary", "team", "solo"]
export type PairingStageExpectation = Pick<IntegrityStageSnapshot, "stage" | "format">

const eliminationResultsRoundLabel = (backendRoundName: string) => {
  const normalizedRoundName = backendRoundName.replace(/\.0$/, "")
  const alias = ELIMINATION_RESULTS_ROUND_ALIASES[normalizedRoundName]
  if (!alias) throw new Error(`Unsupported elimination results round label: ${backendRoundName}`)
  return alias
}

export async function selectResultsRound(page: Page, stage: IntegrityStage, format: DebateFormat, round: IntegrityRound) {
  const expectedRoundLabel = stage === "preliminary"
    ? `Round ${round.roundNumber}`
    : eliminationResultsRoundLabel(round.name)
  const resultsTab = page.getByRole("tab", { name: "Results and Statistics", exact: true })
  await activateTab(page, "Results and Statistics", "Pairing and Matches", page.getByRole("heading", { name: /^(APF|BPF|LD)$/, exact: true }).first())
  if (await resultsTab.getAttribute("aria-expanded", { timeout: TAB_ACTIVATION_TIMEOUT_MS }) !== "true") {
    await resultsTab.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
    await expect(resultsTab).toHaveAttribute("aria-expanded", "true", { timeout: TAB_ACTIVATION_TIMEOUT_MS })
  }
  const formatButton = page.getByRole("button", { name: format, exact: true })
  await expect(formatButton).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  await formatButton.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  // Outcome-only stages (elimination LD) render a single results view, so the
  // "Select results view" row — and its "Round entry" button — is not in the DOM
  // and the entry view is already active. Click it only when the row exists.
  await expect(page.getByRole("heading", { name: format, exact: true })).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  const resultsViewRow = page.locator('[aria-label="Select results view"]')
  if (await resultsViewRow.count() > 0) {
    const roundEntryButton = resultsViewRow.getByRole("button", { name: "Round entry", exact: true })
    await expect(roundEntryButton).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
    await roundEntryButton.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  }
  if (stage === "preliminary") {
    const picker = page.locator('[aria-label="Select results round"]')
    if (await picker.count() > 0) {
      const roundButton = picker.getByRole("button", { name: expectedRoundLabel, exact: true })
      await expect(roundButton).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
      await roundButton.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
    }
  } else {
    const bracketAliasButton = page
      .locator('div[class~="bg-[#0D1321]"]')
      .getByRole("button", { name: expectedRoundLabel, exact: true })
    await expect(bracketAliasButton).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
    await bracketAliasButton.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  }
  const expectedHeading = stage === "preliminary"
    ? `${expectedRoundLabel} results and speaker points`
    : `${expectedRoundLabel} results`
  const heading = page.getByRole("heading", { name: expectedHeading, exact: true })
  await expect(heading).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
}

export async function selectPairingRound(
  page: Page,
  expectedStages: readonly PairingStageExpectation[],
  stage: IntegrityStage,
  round: IntegrityRound,
) {
  const expectedStage = expectedStages.find((candidate) => candidate.stage === stage)
  if (!expectedStage) throw new Error(`Pairings inventory does not contain the expected ${stage} stage.`)

  const stageLabel = PAIRING_STAGE_LABELS[stage]
  const expectedStageButtonLabel = `${stageLabel} (${expectedStage.format})`
  const pairingsSection = page.locator('[data-pairings-hydrated="true"]')
  const stageButton = pairingsSection.getByRole("button", {
    name: expectedStageButtonLabel,
    exact: true,
  })
  await activateTab(page, "Pairing and Matches", "Results and Statistics", stageButton)
  await expect(pairingsSection).toHaveCount(1, { timeout: TAB_ACTIVATION_TIMEOUT_MS })
  await expect(pairingsSection).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  await expect(stageButton).toHaveCount(1, { timeout: TAB_ACTIVATION_TIMEOUT_MS })
  await expect(stageButton).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  if (await stageButton.getAttribute("aria-pressed", { timeout: TAB_ACTIVATION_TIMEOUT_MS }) !== "true") {
    await stageButton.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  }
  for (const canonicalStage of CANONICAL_PAIRING_STAGES) {
    const stageSnapshot = expectedStages.find((candidate) => candidate.stage === canonicalStage)
    const canonicalLabel = PAIRING_STAGE_LABELS[canonicalStage]
    if (!stageSnapshot) {
      await expect(pairingsSection.getByRole("button").filter({ hasText: canonicalLabel })).toHaveCount(0, {
        timeout: TAB_ACTIVATION_TIMEOUT_MS,
      })
      continue
    }

    const button = pairingsSection.getByRole("button", {
      name: `${canonicalLabel} (${stageSnapshot.format})`,
      exact: true,
    })
    await expect(button).toHaveCount(1, { timeout: TAB_ACTIVATION_TIMEOUT_MS })
    await expect(button).toHaveAttribute("aria-pressed", canonicalStage === stage ? "true" : "false", {
      timeout: TAB_ACTIVATION_TIMEOUT_MS,
    })
  }
  const roundButton = pairingsSection.getByRole("button", { name: round.name, exact: true })
  await expect(roundButton).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  if (await roundButton.getAttribute("aria-pressed", { timeout: TAB_ACTIVATION_TIMEOUT_MS }) !== "true") {
    await roundButton.click({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
  }
  await expect(roundButton).toHaveAttribute("aria-pressed", "true", { timeout: TAB_ACTIVATION_TIMEOUT_MS })
  await expect(page.getByRole("button", { name: "Proceed to next round", exact: true })).toBeVisible({ timeout: TAB_ACTIVATION_TIMEOUT_MS })
}

export async function visibleMatchScores(page: Page, matchId: number) {
  return page.locator(`input[aria-label*="match ${matchId}"]`).evaluateAll((inputs) => inputs.map((input) => ({
    label: input.getAttribute("aria-label"),
    value: (input as HTMLInputElement).value,
  })))
}

export async function visibleMatchRowText(page: Page, matchId: number) {
  return page.locator("tr").filter({ has: page.getByText(`Match ${matchId}`, { exact: true }) }).first().innerText()
}

export function stageRoundSummary(inventory: IntegrityInventory) {
  return inventory.stages.map((stage) => ({
    stage: stage.stage,
    format: stage.format,
    currentRoundNumber: stage.currentRoundNumber,
    rounds: stage.rounds.map((round) => ({ id: round.id, name: round.name, number: round.roundNumber, matches: round.matches.length })),
  }))
}
