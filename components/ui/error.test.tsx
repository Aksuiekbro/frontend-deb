/**
 * @jest-environment jsdom
 */
import type { ComponentPropsWithoutRef } from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import { EmptyState, ErrorState } from "./error"
import { LocaleProvider } from "@/lib/i18n"

type MockLinkProps = ComponentPropsWithoutRef<"a"> & { prefetch?: boolean }

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ prefetch, ...props }: MockLinkProps) => (
    <a {...props} data-prefetch={prefetch === undefined ? "default" : String(prefetch)} />
  ),
}))

describe("EmptyState action links", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("forwards an explicit auth prefetch override", () => {
    render(
      <EmptyState
        title="Welcome"
        description="Sign in to continue"
        actionText="Login"
        actionHref="/auth?mode=login"
        prefetch={false}
      />,
    )

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/auth?mode=login")
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("data-prefetch", "false")
  })

  it("keeps default prefetch behavior for non-auth action links", () => {
    render(
      <EmptyState
        title="No tournaments"
        description="Browse available tournaments"
        actionText="Browse"
        actionHref="/tournaments"
      />,
    )

    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/tournaments")
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("data-prefetch", "default")
  })

  it("localizes the shared error heading and retry action", () => {
    window.localStorage.setItem("debetter-locale", "kk")

    render(
      <LocaleProvider>
        <ErrorState onRetry={jest.fn()} />
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", { name: "Қате орын алды" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Қайталап көру" })).toBeInTheDocument()
  })
})
