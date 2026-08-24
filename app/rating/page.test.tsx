/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import RatingPage from "./page"
import { LocaleProvider } from "@/lib/i18n"

describe("RatingPage", () => {
  beforeEach(() => {
    window.localStorage.removeItem("debetter-locale")
  })

  it("renders the English leaderboard placeholder", () => {
    render(
      <LocaleProvider>
        <RatingPage />
      </LocaleProvider>,
    )

    expect(screen.getByRole("region", { name: "Leaderboard" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Champions" })).toBeInTheDocument()
    expect(screen.getByText("Leaderboard coming soon")).toBeInTheDocument()
  })

  it.each([
    ["ru", "Таблица лидеров", "Чемпионы", "Таблица лидеров скоро появится"],
    ["kk", "Көшбасшылар тақтасы", "Чемпиондар", "Көшбасшылар тақтасы жақында пайда болады"],
  ] as const)("localizes the leaderboard placeholder in %s", async (locale, label, heading, message) => {
    window.localStorage.setItem("debetter-locale", locale)

    render(
      <LocaleProvider>
        <RatingPage />
      </LocaleProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole("region", { name: label })).toBeInTheDocument()
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument()
      expect(screen.getByText(message)).toBeInTheDocument()
    })
  })
})
