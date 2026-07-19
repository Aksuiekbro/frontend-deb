import { expect, test, type APIRequestContext, type Page } from "@playwright/test"

// Regression scenarios reported by the tournament tester (2026-07-17):
//   1. Adding a second schedule item failed with "That username or email is
//      already taken." (schedule was one-per-tournament in the DB).
//   2. Announcements had no category; news had one instead.
//   3. Uploaded announcement photos were cropped.
// Added 2026-07-18:
//   4. Room numbers had to be saved one match at a time, and nothing on the
//      pairing/results buttons confirmed an action had worked (toasts were
//      dispatched but no Toaster was mounted).
// Runs against the local Luna backend stack (http://localhost:18080/api) via
// the dev frontend the Playwright config boots:
//   bash e2e/fixtures/luna-backend-v2/luna-stack.sh up
//   npx playwright test e2e/tester-scenarios.spec.ts

const RUN_ID = Date.now().toString(36)
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PLAYWRIGHT_PORT ?? "3000"}`
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

async function registerParticipant(context: APIRequestContext, index: number): Promise<string> {
  const participant = {
    username: `tsp${index}${RUN_ID}`,
    password: "TesterScenarios1!",
    email: `tsp${index}${RUN_ID}@example.test`,
    firstName: "Tester",
    lastName: `P${index}`,
    role: "PARTICIPANT",
  }
  const registered = await context.post("/api/auth/register", { data: participant })
  expect(registered.ok(), `register participant ${index}: ${registered.status()}`).toBe(true)
  const loggedIn = await context.post("/api/auth/login", {
    data: { username: participant.username, password: participant.password },
  })
  expect(loggedIn.ok(), `login participant ${index}: ${loggedIn.status()}`).toBe(true)
  return participant.username
}

async function createTournament(request: APIRequestContext, name = `Tester Scenarios ${RUN_ID}`): Promise<number> {
  const response = await request.post("/api/tournaments", {
    multipart: {
      data: jsonPart({
        name,
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

  test("rooms save for every match at once and pairing buttons confirm success", async ({ page, playwright }) => {
    await registerLogin(page)
    const roomsTournamentId = await createTournament(page.request, `Tester Rooms ${RUN_ID}`)

    // Four two-member APF teams: creator invites a partner, partner accepts.
    for (let team = 0; team < 4; team++) {
      const creator = await playwright.request.newContext({ baseURL: BASE_URL })
      const partner = await playwright.request.newContext({ baseURL: BASE_URL })
      const partnerName = await registerParticipant(partner, team * 2 + 1)
      await registerParticipant(creator, team * 2)
      const created = await creator.post(`/api/tournaments/${roomsTournamentId}/teams`, {
        data: { name: `Rooms Team ${team + 1}`, club: "Rooms Club", invitedParticipants: [partnerName] },
      })
      expect(created.ok(), `create team ${team + 1}: ${created.status()}`).toBe(true)
      const invitations = await (await partner.get("/api/participant-invitations/received?page=0&size=10")).json()
      const accepted = await partner.post(`/api/participant-invitations/${invitations.content[0].id}/accept`)
      expect(accepted.ok(), `accept invitation team ${team + 1}: ${accepted.status()}`).toBe(true)
      await creator.dispose()
      await partner.dispose()
    }

    const teams = await (await page.request.get(`/api/tournaments/${roomsTournamentId}/teams?page=0&size=20`)).json()
    for (const team of teams.content) {
      const checkedIn = await page.request.patch(`/api/tournaments/${roomsTournamentId}/teams/${team.id}/check-in`)
      expect(checkedIn.ok(), `check in team ${team.id}: ${checkedIn.status()}`).toBe(true)
    }
    const judge = await page.request.post(`/api/tournaments/${roomsTournamentId}/judges`, {
      data: { fullName: "Rooms Judge", email: `tsjudge${RUN_ID}@example.test`, phoneNumber: "+77010000001", checkedIn: true },
    })
    expect(judge.ok(), `add judge: ${judge.status()}`).toBe(true)
    const started = await page.request.patch(`/api/tournaments/${roomsTournamentId}/start`)
    expect(started.ok(), `start tournament: ${started.status()}`).toBe(true)

    const roundGroups = await (await page.request.get(`/api/tournaments/${roomsTournamentId}/round-groups`)).json()
    const roundGroupId = roundGroups.find((group: { type: string }) => group.type === "PRELIMINARY").id
    const rounds = await (await page.request.get(`/api/tournaments/${roomsTournamentId}/round-groups/${roundGroupId}/rounds`)).json()
    const roundId = rounds[0].id
    const randomized = await page.request.patch(`/api/tournaments/${roomsTournamentId}/round-groups/${roundGroupId}/rounds/${roundId}/matches/randomize`)
    expect(randomized.ok(), `randomize: ${randomized.status()}`).toBe(true)
    const matches = await (await page.request.get(`/api/tournaments/${roomsTournamentId}/round-groups/${roundGroupId}/rounds/${roundId}/matches?page=0&size=10`)).json()
    const matchIds: number[] = matches.content.map((match: { id: number }) => match.id)
    expect(matchIds).toHaveLength(2)

    await page.goto(`/tournament/${roomsTournamentId}`)
    await page.getByRole("tab", { name: "Pairing and Matches" }).click()

    const saveAll = page.getByRole("button", { name: /Save all rooms/ })
    await expect(saveAll).toBeDisabled()
    await page.getByLabel(`Room for match ${matchIds[0]}`).fill("204")
    await page.getByLabel(`Room for match ${matchIds[1]}`).fill("305")
    await expect(saveAll).toHaveText("Save all rooms (2)")
    await saveAll.click()

    // One request saves every dirty row; the toast used to be dispatched into
    // the void before the Toaster was mounted.
    await expect(page.getByText("2 rooms saved", { exact: true })).toBeVisible()
    await expect(saveAll).toHaveText(/✓ Rooms saved|Save all rooms \(0\)/)

    await page.getByRole("button", { name: "Publish pairings" }).click()
    await expect(page.getByText("Pairings published", { exact: true })).toBeVisible()

    await page.reload()
    await page.getByRole("tab", { name: "Pairing and Matches" }).click()
    await expect(page.getByLabel(`Room for match ${matchIds[0]}`)).toHaveValue("204")
    await expect(page.getByLabel(`Room for match ${matchIds[1]}`)).toHaveValue("305")
    await expect(page.getByRole("button", { name: /Save all rooms/ })).toBeDisabled()
  })
})

async function registerLogin(page: Page) {
  const response = await page.request.post("/api/auth/login", {
    data: { username: ORGANIZER.username, password: ORGANIZER.password },
  })
  expect(response.ok(), `login organizer: ${response.status()}`).toBe(true)
}
