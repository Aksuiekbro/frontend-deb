/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import LogoutButton from "./LogoutButton"
import { LocaleProvider } from "@/lib/i18n"

jest.mock("@/lib/api", () => ({
  api: {
    logout: jest.fn(),
  },
}))

describe("LogoutButton", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("translates the logout action into Kazakh", async () => {
    window.localStorage.setItem("debetter-locale", "kk")
    render(
      <LocaleProvider>
        <LogoutButton />
      </LocaleProvider>,
    )

    await waitFor(() => expect(screen.getByRole("button", { name: "Шығу" })).toBeInTheDocument())
  })
})
