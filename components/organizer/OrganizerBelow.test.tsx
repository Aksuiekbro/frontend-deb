/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import OrganizerBelow from "./OrganizerBelow"
import { LocaleProvider } from "@/lib/i18n"

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}))

describe("OrganizerBelow", () => {
  it("links organizers to browse debates instead of a participation action", () => {
    render(
      <LocaleProvider>
        <OrganizerBelow />
      </LocaleProvider>,
    )

    expect(screen.getByRole("link", { name: "Browse Debates" })).toHaveAttribute("href", "/join")
    expect(screen.getByRole("link", { name: "Host Debate" })).toHaveAttribute("href", "/create-tournament")
    expect(screen.queryByRole("button", { name: "Join Debates" })).not.toBeInTheDocument()
  })
})
