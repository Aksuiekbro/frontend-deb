/**
 * @jest-environment jsdom
 */
import type { ComponentPropsWithoutRef } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Header from "./Header"
import { LocaleProvider } from "@/lib/i18n"
import { Role } from "@/types/user/user"

type MockLinkProps = ComponentPropsWithoutRef<"a"> & { prefetch?: boolean }

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ prefetch, ...props }: MockLinkProps) => (
    <a {...props} data-prefetch={prefetch === undefined ? "default" : String(prefetch)} />
  ),
}))

const mockUseCurrentUser = jest.fn()

jest.mock("@/hooks/use-api", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

describe("Header auth links", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReturnValue({ user: null, isLoading: false })
  })

  afterEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
  })

  it.each([
    ["anonymous users", { user: null, isLoading: false }, "/"],
    [
      "participants",
      {
        user: {
          id: 18,
          username: "debater",
          firstName: "Debate",
          lastName: "Participant",
          role: Role.PARTICIPANT,
        },
        isLoading: false,
      },
      "/dashboard",
    ],
    [
      "organizers",
      {
        user: {
          id: 17,
          username: "organizer",
          firstName: "Tour",
          lastName: "Director",
          role: Role.ORGANIZER,
        },
        isLoading: false,
      },
      "/organizer",
    ],
    ["loading auth state", { user: null, isLoading: true }, "/"],
    [
      "failed auth state",
      {
        user: undefined,
        isLoading: false,
        error: new Error("current user request failed"),
      },
      "/",
    ],
  ] as const)("links the DB logo correctly for %s", (_state, currentUser, expectedHref) => {
    mockUseCurrentUser.mockReturnValue(currentUser)

    render(<Header />)

    expect(screen.getByRole("link", { name: "DB" })).toHaveAttribute("href", expectedHref)
  })

  it("disables auth prefetching while preserving hrefs and default behavior elsewhere", () => {
    render(<Header />)

    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute("href", "/auth?mode=login")
    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute("data-prefetch", "false")
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/auth?mode=register")
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("data-prefetch", "false")

    for (const name of ["DB", "Join Debates", "Host Debate", "Rating", "News"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("data-prefetch", "default")
    }
  })

  it("switches the shared navigation to Russian", () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>,
    )

    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "ru" },
    })

    expect(screen.getByRole("link", { name: "Участвовать в дебатах" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Войти" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Язык" })).toHaveValue("ru")
  })

  it("gives authenticated organizers persistent access to My Tournaments", () => {
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: 17,
        username: "organizer",
        firstName: "Tour",
        lastName: "Director",
        role: Role.ORGANIZER,
      },
      isLoading: false,
    })

    render(<Header />)

    expect(screen.getByRole("link", { name: "My Tournaments" })).toHaveAttribute(
      "href",
      "/my-tournaments",
    )
    expect(screen.getByRole("link", { name: "Browse Debates" })).toHaveAttribute("href", "/join")
    expect(screen.getByRole("link", { name: "Host Debate" })).toHaveAttribute("href", "/create-tournament")
  })

  it("does not offer tournament hosting to participants", () => {
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: 18,
        username: "debater",
        firstName: "Debate",
        lastName: "Participant",
        role: Role.PARTICIPANT,
      },
      isLoading: false,
    })

    render(<Header />)

    expect(screen.getByRole("link", { name: "Join Debates" })).toHaveAttribute("href", "/join")
    expect(screen.queryByRole("link", { name: "Host Debate" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "My Tournaments" })).toHaveAttribute("href", "/my-tournaments")
  })

  it("waits for the user role before rendering tournament actions", () => {
    mockUseCurrentUser.mockReturnValue({ user: null, isLoading: true })

    render(<Header />)

    expect(screen.queryByRole("link", { name: "Join Debates" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Host Debate" })).not.toBeInTheDocument()
  })

  it("fails closed when the current role cannot be loaded", () => {
    mockUseCurrentUser.mockReturnValue({
      user: undefined,
      isLoading: false,
      error: new Error("current user request failed"),
    })

    render(<Header />)

    expect(screen.queryByRole("link", { name: "Join Debates" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Browse Debates" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Host Debate" })).not.toBeInTheDocument()
  })

  it.each([
    ["ru", "Мои турниры"],
    ["kk", "Менің турнирлерім"],
  ] as const)("localizes the organizer route in %s", (locale, label) => {
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: 17,
        username: "organizer",
        firstName: "Tour",
        lastName: "Director",
        role: Role.ORGANIZER,
      },
      isLoading: false,
    })

    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>,
    )

    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: locale },
    })

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      "/my-tournaments",
    )
  })
})
