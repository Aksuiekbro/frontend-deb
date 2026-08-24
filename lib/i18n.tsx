"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export const locales = ["en", "ru", "kk"] as const

export type Locale = (typeof locales)[number]
export type TranslationCatalog = Record<Locale, Record<string, string>>
export type TranslationValues = Record<string, string | number>

const STORAGE_KEY = "debetter-locale"

export const localeLabels: Record<Locale, string> = {
  en: "🇺🇸 English",
  ru: "🇷🇺 Русский",
  kk: "🇰🇿 Қазақша",
}

export const localeTags: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  kk: "kk-KZ",
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => undefined,
})

function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale)
}

function browserLocale(): Locale {
  const savedLocale = window.localStorage.getItem(STORAGE_KEY)
  if (isLocale(savedLocale)) return savedLocale

  const language = window.navigator.language.toLowerCase()
  if (language.startsWith("ru")) return "ru"
  if (language.startsWith("kk") || language.startsWith("kz")) return "kk"
  return "en"
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    setLocaleState(browserLocale())
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

function interpolate(message: string, values?: TranslationValues) {
  if (!values) return message

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message,
  )
}

export function useTranslations(catalog: TranslationCatalog) {
  const { locale } = useLocale()

  return useCallback(
    (key: string, values?: TranslationValues) => {
      const message = catalog[locale][key] ?? catalog.en[key] ?? key
      return interpolate(message, values)
    },
    [catalog, locale],
  )
}
