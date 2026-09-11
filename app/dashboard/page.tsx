"use client"

import Link from "next/link"
import { useCurrentUser, useUpcomingTournaments, useTournaments } from "../../hooks/use-api"
import { LoadingState, CardSkeleton, LoadingSpinner } from "../../components/ui/loading"
import { ErrorState, EmptyState } from "../../components/ui/error"
import { resolveMediaUrl } from "@/lib/media"
import Footer from "@/components/Footer"

const getTagLabel = (tag: { name?: string } | string) => (typeof tag === "string" ? tag : tag.name ?? "")

export default function Dashboard() {
  // API hooks
  const { user: currentUser, isLoading: userLoading, error: userError } = useCurrentUser()
  const { upcomingTournaments, isLoading: upcomingLoading, error: upcomingError } = useUpcomingTournaments(6)

  // Get past tournaments
  const currentDate = new Date().toISOString().slice(0,19)
  const { tournaments: pastTournamentsData, isLoading: pastLoading, error: pastError } = useTournaments(
    { startDateTo: currentDate },
    { page: 0, size: 6, sort: ['startDate,desc'] }
  )

  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 40%' }}>
        <img src="/images/senate/fortress-harbor.jpg" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
      {/* Hero Section with User Welcome */}
      <section className="text-center py-8">
        <LoadingState
          isLoading={userLoading}
          fallback={<div className="h-16 bg-[var(--db-border)] animate-pulse mx-8 rounded"></div>}
        >
          {userError ? (
            <h1 className="home-heading text-3xl sm:text-4xl font-bold mb-8 font-[var(--db-font-display)]" style={{ fontSize: 'clamp(32px,6vw,56px)' }}>Welcome to DeBetter</h1>
          ) : (
            <h1 className="home-heading font-bold mb-8 font-[var(--db-font-display)] px-4" style={{ fontSize: 'clamp(32px,6vw,56px)' }}>
              Welcome back, {currentUser?.firstName || 'User'}!
            </h1>
          )}
        </LoadingState>

        <div className="home-hero-slide rounded-[16px] mx-8 py-16 px-8 relative">
          <h2 className="text-white font-semibold mb-8 font-[var(--db-font-display)]" style={{ fontSize: 'clamp(26px,4.5vw,46px)' }}>
            <span className="text-[var(--db-accent)]">DeBetter</span> - website for{" "}
            <span className="text-[var(--db-accent)]">debates</span> organisation
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4 mb-8">
            <Link href="/join" className="db-btn db-btn-primary">
              Join Debates
            </Link>
            <Link href="/create-tournament" className="db-btn db-btn-ghost-on-dark">
              Host Debate
            </Link>
          </div>

          {/* Pagination dots (decorative) */}
          <div className="flex justify-center space-x-2">
            <div className="w-[8px] h-[8px] bg-white/40 rounded-full"></div>
            <div className="w-[8px] h-[8px] bg-white rounded-full"></div>
            <div className="w-[8px] h-[8px] bg-white/40 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* User Welcome Back Section */}
      <section className="px-8 py-8 db-container">
        <div className="home-hero-slide rounded-[16px] p-8 relative overflow-hidden">
          <div className="relative z-10">
            <LoadingState
              isLoading={userLoading}
            fallback={<LoadingSpinner size="lg" />}
            >
              {userError ? (
                <ErrorState
                  error={userError}
                  onRetry={() => window.location.reload()}
                  message="Failed to load user profile"
                  onDark
                />
              ) : currentUser ? (
                <>
                  <div className="flex items-center space-x-4 mb-6">
                    {currentUser.imageUrl ? (
                      <img
                        src={resolveMediaUrl(currentUser.imageUrl.url)}
                        alt={`${currentUser.firstName} ${currentUser.lastName} profile`}
                        className="w-16 h-16 rounded-full object-cover border-[3px] border-[var(--db-accent)]"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[var(--db-accent)] rounded-full flex items-center justify-center text-[var(--db-accent-fg)] font-bold text-lg">
                        {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                      </div>
                    )}
                    <h3 className="text-white text-[36px] font-semibold font-[var(--db-font-display)]">
                      Welcome Back <span className="text-[var(--db-accent)]">{currentUser.firstName} {currentUser.lastName}!</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-8">
                    <Link href={`/profile/${currentUser.id}`} className="db-btn db-btn-primary">
                      My Profile
                    </Link>
                    <Link href="/my-tournaments" className="db-btn db-btn-ghost-on-dark">
                      My Tournaments
                    </Link>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-white text-[24px] font-medium mb-4 font-[var(--db-font-display)]">Your Stats</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                        </div>
                        <div>
                          <div className="text-white text-[20px] font-medium">{currentUser.tournamentsParticipated || 0}</div>
                          <div className="text-white/60 text-[14px]">Tournaments</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                        </div>
                        <div>
                          <div className="text-white text-[20px] font-medium">{upcomingTournaments?.content?.length || 0}</div>
                          <div className="text-white/60 text-[14px]">Upcoming</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                        </div>
                        <div>
                          <div className="text-white text-[20px] font-medium">{currentUser.rating || 0}</div>
                          <div className="text-white/60 text-[14px]">Rating</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                          <div className="w-6 h-6 bg-[var(--db-accent)] rounded"></div>
                        </div>
                        <div>
                          <div className="text-white text-[20px] font-medium">-</div>
                          <div className="text-white/60 text-[14px]">Ranking</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Welcome to DeBetter!"
                  description="Please log in to view your personalized dashboard"
                  actionText="Login"
                  actionHref="/auth?mode=login"
                  prefetch={false}
                  onDark
                />
              )}
            </LoadingState>
          </div>
        </div>
      </section>

      {/* Upcoming Debates */}
      <section className="px-8 py-12 db-container">
        <div className="db-panel content-panel">
        <h3 className="section-title">Upcoming Debates</h3>

        <LoadingState
          isLoading={upcomingLoading}
          fallback={
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2].map(i => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {upcomingError ? (
            <ErrorState
              error={upcomingError}
              onRetry={() => window.location.reload()}
              message="Failed to load upcoming tournaments"
            />
          ) : upcomingTournaments && upcomingTournaments.content.length > 0 ? (
            <div className="debate-rail">
              {upcomingTournaments.content.slice(0, 2).map((tournament) => {
                const formattedDate = new Date(tournament.startDate).toLocaleDateString('en-GB')

                return (
                  <div key={tournament.id} className="db-card-dark min-w-0">
                    <p className="debate-card__title">{tournament.name}</p>
                    <p className="debate-card__meta">{tournament.location}</p>
                    <p className="debate-card__meta">{formattedDate}</p>

                    <div className="debate-card__tags">
                      {tournament.tags.map((tag, index) => (
                        <span key={index} className="db-tag">{getTagLabel(tag)}</span>
                      ))}
                    </div>

                    <div className="row gap-md" style={{ flexWrap: 'wrap' }}>
                      <Link href={`/tournament/${tournament.id}`} className="db-btn db-btn-ghost-on-dark">
                        More...
                      </Link>
                      <Link href="/join" className="db-btn db-btn-primary">
                        Join Debates
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="No upcoming tournaments"
              description="Check back later for new tournaments to join"
              actionText="Browse All Tournaments"
              actionHref="/tournaments"
            />
          )}
        </LoadingState>
        </div>
      </section>

      {/* Past Debates Section */}
      <section className="px-8 py-12 db-container">
        <div className="db-card-dark relative overflow-hidden" style={{ padding: 32 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <h3 className="text-[var(--db-accent)] text-[80px] sm:text-[120px] font-bold opacity-30 select-none font-[var(--db-font-display)]">
              Past debates
            </h3>
          </div>

          <div className="relative z-10">
            <LoadingState
              isLoading={pastLoading}
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-[var(--db-border)] animate-pulse rounded-[12px] h-48"></div>
                  ))}
                </div>
              }
            >
              {pastError ? (
                <ErrorState
                  error={pastError}
                  onRetry={() => window.location.reload()}
                  message="Failed to load past tournaments"
                  onDark
                />
              ) : pastTournamentsData && pastTournamentsData.content.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pastTournamentsData.content.slice(0, 3).map((tournament, index) => {
                    const gradients = [
                      'from-orange-500 to-red-600',
                      'from-green-500 to-teal-600',
                      'from-purple-500 to-blue-600',
                      'from-pink-500 to-rose-600',
                      'from-blue-500 to-indigo-600',
                      'from-yellow-500 to-orange-600'
                    ]
                    const gradient = gradients[index % gradients.length]
                    const formattedDate = new Date(tournament.startDate).toLocaleDateString('en-GB')

                    return (
                      <div key={tournament.id} className={`bg-gradient-to-br ${gradient} rounded-[12px] p-6 h-48 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        <div className="relative z-10">
                          <h4 className="text-white text-[24px] font-semibold mb-2">{tournament.name}</h4>
                          <p className="text-white/80 text-[14px] mb-1">{tournament.location}</p>
                          <p className="text-white/80 text-[14px] mb-4">{formattedDate}</p>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex flex-wrap gap-1 mb-4">
                              <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Format: {tournament.debateFormat}</span>
                              <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Teams: {tournament.currentTeamCount}</span>
                            </div>
                            <Link
                              href={`/tournament/${tournament.id}`}
                              className="text-white underline hover:text-white/80 text-[12px]"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No past tournaments"
                  description="Your tournament history will appear here"
                  actionText="Join a Tournament"
                  actionHref="/tournaments"
                  onDark
                />
              )}
            </LoadingState>
          </div>
        </div>
      </section>

      {/* Testimonials (Leaderboard disabled) */}
      <section className="px-8 py-12 db-container">
        <h3 className="home-heading font-[var(--db-font-display)] mb-7" style={{ fontSize: 32 }}>Community Highlights</h3>
        <div className="db-panel text-center" style={{ padding: '32px 24px' }}>
          <p className="text-[16px] text-[var(--db-fg)]">Community highlights will appear here as users participate in tournaments</p>
        </div>
      </section>

      {/* Leader Board (disabled) */}
      <section className="px-8 py-12 db-container">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <h3 className="home-heading font-[var(--db-font-display)]" style={{ fontSize: 32 }}>Leader Board</h3>
          <Link href="/rating" className="home-sub underline text-[16px]">
            View Full Leaderboard
          </Link>
        </div>
        <div className="db-panel text-center" style={{ padding: '64px 24px' }}>
          <p className="text-[16px] text-[var(--db-fg)]">Leaderboard is disabled until ratings are supported.</p>
        </div>
      </section>
      </main>

      <Footer />
    </>
  )
}
