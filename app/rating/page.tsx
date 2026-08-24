"use client"

import { useEffect, useState } from "react"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const translations: TranslationCatalog = {
  en: {
    leaderboard: "Leaderboard",
    champions: "Champions",
    leaderboardComingSoon: "Leaderboard coming soon",
  },
  ru: {
    leaderboard: "Таблица лидеров",
    champions: "Чемпионы",
    leaderboardComingSoon: "Таблица лидеров скоро появится",
  },
  kk: {
    leaderboard: "Көшбасшылар тақтасы",
    champions: "Чемпиондар",
    leaderboardComingSoon: "Көшбасшылар тақтасы жақында пайда болады",
  },
}

export default function RatingPage() {
  const t = useTranslations(translations)
  const [animateGradients, setAnimateGradients] = useState(false)

  // Leaderboard disabled: backend has no rating field

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateGradients(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">

      {/* Leader Board (disabled) */}
      <section className="px-8 py-12" aria-label={t("leaderboard")}>
        <div className="relative">
          <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
            {t("champions")}
          </h3>
          <div className="relative z-10 pt-32 w-[90%] mx-auto text-center">
            <p className="text-[#4a4e69] text-[18px]">{t("leaderboardComingSoon")}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
