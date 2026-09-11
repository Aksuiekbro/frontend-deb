"use client"

import type { PageResult } from "@/types/page"
import type { NewsResponse } from "@/types/news"

interface NewsSectionProps {
  news?: PageResult<NewsResponse>
  newsLoading: boolean
  newsError?: Error
  onAddNews?: () => void
}

export function NewsSection({ news, newsLoading, newsError, onAddNews }: NewsSectionProps) {
  return (
    <div className="py-8">
      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-[var(--db-fg)] text-[32px] font-bold">Tournament News</h2>
          {onAddNews ? (
            <button
              onClick={onAddNews}
              className="px-6 py-3 bg-[var(--db-accent)] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
            >
              Add News
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
            <div className="text-center text-red-500">Failed to load news</div>
          ) : news && news.content.length > 0 ? (
            news.content.map((item) => {
              const dt = new Date(item.timestamp)
              const dateStr = dt.toLocaleDateString()
              const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              const authorName = item.user ? `${item.user.firstName} ${item.user.lastName ?? ""}`.trim() : "Organizer"

              return (
                <article key={item.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[var(--db-fg)] text-[24px] font-bold mb-2">{item.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--db-input-border)] text-[14px]">
                        <span>Posted by {authorName}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[var(--db-muted)] text-[16px] leading-relaxed mb-4">{item.content}</p>
                </article>
              )
            })
          ) : (
            <div className="text-center text-[var(--db-input-border)]">No news yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
