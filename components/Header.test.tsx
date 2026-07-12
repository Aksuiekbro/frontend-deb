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

    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute("href", "/auth?mode=login")
    expect(screen.getByRole("link", { name: "Log In" })).toHaveAttribute("data-prefetch", "false")
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/auth?mode=register")
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("data-prefetch", "false")

    for (const name of ["DB", "Join Debates", "Host Debate", "Rating", "News"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("data-prefetch", "default")
    }
  })
})
