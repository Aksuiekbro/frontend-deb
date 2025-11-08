"use client"

import Header from "../../components/Header"
import { useNews } from "../../hooks/use-api"
import { LoadingState, CardSkeleton } from "../../components/ui/loading"
import { ErrorState, EmptyState } from "../../components/ui/error"
import Link from "next/link"

export default function NewsPage() {
  const { news, isLoading, error } = useNews(undefined, { page: 0, size: 12, sort: ['createdAt,desc'] })
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Main Content */}
      <div className="relative px-8 py-12">
        {/* Background Text */}
        <div className="relative">
          <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
            Past debates
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
                <ErrorState
                  error={error}
                  onRetry={() => window.location.reload()}
                  message="Failed to load news"
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
                                src={newsItem.thumbnailUrl.url}
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
                                {new Date(newsItem.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="p-6">
                            <p className="text-[14px] text-[#4a4e69] mb-2 line-clamp-3">
                              {newsItem.content || 'Read more about this tournament...'}
                            </p>
                            <div className="flex justify-between text-[12px] text-[#9a8c98]">
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
        </div>
      </div>
    </div>
  )
} 