"use client"

import type { PageResult } from "@/types/page"
import type { NewsResponse } from "@/types/news"

interface NewsSectionProps {
  news?: PageResult<NewsResponse>
  newsLoading: boolean
  newsError?: Error
  onAddNews: () => void
}

export function NewsSection({ news, newsLoading, newsError, onAddNews }: NewsSectionProps) {
  return (
    <div className="p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[#0D1321] text-[32px] font-bold">Tournament News</h2>
          <button
            onClick={onAddNews}
            className="px-6 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
          >
            Add News
          </button>
        </div>

        <div className="space-y-6">
          {newsLoading ? (
            <div className="space-y-4">
              <div className="h-28 bg-gray-100 rounded" />
              <div className="h-28 bg-gray-100 rounded" />
              <div className="h-28 bg-gray-100 rounded" />
            </div>
          ) : newsError ? (
            <div className="text-center text-red-500">Failed to load news</div>
          ) : news && news.content.length > 0 ? (
            news.content.map((item) => {
              const tags = (item.tags || []).map((tag) => tag.name)
              const category = tags.find((tag) => !tag.startsWith("tournament:")) || "Info"
              const badgeClass =
                category === "Important"
                  ? "bg-[#3E5C76] text-white"
                  : category === "Update"
                  ? "bg-[#9a8c98] text-white"
                  : "bg-green-500 text-white"

              const dt = new Date(item.timestamp)
              const dateStr = dt.toLocaleDateString()
              const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              const authorName = item.user ? `${item.user.firstName} ${item.user.lastName ?? ""}`.trim() : "Organizer"

              return (
                <article key={item.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[#0D1321] text-[24px] font-bold mb-2">{item.title}</h3>
                      <div className="flex items-center text-[#9a8c98] text-[14px] space-x-4">
                        <span>Posted by {authorName}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                    <span className={`${badgeClass} px-3 py-1 rounded-full text-[12px] font-medium`}>
                      {category}
                    </span>
                  </div>
                  <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">{item.content}</p>
                </article>
              )
            })
          ) : (
            <div className="text-center text-[#9a8c98]">No news yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
