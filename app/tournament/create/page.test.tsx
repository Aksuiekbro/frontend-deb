/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import TournamentCreatePage from "./page"
import { LocaleProvider, type Locale, useLocale } from "@/lib/i18n"

// Keep this route-level test focused on the wrapper: HostDebate owns the form
// strings and this probe verifies that the shared locale context reaches it.
jest.mock("@/components/host/HostDebate", () => {
  const ReactModule = jest.requireActual<typeof import("react")>("react")
  const { useLocale: readLocale } = jest.requireActual<typeof import("@/lib/i18n")>("@/lib/i18n")

  return {
    __esModule: true,
    default: function HostDebateLocaleProbe() {
      const { locale } = readLocale()
      return ReactModule.createElement("div", { "data-testid": "host-debate", "data-locale": locale })
    },
  }
})

function LocaleHarness({ locale }: { locale: Locale }) {
  const { setLocale } = useLocale()

  React.useEffect(() => {
    setLocale(locale)
  }, [locale, setLocale])

  return null
}

describe("TournamentCreatePage localization", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it.each([["ru"], ["kk"]] as const)("passes the %s locale through to HostDebate", async (locale) => {
    render(
      <LocaleProvider>
        <LocaleHarness locale={locale} />
        <TournamentCreatePage />
      </LocaleProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("host-debate")).toHaveAttribute("data-locale", locale)
    })
  })
})
