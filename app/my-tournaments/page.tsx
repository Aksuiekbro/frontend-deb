"use client"

import { MapPin, Calendar } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTournaments } from "../../hooks/use-api"
import { toBackendDateTime } from "@/lib/datetime"
import { resolveMediaUrl } from "@/lib/media"
import { LoadingState, CardSkeleton } from "../../components/ui/loading"
import { ErrorState, EmptyState } from "../../components/ui/error"
import Footer from "@/components/Footer"

const getTagLabel = (tag: { name?: string } | string) => (typeof tag === "string" ? tag : tag.name ?? "")

export default function MyTournamentsPage() {
  const [activeTab, setActiveTab] = useState('Past')
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})

  // Get current date for filtering
  const currentDate = new Date().toISOString().split('T')[0]

  // API hooks for different tournament types
  const pastParams = { startDateTo: toBackendDateTime(currentDate) }
  const upcomingParams = { startDateFrom: toBackendDateTime(currentDate) }

  const { tournaments: pastTournaments, isLoading: loadingPast, error: errorPast } = useTournaments(
    pastParams,
    { page: 0, size: 20, sort: ['startDate,desc'] }
  )

  const { tournaments: upcomingTournaments, isLoading: loadingUpcoming, error: errorUpcoming } = useTournaments(
    upcomingParams,
    { page: 0, size: 20, sort: ['startDate,asc'] }
  )

  // For ongoing tournaments, we'll use a broader date range and filter in frontend
  const { tournaments: allTournaments, isLoading: loadingAll, error: errorAll } = useTournaments(
    undefined,
    { page: 0, size: 50, sort: ['startDate,desc'] }
  )

  // Filter for ongoing tournaments (started but not yet ended)
  const ongoingTournaments = allTournaments?.content.filter(tournament => {
    const startDate = new Date(tournament.startDate)
    const endDate = new Date(tournament.endDate || tournament.startDate)
    const now = new Date()
    return startDate <= now && endDate >= now
  }) || []

  // Get current data based on active tab
  const getCurrentTournaments = () => {
    switch (activeTab) {
      case 'Past':
        return { tournaments: pastTournaments?.content || [], isLoading: loadingPast, error: errorPast }
      case 'Ongoing':
        return { tournaments: ongoingTournaments, isLoading: loadingAll, error: errorAll }
      case 'Upcoming':
        return { tournaments: upcomingTournaments?.content || [], isLoading: loadingUpcoming, error: errorUpcoming }
      default:
        return { tournaments: [], isLoading: false, error: null }
    }
  }

  const { tournaments, isLoading, error } = getCurrentTournaments()

  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 45%' }}>
        <img src="/images/senate/greek-overlook.jpg" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
      {/* Page Title */}
      <section className="px-12 py-8 db-container">
        <h1 className="home-heading font-bold mb-8 font-[var(--db-font-display)]" style={{ fontSize: 'clamp(32px,5vw,48px)' }}>My Tournaments</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1" style={{ borderBottom: '1px solid var(--db-border)', marginBottom: 32 }}>
          {['Past', 'Ongoing', 'Upcoming'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-3 text-[18px] font-medium transition-colors"
              style={{
                borderBottom: `2px solid ${activeTab === tab ? 'var(--db-accent)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--db-fg)' : 'var(--db-muted)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="px-12 pb-16 db-container">
        {/* Tournament Cards */}
        <LoadingState
          isLoading={isLoading}
          fallback={
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {error ? (
            <ErrorState
              error={error}
              onRetry={() => window.location.reload()}
              message={`Failed to load ${activeTab.toLowerCase()} tournaments`}
              onBackdrop
            />
          ) : tournaments.length > 0 ? (
            <div className="space-y-6">
              {tournaments.map((tournament) => {
                const formattedDate = new Date(tournament.startDate).toLocaleDateString('en-GB')

                return (
                  <div key={tournament.id} className="db-card-dark">
                    {/* Tournament Info */}
                    <div className="flex items-start mb-6">
                      <div className="w-[150px] h-[150px] bg-white rounded-full mr-6 overflow-hidden flex-shrink-0 relative">
                        {tournament.imageUrl && !imageErrors[tournament.id] ? (
                          <Image
                            src={resolveMediaUrl(tournament.imageUrl.url) ?? tournament.imageUrl.url}
                            alt={`${tournament.name} tournament logo - debate competition in ${tournament.location}`}
                            width={150}
                            height={150}
                            className="w-full h-full object-cover"
                            onError={() => setImageErrors(prev => ({ ...prev, [tournament.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="debate-card__title">{tournament.name}</p>
                        <div className="debate-card__meta space-y-1 mb-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{tournament.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                        <div className="debate-card__tags" style={{ margin: '0 0 4px' }}>
                          {tournament.tags.map((tag, index) => (
                            <span key={index} className="db-tag">{getTagLabel(tag)}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="debate-card__meta mb-4" style={{ lineHeight: 1.6 }}>
                      {tournament.description}
                    </p>

                    {/* Tournament Stats */}
                    <div className="debate-card__meta flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span>Teams: {tournament.currentTeamCount}/{tournament.maxTeamCount}</span>
                      <span>Status: {tournament.status}</span>
                      <span>Format: {tournament.debateFormat}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex space-x-4">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                          tournament.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          tournament.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tournament.status}
                        </span>
                      </div>
                      <Link
                        href={`/tournament/${tournament.id}`}
                        className="db-btn db-btn-primary"
                      >
                        Show Details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title={`No ${activeTab.toLowerCase()} tournaments`}
              description={`You haven't ${activeTab === 'Upcoming' ? 'registered for any upcoming' : activeTab === 'Ongoing' ? 'participated in any ongoing' : 'participated in any'} tournaments yet.`}
              actionText="Browse Tournaments"
              actionHref="/tournaments"
              onBackdrop
            />
          )}
        </LoadingState>
      </div>
      </main>

      <Footer />
    </>
  )
}
