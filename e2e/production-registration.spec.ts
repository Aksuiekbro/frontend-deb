import { expect, test } from "@playwright/test"

test("a participant can register through the frontend against the production backend", async ({ page }) => {
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 10_000).toString(36)}`
  const username = `e2ep${suffix}`.slice(0, 20)
  const signUpForm = page.locator("#auth-signup-name").locator("xpath=ancestor::form")

  await page.goto("/auth?mode=register")
  await page.locator("#auth-signup-name").fill(username)
  await page.locator("#auth-signup-email").fill(`${username}@example.test`)
  await page.locator("#auth-signup-password").fill("ProductionE2E1!")
  await page.locator("#auth-signup-firstname").fill("Production")
  await page.locator("#auth-signup-lastname").fill("Registration")
  await page.getByLabel("Debater").check()
  await page.locator("#auth-signup-city").fill("Almaty")
  await page.locator("#auth-signup-institution").fill("DeBetter E2E")

  const registrationResponse = page.waitForResponse((response) => (
    response.request().method() === "POST" && new URL(response.url()).pathname === "/api/auth/register"
  ))

  await signUpForm.getByRole("button", { name: "Sign Up" }).click()

  const response = await registrationResponse
  expect(response.status(), await response.text()).toBe(200)

  await expect(page.getByText("Account created successfully! Redirecting...")).toBeVisible()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText("Welcome back, Production!")).toBeVisible()
})
