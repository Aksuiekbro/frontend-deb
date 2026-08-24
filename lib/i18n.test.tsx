/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import { LocaleProvider, useLocale, useTranslations } from "./i18n"

const messages = {
  en: { greeting: "Hello, {name}!" },
  ru: { greeting: "Здравствуйте, {name}!" },
  kk: { greeting: "Сәлем, {name}!" },
}

function Harness() {
  const { locale, setLocale } = useLocale()
  const t = useTranslations(messages)

  return (
    <div>
      <p>{t("greeting", { name: "Aruzhan" })}</p>
      <output>{locale}</output>
      <button type="button" onClick={() => setLocale("ru")}>Russian</button>
    </div>
  )
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("switches translations and persists the selected locale", () => {
    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    )

    expect(screen.getByText("Hello, Aruzhan!")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Russian" }))

    expect(screen.getByText("Здравствуйте, Aruzhan!")).toBeInTheDocument()
    expect(screen.getByText("ru")).toBeInTheDocument()
    expect(window.localStorage.getItem("debetter-locale")).toBe("ru")
    expect(document.documentElement).toHaveAttribute("lang", "ru")
  })

  it("restores a persisted locale", () => {
    window.localStorage.setItem("debetter-locale", "kk")

    render(
      <LocaleProvider>
        <Harness />
      </LocaleProvider>,
    )

    expect(screen.getByText("Сәлем, Aruzhan!")).toBeInTheDocument()
    expect(screen.getByText("kk")).toBeInTheDocument()
  })
})
