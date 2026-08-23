import { defineConfig, devices } from "@playwright/test"

const port = process.env.PRODUCTION_REGISTRATION_PORT ?? "3002"
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65_535) {
  throw new Error("PRODUCTION_REGISTRATION_PORT must be a valid TCP port.")
}

const backendUrl = process.env.PRODUCTION_BACKEND_URL
if (!backendUrl) {
  throw new Error("PRODUCTION_BACKEND_URL is required for the production registration test.")
}

const parsedBackendUrl = new URL(backendUrl)
if (!/^https?:$/.test(parsedBackendUrl.protocol) || parsedBackendUrl.username || parsedBackendUrl.password) {
  throw new Error("PRODUCTION_BACKEND_URL must be an HTTP(S) URL without embedded credentials.")
}

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: "./e2e",
  testMatch: "production-registration.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "test-results/production-registration/report" }]],
  outputDir: "test-results/production-registration/artifacts",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `env BACKEND_URL=${shellQuote(parsedBackendUrl.toString().replace(/\/$/, ""))} NEXT_PUBLIC_API_URL=/api npm run dev -- --port ${port}`,
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
