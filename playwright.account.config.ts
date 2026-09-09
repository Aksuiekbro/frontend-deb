import { defineConfig, devices } from "@playwright/test"

// This account UI suite uses synthetic browser routes only. It does not use the
// tournament fixture controller or connect to an external backend.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "account-profile.spec.ts",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  outputDir: "test-results/account-profile/artifacts",
  reporter: [["list"], ["html", { open: "never", outputFolder: "test-results/account-profile/report" }]],
  use: {
    baseURL: "http://127.0.0.1:3108",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3108",
    url: "http://127.0.0.1:3108",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_API_URL: "/api",
      BACKEND_URL: "http://127.0.0.1:9/api",
      NEXT_PUBLIC_PREVIEW_MODE: "false",
      NEXT_PUBLIC_DEMO_MODE: "false",
    },
  },
})
