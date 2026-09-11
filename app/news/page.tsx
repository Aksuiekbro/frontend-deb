"use client"

import { useNews } from "../../hooks/use-api"
import { LoadingState, CardSkeleton } from "../../components/ui/loading"
import { ErrorState, EmptyState } from "../../components/ui/error"
import Link from "next/link"
import { resolveMediaUrl } from "@/lib/media"
import Footer from "@/components/Footer"

export default function NewsPage() {
  // News is ordered by its publish time. The backend entity field is `timestamp`
  // (there is no `createdAt` on News — sorting by it makes the API reject the request).
  const { news, isLoading, error } = useNews(undefined, { page: 0, size: 12, sort: ['timestamp,desc'] })
  return (
    <div style={{ background: 'var(--db-bg)' }}>
      {/* Header band only -- a full backdrop here would compete with the
          news cards' own colored gradient thumbnails below. */}
      <section className="db-hero" style={{ height: 220, isolation: 'isolate' }}>
        <div className="db-page-backdrop" aria-hidden="true" style={{ position: 'absolute', ['--db-backdrop-focal' as string]: '50% 55%' }}>
          <img src="/images/senate/golden-harbor.jpg" alt="" />
          <div className="db-page-backdrop__scrim" />
        </div>
        <div className="db-hero__content db-container" style={{ paddingBottom: 28 }}>
          <h1 className="db-hero__title" style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Past Debates</h1>
        </div>
      </section>

      <main id="main" style={{ background: 'var(--db-bg)' }}>
        {/* Main Content */}
        <div className="px-8 py-12 db-container">
          <LoadingState
            isLoading={isLoading}
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            }
          >
            {error ? (
              <ErrorState
                error={error}
                onRetry={() => window.location.reload()}
                message="Failed to load news"
              />
            ) : news && news.content.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                      <div className="db-panel overflow-hidden cursor-pointer" style={{ transition: 'box-shadow .15s var(--db-ease)' }}>
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
                            <h3 className="text-[28px] font-semibold mb-2 font-[var(--db-font-display)]">{newsItem.title}</h3>
                            {newsItem.tags && newsItem.tags.length > 0 && (
                              <p className="text-[16px] opacity-90">
                                {newsItem.tags.map(tag => tag.name).join(', ')}
                              </p>
                            )}
                            <p className="text-[16px] opacity-90">
                              {new Date(newsItem.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-[14px] mb-2 line-clamp-3" style={{ color: 'var(--db-fg)' }}>
                            {newsItem.content || 'Read more about this tournament...'}
                          </p>
                          <div className="flex justify-between text-[12px]" style={{ color: 'var(--db-muted)' }}>
                            <span>By: {newsItem.user.username || 'Admin'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="No news available"
                description="Check back later for the latest tournament news and updates"
              />
            )}
          </LoadingState>
        </div>
      </main>

      {/* This page has no full-page backdrop for the footer's transparent
          Senate style to show through, so force a solid band like Classic. */}
      <div style={{ background: 'var(--db-surface)' }}>
        <Footer />
      </div>
    </div>
  )
}
