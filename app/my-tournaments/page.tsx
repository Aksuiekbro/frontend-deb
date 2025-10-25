"use client"

import { MapPin, Calendar } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import Header from "../../components/Header"
import { useTournaments } from "../../hooks/use-api"
import { LoadingState, TournamentCardSkeleton } from "../../components/ui/loading"
import { ErrorState, EmptyState } from "../../components/ui/error"


export default function MyTournamentsPage() {
  const [activeTab, setActiveTab] = useState('Past')
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})

  // Get current date for filtering
  const currentDate = new Date().toISOString().split('T')[0]

  // API hooks for different tournament types
  const pastParams = { startDateTo: currentDate }
  const upcomingParams = { startDateFrom: currentDate }

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
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Page Title */}
      <section className="px-12 py-8">
        <h1 className="text-[#0D1321] text-[48px] font-bold mb-8">My Tournaments</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-8">
          {['Past', 'Ongoing', 'Upcoming'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-[#0D1321] border-[#0D1321]'
                  : 'text-[#9a8c98] border-transparent hover:text-[#4a4e69]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="px-12 pb-16">
        {/* Tournament Cards */}
        <LoadingState
          isLoading={isLoading}
          fallback={
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <TournamentCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {error ? (
            <ErrorState
              error={error}
              onRetry={() => window.location.reload()}
              message={`Failed to load ${activeTab.toLowerCase()} tournaments`}
            />
          ) : tournaments.length > 0 ? (
            <div className="space-y-6">
              {tournaments.map((tournament) => {
                const formattedDate = new Date(tournament.startDate).toLocaleDateString('en-GB')

                return (
                  <div key={tournament.id} className="bg-[#0D1321] rounded-[16px] p-8">
                    {/* Tournament Info */}
                    <div className="flex items-start mb-6">
                      <div className="w-[150px] h-[150px] bg-[#FFFFFF] rounded-full mr-6 overflow-hidden flex-shrink-0 relative">
                        {tournament.imageUrl && !imageErrors[tournament.id] ? (
                          <Image
                            src={tournament.imageUrl.url}
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
                        <h3 className="text-[#FFFFFF] text-[32px] font-medium mb-2">{tournament.name}</h3>
                        <div className="text-[#9a8c98] text-[16px] font-normal space-y-1 mb-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{tournament.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tournament.tags.map((tag, index) => (
                            <span key={index} className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#9a8c98] text-[16px] font-normal mb-4 leading-relaxed">
                      {tournament.description}
                    </p>

                    {/* Tournament Stats */}
                    <div className="flex items-center justify-between mb-4 text-[#9a8c98] text-[14px]">
                      <span>Teams: {tournament.currentTeamCount}/{tournament.maxTeamCount}</span>
                      <span>Status: {tournament.status}</span>
                      <span>Format: {tournament.debateFormat}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
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
                        className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal transition-colors"
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
            />
          )}
        </LoadingState>
      </div>
    </div>
  )
} 