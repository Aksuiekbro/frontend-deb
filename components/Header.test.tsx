/**
 * @jest-environment jsdom
 */
import type { ComponentPropsWithoutRef } from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Header from "./Header"

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
  })

  it("disables auth prefetching while preserving hrefs and default behavior elsewhere", () => {
    render(<Header />)

    // Nav links and the Log In / Register actions each render twice — once
    // in the desktop header, once in the mobile drawer (same links, not a
    // duplicate copy of state) — so assert every instance is correct.
    const loginLinks = screen.getAllByRole("link", { name: "Log In" })
    expect(loginLinks.length).toBeGreaterThan(0)
    loginLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/auth?mode=login")
      expect(link).toHaveAttribute("data-prefetch", "false")
    })

    const registerLinks = screen.getAllByRole("link", { name: "Register" })
    expect(registerLinks.length).toBeGreaterThan(0)
    registerLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/auth?mode=register")
      expect(link).toHaveAttribute("data-prefetch", "false")
    })

    expect(screen.getByRole("link", { name: "DeBetter" })).toHaveAttribute("data-prefetch", "default")
    for (const name of ["Join Debates", "Host Debate", "Rating", "News"]) {
      const links = screen.getAllByRole("link", { name })
      expect(links.length).toBeGreaterThan(0)
      links.forEach((link) => expect(link).toHaveAttribute("data-prefetch", "default"))
    }
  })
})
