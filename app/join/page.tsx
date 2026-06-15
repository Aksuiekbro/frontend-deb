"use client"

import { Search, MapPin, Calendar, Users, Filter, X } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Header from "../../components/Header"
import { api } from "@/lib/api"
import { SimpleTournamentResponse, TournamentGetParams, TournamentLeague } from "@/types/tournament/tournament"
import type { PageResult } from "@/types/page"
import type { ParticipantSelectorRequest, TeamRequest } from "@/types/tournament/team"

export default function JoinDebatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null)
  const [tournaments, setTournaments] = useState<SimpleTournamentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Registration form state
  const [teamName, setTeamName] = useState('')
  const [clubName, setClubName] = useState('')
  const [speakerOneUsername, setSpeakerOneUsername] = useState('')
  const [speakerTwoUsername, setSpeakerTwoUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Filter states
  const [startDateFrom, setStartDateFrom] = useState<string>("")
  const [startDateTo, setStartDateTo] = useState<string>("")
  const [registrationDeadlineFrom, setRegistrationDeadlineFrom] = useState<string>("")
  const [registrationDeadlineTo, setRegistrationDeadlineTo] = useState<string>("")
  const [searchLocation, setSearchLocation] = useState<string>("")
  const [selectedLeagues, setSelectedLeagues] = useState<TournamentLeague[]>([])
  const [searchName, setSearchName] = useState<string>("")
  const [nonFull, setNonFull] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>("startDate,desc") // Default to Most Recent

  // Fetch tournaments with all filter parameters
  const fetchTournaments = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const currentPage = reset ? 0 : page;
      const params: TournamentGetParams = {
        searchName: searchName || undefined,
        searchLocation: searchLocation || undefined,
        tags: undefined, // Add state for tags if you implement them in filters
        startDateFrom: startDateFrom || undefined,
        startDateTo: startDateTo || undefined,
        registrationDeadlineFrom: registrationDeadlineFrom || undefined,
        registrationDeadlineTo: registrationDeadlineTo || undefined,
        league: selectedLeagues.length > 0 ? selectedLeagues[0] : undefined, // Assuming single league filter for simplicity
        nonFull: nonFull || undefined,
      }
      
      const response = await api.getTournaments(params, { page: currentPage, size: 10, sort: sortBy }) // Pass all params directly
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: PageResult<SimpleTournamentResponse> = await response.json()

      if (reset) {
        setTournaments(data.content)
      } else {
        setTournaments((prevTournaments) => [...prevTournaments, ...data.content])
      }
      setHasMore(!data.last)
      setPage(currentPage + 1)
    } catch (error) {
      console.error("Failed to fetch tournaments:", error)
    } finally {
      setLoading(false)
    }
  }, [
      page, sortBy, searchName, searchLocation, startDateFrom, startDateTo,
      registrationDeadlineFrom, registrationDeadlineTo, selectedLeagues, nonFull
  ])

  useEffect(() => {
    fetchTournaments(true) // Initial load and when filters change
  }, [fetchTournaments]) // Depend on fetchTournaments to re-run when its dependencies change

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchTournaments()
    }
  }

  const handleLeagueChange = (league: TournamentLeague) => {
    setSelectedLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]
    )
  }

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTournamentId) {
      setRegistrationError('No tournament selected')
      return
    }

    if (!teamName.trim() || !clubName.trim()) {
      setRegistrationError('Team name and club name are required')
      return
    }

    setIsRegistering(true)
    setRegistrationError(null)

    try {
      const invitedParticipants: ParticipantSelectorRequest[] = []

      // Add speakers if usernames provided
      if (speakerOneUsername.trim()) {
        invitedParticipants.push({ username: speakerOneUsername.trim() })
      }
      if (speakerTwoUsername.trim()) {
        invitedParticipants.push({ username: speakerTwoUsername.trim() })
      }

      const payload: TeamRequest = {
        name: teamName.trim(),
        club: clubName.trim(),
        creatorId: 1, // TODO: Get current user ID from auth context
        invitedParticipants: invitedParticipants.length > 0 ? invitedParticipants : undefined,
      }

      const response = await api.registerTeam(selectedTournamentId, payload)

      if (!response.ok) {
        const errorData = await response.json()
        setRegistrationError(errorData.message || 'Registration failed')
        return
      }

      setRegistrationSuccess(true)
      // Reset form
      setTeamName('')
      setClubName('')
      setSpeakerOneUsername('')
      setSpeakerTwoUsername('')

      // Close modal after success message
      setTimeout(() => {
        setIsModalOpen(false)
        setRegistrationSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Registration error:', error)
      setRegistrationError('An unexpected error occurred. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Page Title */}
      <section className="text-center py-8">
        <h1 className="text-[#0D1321] text-[56px] font-bold mb-4">Explore Debates</h1>
      </section>

      {/* Main Content */}
      <div className="px-8 pb-16">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-[#0D1321] rounded-[16px] p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <Filter className="w-6 h-6 text-[#FFFFFF] mr-3" />
                <h2 className="text-[#FFFFFF] text-[24px] font-medium">Filters</h2>
              </div>

              {/* Start Date Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">Start Date:</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="start-date-from" className="sr-only">Start date from</label>
                    <input
                      id="start-date-from"
                      type="date"
                      placeholder="Start date from"
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={startDateFrom}
                      onChange={(e) => setStartDateFrom(e.target.value + "T00:00:00")}
                    />
                  </div>
                  <div>
                    <label htmlFor="start-date-to" className="sr-only">Start date to</label>
                    <input
                      id="start-date-to"
                      type="date"
                      placeholder="Start date to"
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={startDateTo}
                      onChange={(e) => setStartDateTo(e.target.value + "T23:59:59")}
                    />
                  </div>
                </div>
              </div>

              {/* Registration Deadline Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">Registration Deadline:</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="reg-deadline-from" className="sr-only">Registration deadline from</label>
                    <input
                      id="reg-deadline-from"
                      type="date"
                      placeholder="Registration deadline from"
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={registrationDeadlineFrom}
                      onChange={(e) => setRegistrationDeadlineFrom(e.target.value + "T00:00:00")}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-deadline-to" className="sr-only">Registration deadline to</label>
                    <input
                      id="reg-deadline-to"
                      type="date"
                      placeholder="Registration deadline to"
                      className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                      value={registrationDeadlineTo}
                      onChange={(e) => setRegistrationDeadlineTo(e.target.value + "T23:59:59")}
                    />
                  </div>
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">Location:</h3>
                <label htmlFor="location" className="sr-only">Location</label>
                <input
                  id="location"
                  type="text"
                  placeholder="Place/City"
                  className="w-full px-4 py-2 rounded-[8px] border border-[#9a8c98] text-[#4a4e69] text-[14px] font-normal"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              {/* League Filter */}
              <div className="mb-6">
                <h3 className="text-[#FFFFFF] text-[18px] font-medium mb-3">League:</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-[#FFFFFF] text-[14px] font-normal">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={selectedLeagues.includes(TournamentLeague.SCHOOL)}
                      onChange={() => handleLeagueChange(TournamentLeague.SCHOOL)}
                    />
                    School
                  </label>
                  <label className="flex items-center text-[#FFFFFF] text-[14px] font-normal">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={selectedLeagues.includes(TournamentLeague.UNIVERSITY)}
                      onChange={() => handleLeagueChange(TournamentLeague.UNIVERSITY)}
                    />
                    University
                  </label>
                </div>
              </div>

              {/* Non-full Filter */}
              <div className="mb-6">
                <label className="flex items-center text-[#FFFFFF] text-[18px] font-medium">
                  <input
                    type="checkbox"
                    className="mr-3 w-4 h-4"
                    checked={nonFull}
                    onChange={(e) => setNonFull(e.target.checked)}
                  />
                  Show Non-Full Debates
                </label>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search and Sort */}
            <div className="flex items-center justify-between mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9a8c98]" />
                <input
                  type="text"
                  placeholder="Search by name"
                  className="w-full pl-12 pr-40 py-3 rounded-[12px] border border-[#9a8c98] text-[#4a4e69] text-[16px] font-normal"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <select
                    className="appearance-none bg-[#3E5C76] text-white px-4 py-2 rounded-full text-[14px] font-normal pr-8 focus:outline-none cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name,asc">Name (A-Z)</option>
                    <option value="name,desc">Name (Z-A)</option>
                    <option value="startDate,desc">Most Recent</option>
                    <option value="startDate,asc">Upcoming</option>
                    {/* Note: 'popularity' sorting would require backend support. 
                        If not available, these options will sort by startDate. */}
                  </select>
                  <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Debate Cards */}
            <div className="space-y-6">
              {tournaments.length === 0 && !loading && (
                <p className="text-[#0D1321] text-center text-[20px]">No debates found matching your criteria.</p>
              )}
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="bg-[#0D1321] rounded-[16px] p-8 relative">
                  {/* Debate Info */}
                  <div className="flex items-start mb-6">
                    <div className="w-[150px] h-[150px] bg-[#FFFFFF] rounded-full mr-6 overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={tournament.imageUrl?.url || "/the-talking-logo.png"} // Use API image if available
                        alt={tournament.name}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#FFFFFF] text-[32px] font-medium mb-2">{tournament.name}</h3>
                      <div className="text-[#9a8c98] text-[16px] font-normal space-y-1 mb-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>League: {tournament.league}</span> 
                        </div>
                        <div className="flex items-center">
                          {/* As SimpleTournamentResponse does not include startDate or location,
                              these will show N/A. To display actual dates/locations here, 
                              SimpleTournamentResponse would need to be updated on the backend. */}
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Start Date: N/A</span> 
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>Location: N/A</span> 
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2"> {/* Use flex-wrap for tags */}
                        {tournament.tags && tournament.tags.map(tag => (
                            <span key={tag.name} className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">
                                {tag.name}
                            </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[#9a8c98] text-[16px] font-normal mb-4 leading-relaxed">
                    {tournament.description.length > 200 ? `${tournament.description.substring(0, 200)}...` : tournament.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link href={`/tournament/${tournament.id}`} className="text-[#FFFFFF] underline hover:text-[#748CAB] text-[14px] font-normal">
                      More...
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedTournamentId(tournament.id)
                        setIsModalOpen(true)
                      }}
                      className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal"
                    >
                      Join Debates
                    </button>
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-[#0D1321] text-center text-[20px]">Loading more debates...</p>
              )}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className="bg-[#3E5C76] text-[#FFFFFF] px-8 py-3 rounded-lg hover:bg-[#22223b] text-[16px] font-normal"
                  disabled={loading}
                >
                  Load More Debates
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0D1321] text-[#FFFFFF] py-16 mt-16">
        <div className="px-8">
          <div className="text-center mb-8">
            <div className="text-[45px] font-bold font-hikasami mb-4">DB</div>
            <div className="flex justify-center space-x-4 mb-8">
              <a
                href="#"
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[36px] h-[36px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[24px] h-[24px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[24px] h-[24px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex justify-center items-center text-[14px] font-normal relative">
            <div className="absolute left-0">Contact us: debetter@gmail.com</div>
            <div className="font-medium">© 2025 all rights reserved</div>
            <div className="absolute right-0">Privacy Policy</div>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#F1F1F1] rounded-lg p-8 w-full max-w-md mx-4 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-[#0D1321] text-[32px] font-bold text-center mb-8">
              {registrationSuccess ? 'Registration Successful!' : 'Tournament Registration'}
            </h2>

            {registrationSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-600 text-[18px] mb-4">✓ Your team has been registered successfully!</div>
                <p className="text-[#4a4e69] text-[14px]">You will receive a confirmation email shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <div className="flex items-center">
                  <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">Team Name:</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                    placeholder="Enter team name"
                  />
                </div>

                <div className="flex items-center">
                  <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">Club Name:</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                    placeholder="Enter club/institution name"
                  />
                </div>

                <div className="flex items-center">
                  <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">1st Speaker:</label>
                  <input
                    type="text"
                    value={speakerOneUsername}
                    onChange={(e) => setSpeakerOneUsername(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                    placeholder="Username (optional)"
                  />
                </div>

                <div className="flex items-center">
                  <label className="text-[#0D1321] text-[16px] font-normal w-32 text-right mr-4">2nd Speaker:</label>
                  <input
                    type="text"
                    value={speakerTwoUsername}
                    onChange={(e) => setSpeakerTwoUsername(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3E5C76]"
                    placeholder="Username (optional)"
                  />
                </div>

                <div className="text-[#9a8c98] text-[14px] px-2">
                  <p className="mb-2">• Speaker usernames are optional - you can invite team members later</p>
                  <p>• Only team name and club name are required for registration</p>
                </div>

                {registrationError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-[14px]">{registrationError}</p>
                  </div>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-[#3E5C76] text-white py-3 rounded-lg text-[16px] font-medium hover:bg-[#2D3748] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? 'Registering...' : 'Register Team'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
