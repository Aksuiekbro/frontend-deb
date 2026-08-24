"use client"

import type { PageResult } from "@/types/page"
import type { NewsResponse } from "@/types/news"
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: { heading: "Tournament News", add: "Add News", failed: "Failed to load news", posted: "Posted by", organizer: "Organizer", empty: "No news yet" },
  ru: { heading: "Новости турнира", add: "Добавить новость", failed: "Не удалось загрузить новости", posted: "Опубликовано", organizer: "Организатор", empty: "Новостей пока нет" },
  kk: { heading: "Турнир жаңалықтары", add: "Жаңалық қосу", failed: "Жаңалықтарды жүктеу мүмкін болмады", posted: "Жариялаған", organizer: "Ұйымдастырушы", empty: "Әзірге жаңалық жоқ" },
}

interface NewsSectionProps {
  news?: PageResult<NewsResponse>
  newsLoading: boolean
  newsError?: Error
  onAddNews?: () => void
}

export function NewsSection({ news, newsLoading, newsError, onAddNews }: NewsSectionProps) {
  const t = useTranslations(catalog)
  const { locale } = useLocale()
  return (
    <div className="py-8">
      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-[#0D1321] text-[32px] font-bold">{t("heading")}</h2>
          {onAddNews ? (
            <button
              onClick={onAddNews}
              className="px-6 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
            >
              {t("add")}
            </button>
          ) : null}
        </div>

        <div className="space-y-6">
          {newsLoading ? (
            <div className="space-y-4">
              <div className="h-28 bg-gray-100 rounded" />
              <div className="h-28 bg-gray-100 rounded" />
              <div className="h-28 bg-gray-100 rounded" />
            </div>
          ) : newsError ? (
            <div className="text-center text-red-500">{t("failed")}</div>
          ) : news && news.content.length > 0 ? (
            news.content.map((item) => {
              const dt = new Date(item.timestamp)
              const dateStr = dt.toLocaleDateString(localeTags[locale])
              const timeStr = dt.toLocaleTimeString(localeTags[locale], { hour: "2-digit", minute: "2-digit" })
              const authorName = item.user ? `${item.user.firstName} ${item.user.lastName ?? ""}`.trim() : t("organizer")

              return (
                <article key={item.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[#0D1321] text-[24px] font-bold mb-2">{item.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#9a8c98] text-[14px]">
                        <span>{t("posted")} {authorName}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">{item.content}</p>
                </article>
              )
            })
          ) : (
            <div className="text-center text-[#9a8c98]">{t("empty")}</div>
          )}
        </div>
      </div>
    </div>
  )
}
