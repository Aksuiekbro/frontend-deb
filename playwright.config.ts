import { defineConfig, devices } from "@playwright/test"

const releaseMatrix = process.env.TOURNAMENT_INTEGRITY_RELEASE_MATRIX === "1"
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL
const port = process.env.PLAYWRIGHT_PORT ?? (configuredBaseURL ? new URL(configuredBaseURL).port || "3000" : "3000")
const baseURL = configuredBaseURL ?? `http://localhost:${port}`
const isolatedApiURL = "http://localhost:18080/api"
const readyURL = "http://127.0.0.1:18081/ready"
const evidenceSuffix = process.env.PLAYWRIGHT_EVIDENCE_SUFFIX ?? `playwright-${process.pid}`
if (!/^[A-Za-z0-9._-]+$/.test(evidenceSuffix) || evidenceSuffix === "." || evidenceSuffix === "..") {
  throw new Error("Playwright evidence suffix contains an invalid path component.")
}
const evidenceDirectory = `test-results/tournament-integrity/luna-browser-v2/${evidenceSuffix}`

if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65_535 || (releaseMatrix ? port !== "3000" : !["3000", "3001"].includes(port))) {
  throw new Error("Playwright integrity verification only permits localhost frontend ports 3000/3001, with release matrix fixed to 3000.")
}

const isLocalURL = (value: string) => {
  const url = new URL(value)
  return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1")
}

if (!isLocalURL(baseURL) || !isLocalURL(isolatedApiURL) || !isLocalURL(readyURL)) {
  throw new Error("Playwright integrity verification only permits localhost URLs.")
}

const apiURL = new URL(isolatedApiURL)
if (apiURL.port !== "18080" || apiURL.pathname.replace(/\/+$/, "") !== "/api") {
  throw new Error("Playwright integrity verification only permits http://localhost:18080/api.")
}

const releaseBuildId = process.env.TOURNAMENT_INTEGRITY_RELEASE_BUILD_ID
const releaseExplicitEnv = {
  BACKEND_URL: "http://localhost:18080/api",
  NEXT_PUBLIC_API_URL: "/api",
  NEXT_PUBLIC_PREVIEW_MODE: "false",
  NEXT_PUBLIC_PREVIEW_ROLE: "participant",
  NEXT_PUBLIC_DEMO_MODE: "false",
  NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: "1",
  TOURNAMENT_INTEGRITY_RELEASE_MATRIX: "1",
  NODE_ENV: "production",
} as const

if (releaseMatrix) {
  for (const [name, expected] of Object.entries(releaseExplicitEnv)) {
    if (process.env[name] !== expected) throw new Error(`Release matrix environment ${name} does not match the strict local release contract.`)
  }
  if (!releaseBuildId) throw new Error("Release matrix requires the successful build ID before starting Playwright.")
}

const releaseWebServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries({
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    HOME: process.env.HOME,
    USER: process.env.USER ?? process.env.LOGNAME,
    TMPDIR: process.env.TMPDIR,
    PWD: process.cwd(),
    npm_config_cache: process.env.npm_config_cache ?? process.env.NPM_CONFIG_CACHE ?? `${process.env.HOME ?? "/tmp"}/.npm`,
    LANG: process.env.LANG,
    LC_ALL: process.env.LC_ALL,
    TERM: process.env.TERM,
    CI: process.env.CI,
    PORT: port,
    NODE_ENV: releaseExplicitEnv.NODE_ENV,
    BACKEND_URL: releaseExplicitEnv.BACKEND_URL,
    NEXT_PUBLIC_API_URL: releaseExplicitEnv.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_PREVIEW_MODE: releaseExplicitEnv.NEXT_PUBLIC_PREVIEW_MODE,
    NEXT_PUBLIC_PREVIEW_ROLE: releaseExplicitEnv.NEXT_PUBLIC_PREVIEW_ROLE,
    NEXT_PUBLIC_DEMO_MODE: releaseExplicitEnv.NEXT_PUBLIC_DEMO_MODE,
    NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: releaseExplicitEnv.NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY,
    TOURNAMENT_INTEGRITY_RELEASE_MATRIX: releaseExplicitEnv.TOURNAMENT_INTEGRITY_RELEASE_MATRIX,
  }).filter((entry): entry is [string, string] => entry[1] !== undefined),
)
const shellQuote = (value: string) => "'" + value.replace(/'/g, "'\\''") + "'"
const releaseStartEnv: Record<string, string> = {
  PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
  HOME: process.env.HOME ?? "/tmp",
  USER: process.env.USER ?? process.env.LOGNAME ?? "unknown",
  TMPDIR: process.env.TMPDIR ?? "/tmp",
  PWD: process.cwd(),
  npm_config_cache: process.env.npm_config_cache ?? process.env.NPM_CONFIG_CACHE ?? `${process.env.HOME ?? "/tmp"}/.npm`,
  LANG: process.env.LANG ?? "C",
  LC_ALL: process.env.LC_ALL ?? "C",
  TERM: process.env.TERM ?? "dumb",
  NODE_ENV: "production",
  PORT: port,
  BACKEND_URL: "http://localhost:18080/api",
  NEXT_PUBLIC_API_URL: "/api",
  NEXT_PUBLIC_PREVIEW_MODE: "false",
  NEXT_PUBLIC_PREVIEW_ROLE: "participant",
  NEXT_PUBLIC_DEMO_MODE: "false",
  NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: "1",
}
const releaseStartPreflight = [
  'test -z "${TOURNAMENT_INTEGRITY_RELEASE_SENTINEL_SECRET:-}"',
  'test -z "${TOURNAMENT_INTEGRITY_CONTROL_INSTANCE_TOKEN:-}"',
  'test -z "${TOURNAMENT_INTEGRITY_RELEASE_MATRIX:-}"',
  'test -z "${SOL_BACKEND_PASSWORD:-}"',
  'test -z "${TOURNAMENT_INTEGRITY_ORGANIZER_USERNAME:-}"',
  'test -z "${TOURNAMENT_INTEGRITY_ORGANIZER_PASSWORD:-}"',
  'test -z "${TOURNAMENT_INTEGRITY_DEBATER_USERNAME:-}"',
  'test -z "${TOURNAMENT_INTEGRITY_DEBATER_PASSWORD:-}"',
  'test -n "$PATH"',
  'test -n "$HOME"',
  'test -n "$USER"',
  'test -n "$TMPDIR"',
  'test -n "$npm_config_cache"',
  'test "$NODE_ENV" = "production"',
  'test "$PORT" = "3000"',
  'test "$BACKEND_URL" = "http://localhost:18080/api"',
  'test "$NEXT_PUBLIC_API_URL" = "/api"',
  'test "$NEXT_PUBLIC_PREVIEW_MODE" = "false"',
  'test "$NEXT_PUBLIC_PREVIEW_ROLE" = "participant"',
  'test "$NEXT_PUBLIC_DEMO_MODE" = "false"',
  'test "$NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY" = "1"',
  `exec npm run start -- --port ${shellQuote(port)}`,
].join(" && ")
const releaseStartCommand = `env -i ${Object.entries(releaseStartEnv).map(([name, value]) => `${name}=${shellQuote(value)}`).join(" ")} /bin/sh -c ${shellQuote(releaseStartPreflight)}`
const developmentInheritedEnv: Record<string, string> = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => {
    const [name, value] = entry
    return value !== undefined &&
      !name.startsWith("SOL_") &&
      !name.startsWith("TOURNAMENT_INTEGRITY_") &&
      !/(?:password|username|token|secret|authorization|cookie|credential|api[_-]?key|private[_-]?key)/i.test(name)
  }),
)
const developmentWebServerEnv: Record<string, string> = {
  ...developmentInheritedEnv,
  BACKEND_URL: "http://localhost:18080/api",
  NEXT_PUBLIC_API_URL: "/api",
  NEXT_PUBLIC_PREVIEW_MODE: "false",
  NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: "1",
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 10 * 60 * 1_000,
  globalTimeout: 40 * 60 * 1_000,
  outputDir: `${evidenceDirectory}/artifacts`,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: `${evidenceDirectory}/report` }],
  ],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: releaseMatrix ? releaseStartCommand : `npm run dev -- --port ${port}`,
    url: `http://localhost:${port}/`,
    env: releaseMatrix ? releaseWebServerEnv : developmentWebServerEnv,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
