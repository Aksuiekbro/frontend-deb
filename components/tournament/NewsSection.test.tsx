/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import { NewsSection } from "./NewsSection"

describe("NewsSection", () => {
  it("hides add news when the organizer handler is not wired", () => {
    render(<NewsSection news={{ content: [], totalElements: 0, totalPages: 0 }} newsLoading={false} />)

    expect(screen.queryByRole("button", { name: "Add News" })).not.toBeInTheDocument()
  })

  it("calls the add news handler when organizer controls are wired", () => {
    const onAddNews = jest.fn()
    render(
      <NewsSection
        news={{ content: [], totalElements: 0, totalPages: 0 }}
        newsLoading={false}
        onAddNews={onAddNews}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Add News" }))

    expect(onAddNews).toHaveBeenCalledTimes(1)
  })
})
