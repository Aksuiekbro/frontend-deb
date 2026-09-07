/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import { ResultsPublicationNotice } from "./ResultsPublicationNotice"
import { LocaleProvider } from "@/lib/i18n"

describe("ResultsPublicationNotice", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("explains that results are not published", () => {
    render(<ResultsPublicationNotice />)

    expect(screen.getByRole("heading", { name: "Results are not published" })).toBeInTheDocument()
    expect(screen.getByText("The organizer has not published the results yet. Please check back later.")).toBeInTheDocument()
  })

  it("uses the selected locale", async () => {
    window.localStorage.setItem("debetter-locale", "ru")

    render(
      <LocaleProvider>
        <ResultsPublicationNotice />
      </LocaleProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Результаты не опубликованы" })).toBeInTheDocument()
    })
  })
})
