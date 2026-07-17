import { expect, test, type APIRequestContext, type Page } from "@playwright/test"

// Regression scenarios reported by the tournament tester (2026-07-17):
//   1. Adding a second schedule item failed with "That username or email is
//      already taken." (schedule was one-per-tournament in the DB).
//   2. Announcements had no category; news had one instead.
//   3. Uploaded announcement photos were cropped.
// Runs against the local Luna backend stack (http://localhost:18080/api) via
// the dev frontend the Playwright config boots:
//   bash e2e/fixtures/luna-backend-v2/luna-stack.sh up
//   npx playwright test e2e/tester-scenarios.spec.ts

const RUN_ID = Date.now().toString(36)
const ORGANIZER = {
  username: `tsorg${RUN_ID}`,
  password: "TesterScenarios1!",
  email: `tsorg${RUN_ID}@example.test`,
  firstName: "Tester",
  lastName: "Scenarios",
  role: "ORGANIZER",
}

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

const jsonPart = (value: unknown) => ({
  name: "data.json",
  mimeType: "application/json",
  buffer: Buffer.from(JSON.stringify(value)),
})

const imagePart = (name: string) => ({
  name,
  mimeType: "image/png",
  buffer: PNG_1X1,
})

async function registerOrganizer(request: APIRequestContext) {
  const response = await request.post("/api/auth/register", { data: ORGANIZER })
  expect(response.ok(), `register organizer: ${response.status()}`).toBe(true)
}

async function createTournament(request: APIRequestContext): Promise<number> {
  const response = await request.post("/api/tournaments", {
    multipart: {
      data: jsonPart({
        name: `Tester Scenarios ${RUN_ID}`,
        description: "Local e2e regression tournament",
        startDate: "2027-03-10T09:00:00",
        endDate: "2027-03-12T18:00:00",
        registrationDeadline: "2027-03-09T18:00:00",
        location: "Local Docker",
        league: "UNIVERSITY",
        teamLimit: 16,
        preliminaryFormat: "APF",
        teamEliminationFormat: "APF",
        preliminaryRoundCount: 3,
        eliminationRoundCount: 2,
      }),
      image: imagePart("tournament.png"),
    },
  })
  expect(response.ok(), `create tournament: ${response.status()}`).toBe(true)
  const body = await response.json()
  expect(typeof body.id).toBe("number")
  return body.id
}

async function fillAndSubmitPostModal(page: Page, title: string, description: string) {
  const modal = page.locator("form").filter({ has: page.getByPlaceholder("Enter post title") })
  await modal.locator('input[type="file"]').setInputFiles({
    name: `${title.replace(/\s+/g, "-").toLowerCase()}.png`,
    mimeType: "image/png",
    buffer: PNG_1X1,
  })
  await modal.getByPlaceholder("Enter post title").fill(title)
  await modal.getByPlaceholder("Enter post description").fill(description)
  await modal.getByRole("button", { name: "Submit" }).click()
}

test.describe.serial("tester regression scenarios", () => {
  let tournamentId: number

  test.beforeAll(async ({ request }) => {
    await registerOrganizer(request)
  })

  test("organizer can add more than one schedule item", async ({ page }) => {
    await registerLogin(page)
    tournamentId = await createTournament(page.request)
    await page.goto(`/tournament/${tournamentId}`)

    await page.getByRole("tab", { name: "Announcements" }).click()
    await page.getByRole("button", { name: "Schedule", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Schedule", exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Add schedule" }).click()
    await fillAndSubmitPostModal(page, "Day 1 registration", "8:00-9:00 TIRKEU")
    await expect(page.getByRole("heading", { name: "Day 1 registration" })).toBeVisible()

    await page.getByRole("button", { name: "Add schedule" }).click()
    await fillAndSubmitPostModal(page, "Day 2 finals", "15:00-16:20 LD FINAL")

    // The old @OneToOne schedule mapping rejected the second item with a
    // misleading duplicate-account error; both items must now coexist.
    await expect(page.getByText("That username or email is already taken.")).toHaveCount(0)
    await expect(page.getByRole("heading", { name: "Day 1 registration" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Day 2 finals" })).toBeVisible()
  })

  test("announcements carry a category badge; news modal has no category", async ({ page }) => {
    await registerLogin(page)
    await page.goto(`/tournament/${tournamentId}`)

    await page.getByRole("button", { name: "Add announcement" }).click()
    const modal = page.locator("form").filter({ has: page.getByPlaceholder("Enter post title") })
    const categorySelect = modal.locator("select")
    await expect(categorySelect).toHaveCount(1)
    await categorySelect.selectOption("Important")
    await fillAndSubmitPostModal(page, "Elimination results ready", "Check the brackets")

    await expect(page.getByRole("heading", { name: "Elimination results ready" })).toBeVisible()
    await expect(page.getByText("Important", { exact: true })).toBeVisible()

    await page.getByRole("tab", { name: "News", exact: true }).click()
    await page.getByRole("button", { name: "Add News" }).click()
    const newsModal = page.locator("form").filter({ has: page.getByPlaceholder("Enter post title") })
    await expect(newsModal.getByPlaceholder("Enter post title")).toBeVisible()
    await expect(newsModal.locator("select")).toHaveCount(0)
  })
})

async function registerLogin(page: Page) {
  const response = await page.request.post("/api/auth/login", {
    data: { username: ORGANIZER.username, password: ORGANIZER.password },
  })
  expect(response.ok(), `login organizer: ${response.status()}`).toBe(true)
}
