import { expect, test, type Page } from "@playwright/test"

const initialUser = {
  id: 7001,
  username: "AccountTester",
  firstName: "Account",
  lastName: "Tester",
  email: "account@example.test",
  role: "PARTICIPANT",
  profileId: 7001,
  socialProfiles: [],
  createdAt: "2026-09-01T00:00:00Z",
}

type AccountPatch = Partial<Record<"username" | "firstName" | "lastName" | "email" | "oldPassword" | "newPassword", string>>

async function mockAccounts(page: Page, signedIn = true) {
  const current = { ...initialUser }
  const patches: AccountPatch[] = []
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === "/api/users/me") {
      await route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? current : { message: "Sign in required" } })
    } else if (path === `/api/users/${initialUser.id}` && route.request().method() === "PATCH") {
      const patch = route.request().postDataJSON() as AccountPatch
      patches.push(patch)
      if (patch.username === "AlreadyTaken") {
        await route.fulfill({ status: 409, json: { message: "That username is already taken." } })
      } else if (patch.oldPassword && patch.oldPassword !== "CurrentPassword1!") {
        await route.fulfill({ status: 400, json: { message: "Old password is incorrect" } })
      } else {
        for (const key of ["username", "firstName", "lastName", "email"] as const) {
          const value = patch[key]
          if (value !== undefined) current[key] = value
        }
        await route.fulfill({ json: current })
      }
    } else if (path === `/api/users/${initialUser.id}`) {
      await route.fulfill({ json: current })
    } else if (path === "/api/users/7002") {
      await route.fulfill({ json: { ...initialUser, id: 7002, username: "OtherDebater" } })
    } else {
      await route.fulfill({ status: 200, json: { content: [], totalElements: 0, totalPages: 0 } })
    }
  })
  return { patches }
}

test("owner edits identity with keyboard, cancels drafts, and sees saved values after reload", async ({ page }, testInfo) => {
  const { patches } = await mockAccounts(page)
  await page.goto(`/profile/${initialUser.id}`)
  const edit = page.getByRole("button", { name: "Edit profile", exact: true })
  await edit.focus()
  await page.keyboard.press("Enter")
  await page.getByLabel("First name", { exact: true }).fill("Discarded")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  expect(patches).toHaveLength(0)
  await edit.click()
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Account")
  await page.getByLabel("Nickname", { exact: true }).fill("UpdatedDebater")
  await page.getByLabel("First name", { exact: true }).fill(" Updated ")
  await page.getByLabel("Last name", { exact: true }).fill("Name")
  await page.getByLabel("Email", { exact: true }).fill("updated@example.test")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByRole("heading", { name: "UpdatedDebater", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Your profile", exact: true })).toContainText("UpdatedDebater")
  expect(patches).toEqual([{ username: "UpdatedDebater", firstName: "Updated", lastName: "Name", email: "updated@example.test" }])
  await page.screenshot({ path: testInfo.outputPath("profile-saved-desktop.png"), fullPage: true })
  await page.reload()
  await expect(page.getByRole("heading", { name: "UpdatedDebater", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "updated@example.test", exact: true })).toBeVisible()
})

test("duplicate nickname errors keep the draft and allow correction", async ({ page }) => {
  const { patches } = await mockAccounts(page)
  await page.goto(`/profile/${initialUser.id}`)
  await page.getByRole("button", { name: "Edit profile", exact: true }).click()
  await page.getByLabel("Nickname", { exact: true }).fill("AlreadyTaken")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByRole("form", { name: "Edit profile", exact: true }).getByRole("alert")).toContainText("already in use")
  await expect(page.getByLabel("Nickname", { exact: true })).toHaveValue("AlreadyTaken")
  await expect(page.getByRole("heading", { name: "AccountTester", exact: true })).toBeVisible()
  await page.getByLabel("Nickname", { exact: true }).fill("CorrectedName")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByRole("heading", { name: "CorrectedName", exact: true })).toBeVisible()
  expect(patches).toHaveLength(2)
})

test("password change validates confirmation, shows rejection, and clears secrets on success", async ({ page }) => {
  const { patches } = await mockAccounts(page)
  await page.goto(`/profile/${initialUser.id}`)
  await page.getByRole("button", { name: "Change password", exact: true }).click()
  await page.getByLabel("Current password", { exact: true }).fill("WrongPassword1!")
  await page.getByLabel("New password", { exact: true }).fill("ReplacementPass1!")
  await page.getByLabel("Confirm new password", { exact: true }).fill("DoesNotMatch1!")
  await page.getByRole("button", { name: "Save password", exact: true }).click()
  await expect(page.getByRole("form", { name: "Change password", exact: true }).getByRole("alert")).toContainText("do not match")
  expect(patches).toHaveLength(0)
  await page.getByLabel("Confirm new password", { exact: true }).fill("ReplacementPass1!")
  await page.getByRole("button", { name: "Save password", exact: true }).click()
  await expect(page.getByRole("form", { name: "Change password", exact: true }).getByRole("alert")).toContainText("Old password is incorrect")
  await page.getByLabel("Current password", { exact: true }).fill("CurrentPassword1!")
  await page.getByRole("button", { name: "Save password", exact: true }).click()
  await expect(page.getByRole("status")).toContainText(/password.*(changed|updated)/i)
  expect(patches.at(-1)).toEqual({ oldPassword: "CurrentPassword1!", newPassword: "ReplacementPass1!" })
  await page.getByRole("button", { name: "Change password", exact: true }).click()
  const passwordFields = page.getByRole("form", { name: "Change password", exact: true }).locator('input[type="password"]')
  await expect(passwordFields).toHaveCount(3)
  for (const field of await passwordFields.all()) {
    await expect(field).toHaveValue("")
  }
})

test("another profile has no account-management controls and sign-in has no dead recovery link", async ({ page }) => {
  await mockAccounts(page)
  await page.goto("/profile/7002")
  await expect(page.getByRole("heading", { name: "OtherDebater", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /^(Edit profile|Change password|Log out|Delete account)$/ })).toHaveCount(0)
  await page.goto("/auth?mode=login")
  await expect(page.getByRole("link", { name: /forgot.*password/i })).toHaveCount(0)
})

test("unauthenticated profile viewers have no account-management controls", async ({ page }) => {
  await mockAccounts(page, false)
  await page.goto(`/profile/${initialUser.id}`)
  await expect(page.getByRole("heading", { name: "AccountTester", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /^(Edit profile|Change password|Log out|Delete account)$/ })).toHaveCount(0)
})

for (const locale of ["en", "ru", "kk"] as const) {
  test(`profile forms fit mobile and retain localized controls (${locale})`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript((value) => localStorage.setItem("debetter-locale", value), locale)
    await mockAccounts(page)
    await page.goto(`/profile/${initialUser.id}`)
    const editNames = { en: "Edit profile", ru: "Редактировать профиль", kk: "Профильді өңдеу" }
    await page.getByRole("button", { name: editNames[locale], exact: true }).click()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
    await page.screenshot({ path: testInfo.outputPath(`profile-edit-${locale}-mobile.png`), fullPage: true })
    await page.getByRole("button", { name: editNames[locale], exact: true }).click()
    const passwordNames = { en: "Change password", ru: "Изменить пароль", kk: "Құпиясөзді өзгерту" }
    await page.getByRole("button", { name: passwordNames[locale], exact: true }).click()
    await expect(page.getByRole("form", { name: passwordNames[locale], exact: true })).toBeVisible()
    const passwordWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(passwordWidth).toBeLessThanOrEqual(390)
    await page.screenshot({ path: testInfo.outputPath(`password-edit-${locale}-mobile.png`), fullPage: true })
  })
}
