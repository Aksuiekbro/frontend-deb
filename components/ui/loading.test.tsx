/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import { LocaleProvider } from "@/lib/i18n"
import { LoadingSpinner } from "./loading"

describe("LoadingSpinner", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("uses a localized accessible label", () => {
    window.localStorage.setItem("debetter-locale", "ru")

    render(
      <LocaleProvider>
        <LoadingSpinner />
      </LocaleProvider>,
    )

    expect(screen.getByRole("status", { name: "Загрузка" })).toBeInTheDocument()
  })
})
