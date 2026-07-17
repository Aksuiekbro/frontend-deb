import http from "node:http"
import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HOST = "127.0.0.1"
const PORT = 18081
const API_BASE = "http://localhost:18080/api"
const DB_CONTAINER = process.env.SOL_BACKEND_DB_CONTAINER || "debetter-postgres"
const DB_USER = process.env.SOL_BACKEND_DB_USER || "debetter_user"
const DB_NAME = process.env.SOL_BACKEND_DB_NAME || "debetter"
const PASSWORD = process.env.SOL_BACKEND_PASSWORD
const INSTANCE_TOKEN = process.env.LUNA_CONTROL_INSTANCE_TOKEN
const ROOT = dirname(fileURLToPath(import.meta.url))

const FIXTURE_IDS = [9101, 9102, 9103, 9104, 9105, 9106]
const FIXTURE_SET = new Set(FIXTURE_IDS)
const MAX_BODY_BYTES = 16 * 1024
const INSTANCE_ID_HASH = INSTANCE_TOKEN ? createHash("sha256").update(INSTANCE_TOKEN).digest("hex") : null

if (!PASSWORD || PASSWORD.length > 32) {
  throw new Error("SOL_BACKEND_PASSWORD must be present and at most 32 characters")
}
if (!INSTANCE_TOKEN || !/^[a-f0-9]{64}$/.test(INSTANCE_TOKEN)) {
  throw new Error("LUNA_CONTROL_INSTANCE_TOKEN must be a 64-character lowercase hex token")
}
if (DB_CONTAINER !== "debetter-postgres") {
  throw new Error("Only the local debetter-postgres container is allowed")
}

let resetQueue = Promise.resolve()

function log(message) {
  process.stdout.write(`${new Date().toISOString()} ${message}\n`)
}

function jsonResponse(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  })
  res.end(body)
}

function errorResponse(res, status, message) {
  jsonResponse(res, status, { error: message })
}

function runProcess(command, args, input = "") {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => { stdout += chunk })
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.on("error", () => reject(new Error("local command could not be started")))
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`local database command failed with exit status ${code}`))
      }
    })
    child.stdin.end(input)
  })
}

async function runSqlFile(fileName) {
  const sql = readFileSync(join(ROOT, fileName), "utf8")
  await runProcess("docker", [
    "exec", "-i", DB_CONTAINER, "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1",
    "-U", DB_USER, "-d", DB_NAME, "-f", "-",
  ], sql)
}

async function runSql(sql) {
  await runProcess("docker", [
    "exec", "-i", DB_CONTAINER, "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1",
    "-U", DB_USER, "-d", DB_NAME, "-At", "-c", sql,
  ])
}

async function registerUser(username, role) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username,
      password: PASSWORD,
      email: `${username}@example.invalid`,
      firstName: "Synthetic",
      lastName: username,
      role,
      city: null,
      institution: null,
    }),
  })
  if (!response.ok) throw new Error(`local account registration failed for ${username} (${response.status})`)
}

async function registerFixtureAccounts() {
  await registerUser("solborg", "ORGANIZER")
  for (let index = 1; index <= 16; index += 1) {
    await registerUser(`solbp${String(index).padStart(2, "0")}`, "PARTICIPANT")
  }
}

const scenarioSql = {
  "legacy-zero-row": `
DELETE FROM match_participant_score
WHERE match_id IN (9105111, 9105112);
`,
  "partial-row-nonrepairable": `
DELETE FROM match_participant_score
WHERE match_id IN (9105111, 9105112);
INSERT INTO match_participant_score (id, match_id, participant_id, score)
VALUES (91059001, 9105111, 91051011, 70);
`,
}

function normalizeScenario(value) {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "string") throw new Error("scenario must be a string")
  const normalized = value.trim().toLowerCase()
  if (["legacy-repair", "legacy-zero-row", "legacy-zero-row-9105"].includes(normalized)) return "legacy-zero-row"
  if (["partial-row", "partial-row-nonrepairable", "partial-row-nonrepairable-9105"].includes(normalized)) return "partial-row-nonrepairable"
  throw new Error("unsupported fixture scenario")
}

async function reseed(fixtureId, requestedScenario) {
  const scenario = normalizeScenario(requestedScenario)
  await runSqlFile("reset-fixtures.sql")
  await registerFixtureAccounts()
  await runSqlFile("setup-fixtures.sql")
  if (scenario) await runSql(scenarioSql[scenario])
  const state = await readState(fixtureId)
  return { scenario, state }
}

function enqueueReset(work) {
  const next = resetQueue.then(work, work)
  resetQueue = next.catch(() => undefined)
  return next
}

const stateQuery = (fixtureId) => `
SELECT jsonb_build_object(
  'schemaVersion', 1,
  'source', 'postgresql',
  'fixtureId', t.id,
  'tournamentId', t.id,
  'tournament', jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'preliminaryFormat', t.preliminary_format,
    'teamEliminationFormat', t.team_elimination_format,
    'started', t.started,
    'finished', t.finished,
    'disabled', t.disabled
  ),
  'roundGroups', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', rg.id,
      'type', rg.type,
      'format', rg.format,
      'currentRoundNumber', rg.current_round_number,
      'rounds', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'roundNumber', r.round_number,
          'matchesArePublic', r.matches_are_public,
          'customFormat', r.custom_format,
          'teamIds', COALESCE((
            SELECT jsonb_agg(rt.team_id ORDER BY rt.team_id)
            FROM round_team rt WHERE rt.round_id = r.id
          ), '[]'::jsonb),
          'debaterIds', COALESCE((
            SELECT jsonb_agg(rd.debater_id ORDER BY rd.debater_id)
            FROM round_debater rd WHERE rd.round_id = r.id
          ), '[]'::jsonb),
          'matches', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', m.id,
              'completed', m.completed,
              'isBye', m.is_bye,
              'location', m.location,
              'startTime', m.start_time,
              'teamSlots', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'slot', x.slot_name,
                  'teamId', x.team_id,
                  'name', tm.name,
                  'score', x.team_score,
                  'won', x.team_won,
                  'participantIds', COALESCE((
                    SELECT jsonb_agg(tp.id ORDER BY tp.id)
                    FROM tournament_participant tp WHERE tp.team_id = x.team_id
                  ), '[]'::jsonb)
                ) ORDER BY x.slot_number)
                FROM (VALUES
                  (1, 'team1', m.team1_id, m.team1_score, m.team1_won),
                  (2, 'team2', m.team2_id, m.team2_score, m.team2_won),
                  (3, 'team3', m.team3_id, m.team3_score, m.team3_won),
                  (4, 'team4', m.team4_id, m.team4_score, m.team4_won)
                ) AS x(slot_number, slot_name, team_id, team_score, team_won)
                LEFT JOIN team tm ON tm.id = x.team_id
                WHERE x.team_id IS NOT NULL
              ), '[]'::jsonb),
              'debaters', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'slot', d.slot_name,
                  'participantId', d.participant_id,
                  'score', d.score
                ) ORDER BY d.slot_number)
                FROM (VALUES
                  (1, 'debater1', m.debater1_id, m.debater1_score),
                  (2, 'debater2', m.debater2_id, m.debater2_score)
                ) AS d(slot_number, slot_name, participant_id, score)
                WHERE d.participant_id IS NOT NULL
              ), '[]'::jsonb),
              'winners', COALESCE((
                SELECT jsonb_agg(w.team_id ORDER BY w.slot_number)
                FROM (VALUES
                  (1, m.team1_id, m.team1_won),
                  (2, m.team2_id, m.team2_won),
                  (3, m.team3_id, m.team3_won),
                  (4, m.team4_id, m.team4_won)
                ) AS w(slot_number, team_id, team_won)
                WHERE w.team_id IS NOT NULL AND w.team_won IS TRUE
              ), '[]'::jsonb),
              'winnerParticipantId', m.winner_participant_id,
              'participantScoreRows', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id', ps.id,
                  'matchId', ps.match_id,
                  'participantId', ps.participant_id,
                  'score', ps.score
                ) ORDER BY ps.participant_id, ps.id)
                FROM match_participant_score ps WHERE ps.match_id = m.id
              ), '[]'::jsonb),
              'expectedParticipantScoreRows', CASE
                WHEN rg.type <> 'PRELIMINARY' THEN 0
                WHEN num_nonnulls(m.debater1_id, m.debater2_id) > 0 THEN num_nonnulls(m.debater1_id, m.debater2_id)
                ELSE (SELECT count(*) FROM tournament_participant tp WHERE tp.team_id IN (m.team1_id, m.team2_id, m.team3_id, m.team4_id))
              END,
              'participantScoreRowCount', (SELECT count(*) FROM match_participant_score ps WHERE ps.match_id = m.id),
              'participantScoresComplete', (
                (SELECT count(*) FROM match_participant_score ps WHERE ps.match_id = m.id) = CASE
                  WHEN rg.type <> 'PRELIMINARY' THEN 0
                  WHEN num_nonnulls(m.debater1_id, m.debater2_id) > 0 THEN num_nonnulls(m.debater1_id, m.debater2_id)
                  ELSE (SELECT count(*) FROM tournament_participant tp WHERE tp.team_id IN (m.team1_id, m.team2_id, m.team3_id, m.team4_id))
                END
              ),
              'participantScoresRepairable', (
                m.completed AND rg.type = 'PRELIMINARY' AND
                (SELECT count(*) FROM match_participant_score ps WHERE ps.match_id = m.id) = 0
              )
            ) ORDER BY m.id)
            FROM "match" m WHERE m.round_id = r.id
          ), '[]'::jsonb)
        ) ORDER BY r.round_number, r.id)
        FROM round r WHERE r.round_group_id = rg.id
      ), '[]'::jsonb)
    ) ORDER BY rg.id)
    FROM round_group rg WHERE rg.tournament_id = t.id
  ), '[]'::jsonb),
  'teamTotals', jsonb_build_object(
    'preliminaryScoreSum', COALESCE((SELECT sum(COALESCE(tm.preliminary_score, 0)) FROM team tm WHERE tm.tournament_id = t.id), 0),
    'preliminaryScoreRowCount', (SELECT count(*) FROM team tm WHERE tm.tournament_id = t.id),
    'preliminaryScoreNonNullCount', (SELECT count(*) FROM team tm WHERE tm.tournament_id = t.id AND tm.preliminary_score IS NOT NULL)
  ),
  'teamPreliminaryStandings', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'rank', ranked.rank,
      'teamId', ranked.id,
      'name', ranked.name,
      'preliminaryScore', ranked.preliminary_score,
      'active', ranked.active,
      'checkedIn', ranked.checked_in,
      'disqualified', ranked.disqualified,
      'participantCount', ranked.participant_count
    ) ORDER BY ranked.rank, ranked.id)
    FROM (
      SELECT tm.*, count(tp.id) AS participant_count,
        rank() OVER (ORDER BY tm.preliminary_score DESC NULLS LAST, tm.id) AS rank
      FROM team tm
      LEFT JOIN tournament_participant tp ON tp.team_id = tm.id
      WHERE tm.tournament_id = t.id
      GROUP BY tm.id
    ) ranked
  ), '[]'::jsonb),
  'participantSpeakerTotals', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'participantId', tp.id,
      'teamId', tp.team_id,
      'speakerScore', tp.speaker_score
    ) ORDER BY tp.id)
    FROM tournament_participant tp
    JOIN team tm ON tm.id = tp.team_id
    WHERE tm.tournament_id = t.id
  ), '[]'::jsonb),
  'speakerTotals', jsonb_build_object(
    'rowCount', (SELECT count(*) FROM tournament_participant tp JOIN team tm ON tm.id = tp.team_id WHERE tm.tournament_id = t.id),
    'sum', COALESCE((SELECT sum(tp.speaker_score) FROM tournament_participant tp JOIN team tm ON tm.id = tp.team_id WHERE tm.tournament_id = t.id), 0),
    'nonZeroCount', (SELECT count(*) FROM tournament_participant tp JOIN team tm ON tm.id = tp.team_id WHERE tm.tournament_id = t.id AND tp.speaker_score <> 0)
  ),
  'counts', jsonb_build_object(
    'teams', (SELECT count(*) FROM team tm WHERE tm.tournament_id = t.id),
    'participants', (SELECT count(*) FROM tournament_participant tp JOIN team tm ON tm.id = tp.team_id WHERE tm.tournament_id = t.id),
    'roundGroups', (SELECT count(*) FROM round_group rg WHERE rg.tournament_id = t.id),
    'rounds', (SELECT count(*) FROM round r JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id),
    'matches', (SELECT count(*) FROM "match" m JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id),
    'completedMatches', (SELECT count(*) FROM "match" m JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id AND m.completed),
    'incompleteMatches', (SELECT count(*) FROM "match" m JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id AND NOT m.completed),
    'teamMatchCount', (SELECT count(*) FROM "match" m JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id AND rg.type <> 'SOLO_ELIMINATION'),
    'soloMatchCount', (SELECT count(*) FROM "match" m JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id AND rg.type = 'SOLO_ELIMINATION'),
    'winnerSlots', (SELECT count(*) FROM "match" m JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id CROSS JOIN LATERAL (VALUES (m.team1_id, m.team1_won), (m.team2_id, m.team2_won), (m.team3_id, m.team3_won), (m.team4_id, m.team4_won)) w(team_id, team_won) WHERE rg.tournament_id = t.id AND w.team_id IS NOT NULL AND w.team_won IS TRUE),
    'participantScoreRows', (SELECT count(*) FROM match_participant_score ps JOIN "match" m ON m.id = ps.match_id JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id),
    'matchesWithParticipantScoreRows', (SELECT count(DISTINCT m.id) FROM match_participant_score ps JOIN "match" m ON m.id = ps.match_id JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id),
    'scorelessCompletedMatches', (SELECT count(*) FROM "match" m JOIN round r ON r.id = m.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id AND m.completed AND NOT EXISTS (SELECT 1 FROM match_participant_score ps WHERE ps.match_id = m.id)),
    'roundTeamRows', (SELECT count(*) FROM round_team rt JOIN round r ON r.id = rt.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id),
    'roundDebaterRows', (SELECT count(*) FROM round_debater rd JOIN round r ON r.id = rd.round_id JOIN round_group rg ON rg.id = r.round_group_id WHERE rg.tournament_id = t.id)
  )
)
FROM tournament t
WHERE t.id = ${fixtureId};
`

async function readState(fixtureId) {
  const result = await runProcess("docker", [
    "exec", "-i", DB_CONTAINER, "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1",
    "-U", DB_USER, "-d", DB_NAME, "-At", "-c", stateQuery(fixtureId),
  ])
  const raw = result.stdout.trim()
  if (!raw) throw new Error("fixture is not seeded")
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error("local database returned invalid fixture state")
  }
}

function fixtureFromPath(pathname) {
  const match = pathname.match(/^\/fixtures\/(\d+)\/(reset|state)$/)
  if (!match) return null
  const fixtureId = Number(match[1])
  if (!FIXTURE_SET.has(fixtureId)) throw new Error("unknown fixture")
  return { fixtureId, action: match[2] }
}

function readyReport() {
  const base = `http://${HOST}:${PORT}`
  return {
    ready: true,
    service: "luna-backend-v2-fixture-control",
    bind: `${HOST}:${PORT}`,
    instanceToken: INSTANCE_TOKEN,
    instanceIdHash: INSTANCE_ID_HASH,
    database: "local Docker PostgreSQL",
    fixtures: FIXTURE_IDS.map((fixtureId) => ({
      fixtureId,
      tournamentId: fixtureId,
      resetURL: `${base}/fixtures/${fixtureId}/reset`,
      resetMethod: "POST",
      stateURL: `${base}/fixtures/${fixtureId}/state`,
      stateMethod: "GET",
    })),
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error("request body too large"))
        req.destroy()
      }
    })
    req.on("end", () => resolve(body))
    req.on("error", () => reject(new Error("request body could not be read")))
  })
}

async function handle(req, res) {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`)
  if (req.method === "GET" && url.pathname === "/ready") {
    jsonResponse(res, 200, readyReport())
    return
  }

  let fixture
  try {
    fixture = fixtureFromPath(url.pathname)
  } catch {
    errorResponse(res, 404, "unknown fixture")
    return
  }
  if (!fixture) {
    errorResponse(res, 404, "not found")
    return
  }

  if (req.method === "GET" && fixture.action === "state") {
    try {
      jsonResponse(res, 200, await readState(fixture.fixtureId))
    } catch {
      errorResponse(res, 503, "fixture state unavailable")
    }
    return
  }

  if (req.method === "POST" && fixture.action === "reset") {
    let requestedScenario
    try {
      const body = await readRequestBody(req)
      if (body.trim()) {
        const parsed = JSON.parse(body)
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("request body must be an object")
        requestedScenario = parsed.scenario
      }
      const result = await enqueueReset(() => reseed(fixture.fixtureId, requestedScenario))
      jsonResponse(res, 200, {
        reset: true,
        fixtureId: fixture.fixtureId,
        tournamentId: fixture.fixtureId,
        scenario: result.scenario,
        stateURL: `http://${HOST}:${PORT}/fixtures/${fixture.fixtureId}/state`,
        counts: result.state.counts,
      })
    } catch (error) {
      if (error instanceof Error && error.message === "unsupported fixture scenario") {
        errorResponse(res, 400, error.message)
      } else if (error instanceof Error && error.message === "scenario must be a string") {
        errorResponse(res, 400, error.message)
      } else if (error instanceof Error && error.message === "request body must be an object") {
        errorResponse(res, 400, error.message)
      } else {
        log(`reset failed fixture=${fixture.fixtureId}`)
        errorResponse(res, 503, "fixture reset failed")
      }
    }
    return
  }

  errorResponse(res, 405, "method not allowed")
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) errorResponse(res, 500, "control service error")
    else res.destroy()
  })
})

server.on("error", () => {
  log("server failed")
  process.exit(1)
})

server.listen(PORT, HOST, () => log(`ready bind=${HOST}:${PORT} fixtures=${FIXTURE_IDS.join(",")}`))

process.on("SIGTERM", () => server.close(() => process.exit(0)))
process.on("SIGINT", () => server.close(() => process.exit(0)))
