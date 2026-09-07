/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import LogoutButton from "./LogoutButton"
import { LocaleProvider } from "@/lib/i18n"
import { api } from "@/lib/api"

jest.mock("@/lib/api", () => ({
  api: {
    logout: jest.fn(),
  },
}))

describe("LogoutButton", () => {
  afterEach(() => {
    window.localStorage.clear()
    jest.restoreAllMocks()
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

  it("clears private result drafts when logout finishes without clearing the locale", async () => {
    const key = "tournament:53:round-group:101:round:201:match-results:principal:7"
    window.localStorage.setItem(key, '{"301:team1":{"result":"won"}}')
    window.localStorage.setItem("debetter-locale", "en")
    jest.mocked(api.logout).mockResolvedValue({ ok: true } as Response)
    // jsdom reports its unimplemented navigation when the component reloads.
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    render(<LogoutButton />)

    fireEvent.click(screen.getByRole("button", { name: "Log out" }))

    await waitFor(() => expect(window.localStorage.getItem(key)).toBeNull())
    expect(api.logout).toHaveBeenCalled()
    expect(window.localStorage.getItem("debetter-locale")).toBe("en")
  })
})
