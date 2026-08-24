"use client"

import { useNews } from "../../hooks/use-api"
import { LoadingState, CardSkeleton } from "../../components/ui/loading"
import { EmptyState } from "../../components/ui/error"
import Link from "next/link"
import { resolveMediaUrl } from "@/lib/media"
import { AlertCircle, RefreshCw } from "lucide-react"
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"

const translations: TranslationCatalog = {
  en: {
    pastDebates: "Past debates",
    failedNews: "Failed to load news",
    errorHeading: "Oops! Something went wrong",
    tryAgain: "Try again",
    readMore: "Read more about this tournament...",
    by: "By: {name}",
    admin: "Admin",
    noNews: "No news available",
    noNewsDescription: "Check back later for the latest tournament news and updates",
  },
  ru: {
    pastDebates: "Прошедшие дебаты",
    failedNews: "Не удалось загрузить новости",
    errorHeading: "Ой! Что-то пошло не так",
    tryAgain: "Попробовать снова",
    readMore: "Подробнее об этом турнире...",
    by: "Автор: {name}",
    admin: "Администратор",
    noNews: "Новостей пока нет",
    noNewsDescription: "Зайдите позже, чтобы узнать последние новости и обновления турниров",
  },
  kk: {
    pastDebates: "Өткен пікірсайыстар",
    failedNews: "Жаңалықтарды жүктеу мүмкін болмады",
    errorHeading: "Қап! Бірдеңе дұрыс болмады",
    tryAgain: "Қайталап көру",
    readMore: "Бұл турнир туралы толығырақ оқыңыз...",
    by: "Авторы: {name}",
    admin: "Әкімші",
    noNews: "Жаңалықтар жоқ",
    noNewsDescription: "Турнирлердің соңғы жаңалықтары мен жаңартуларын кейінірек тексеріңіз",
  },
}

function NewsErrorState({ message, onRetry, heading, retryLabel }: {
  message: string
  onRetry: () => void
  heading: string
  retryLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-[#0D1321] mb-2">{heading}</h3>
      <p className="text-[#4a4e69] text-center mb-4 max-w-md">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        aria-label={retryLabel}
        className="inline-flex items-center space-x-2 bg-[#3E5C76] text-white px-4 py-2 rounded-lg hover:bg-[#22223b] text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        <span>{retryLabel}</span>
      </button>
    </div>
  )
}

export default function NewsPage() {
  const { locale } = useLocale()
  const t = useTranslations(translations)

  // News is ordered by its publish time. The backend entity field is `timestamp`
  // (there is no `createdAt` on News — sorting by it makes the API reject the request).
  const { news, isLoading, error } = useNews(undefined, { page: 0, size: 12, sort: ['timestamp,desc'] })
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">

      {/* Main Content */}
      <div className="relative px-8 py-12">
          {/* Background Text */}
        <div className="relative">
          <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
            {t("pastDebates")}
          </h3>

          {/* News Cards */}
          <div className="relative z-10 pt-32">
            <LoadingState
              isLoading={isLoading}
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <CardSkeleton key={index} />
                  ))}
                </div>
              }
            >
              {error ? (
                <NewsErrorState
                  heading={t("errorHeading")}
                  retryLabel={t("tryAgain")}
                  onRetry={() => window.location.reload()}
                  message={t("failedNews")}
                />
              ) : news && news.content.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {news.content.map((newsItem, index) => {
                    const gradients = [
                      'from-orange-600 to-red-700',
                      'from-green-600 to-teal-700',
                      'from-blue-600 to-indigo-700',
                      'from-purple-600 to-pink-700',
                      'from-indigo-600 to-blue-700',
                      'from-red-600 to-orange-700',
                    ]
                    const gradient = gradients[index % gradients.length]

                    return (
                      <Link key={newsItem.id} href={`/news/${newsItem.id}`}>
                        <div className="bg-white rounded-[16px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                          <div className={`h-[200px] bg-gradient-to-br ${gradient} relative`}>
                            {newsItem.thumbnailUrl && (
                              <img
                                src={resolveMediaUrl(newsItem.thumbnailUrl.url)}
                                alt={newsItem.title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                            <div className="absolute bottom-4 left-4 text-white">
                              <h3 className="text-[32px] font-semibold mb-2">{newsItem.title}</h3>
                              {newsItem.tags && newsItem.tags.length > 0 && (
                                <p className="text-[16px] opacity-90">
                                  {newsItem.tags.map(tag => tag.name).join(', ')}
                                </p>
                              )}
                              <p className="text-[16px] opacity-90">
                                {new Date(newsItem.timestamp).toLocaleDateString(localeTags[locale])}
                              </p>
                            </div>
                          </div>
                          <div className="p-6">
                            <p className="text-[14px] text-[#4a4e69] mb-2 line-clamp-3">
                              {newsItem.content || t("readMore")}
                            </p>
                            <div className="flex justify-between text-[12px] text-[#9a8c98]">
                              <span>{t("by", { name: newsItem.user.username || t("admin") })}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  title={t("noNews")}
                  description={t("noNewsDescription")}
                />
              )}
            </LoadingState>
          </div>
        </div>
      </div>
    </div>
  )
}
