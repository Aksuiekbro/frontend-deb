"use client"

import { Search, MapPin, Calendar, Users, Filter, X } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Footer from "@/components/Footer"
import { api } from "@/lib/api"
import { useCurrentUser } from "@/hooks/use-api"
import { SimpleTournamentResponse, TournamentGetParams, TournamentLeague } from "@/types/tournament/tournament"
import { toBackendDateTime } from "@/lib/datetime"
import type { PageResult } from "@/types/page"
import { Role } from "@/types/user/user"
import { buildTeamRegistrationPayload, getMaxInvitedParticipants } from "@/lib/team-registration"
import { readResponseError } from "@/lib/http-error"
import { resolveMediaUrl } from "@/lib/media"

export default function JoinDebatesPage() {
  const { user: currentUser, isLoading: currentUserLoading } = useCurrentUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null)
  const [tournaments, setTournaments] = useState<SimpleTournamentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [tournamentError, setTournamentError] = useState<string | null>(null)

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
  const selectedTournament = tournaments.find((tournament) => tournament.id === selectedTournamentId)
  const maxInvitedParticipants = getMaxInvitedParticipants(selectedTournament?.preliminaryFormat)
  const isGuestRegistration = !currentUser && !currentUserLoading

  // Fetch tournaments with all filter parameters
  const fetchTournaments = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const currentPage = reset ? 0 : page;
      const params: TournamentGetParams = {
        searchName: searchName || undefined,
        searchLocation: searchLocation || undefined,
        tags: undefined, // Add state for tags if you implement them in filters
        startDateFrom: toBackendDateTime(startDateFrom),
        startDateTo: toBackendDateTime(startDateTo),
        registrationDeadlineFrom: toBackendDateTime(registrationDeadlineFrom),
        registrationDeadlineTo: toBackendDateTime(registrationDeadlineTo),
        league: selectedLeagues.length > 0 ? selectedLeagues[0] : undefined, // Assuming single league filter for simplicity
        nonFull: nonFull || undefined,
      }
      
      const response = await api.getTournaments(params, { page: currentPage, size: 10, sort: sortBy }) // Pass all params directly
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: "Failed to load debates",
          unauthorized: "Please sign in to view debates.",
          serverError: "Server error. Please try again later.",
        }))
      }
      const data: PageResult<SimpleTournamentResponse> = await response.json()
      setTournamentError(null)

      if (reset) {
        setTournaments(data.content)
      } else {
        setTournaments((prevTournaments) => [...prevTournaments, ...data.content])
      }
      setHasMore(currentPage + 1 < data.totalPages)
      setPage(currentPage + 1)
    } catch (error) {
      setTournamentError(error instanceof Error ? error.message : "Failed to load debates")
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

    if (!currentUser?.id) {
      setRegistrationError('Please sign in before registering a team')
      return
    }

    if (currentUser.role !== Role.PARTICIPANT) {
      setRegistrationError('Only participant accounts can register a team')
      return
    }

    if (!currentUser.profileId) {
      setRegistrationError('Your participant profile is missing. Please sign in again')
      return
    }

    setIsRegistering(true)
    setRegistrationError(null)

    try {
      const payload = buildTeamRegistrationPayload(currentUser, {
        teamName,
        clubName,
        speakerOneUsername,
        speakerTwoUsername,
        maxInvitedParticipants,
      })

      const response = await api.registerTeam(selectedTournamentId, payload)

      if (!response.ok) {
        setRegistrationError(await readResponseError(response, {
          fallback: "Registration failed",
          unauthorized: "Please sign in before registering a team.",
          serverError: "Server error. Please try again later.",
        }))
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

  const filtersContent = (
    <>
      <h3 className="!mt-0">Start Date</h3>
      <label htmlFor="start-date-from" className="db-visually-hidden">Start date from</label>
      <input
        id="start-date-from"
        type="date"
        value={startDateFrom}
        onChange={(e) => setStartDateFrom(e.target.value + "T00:00:00")}
      />
      <label htmlFor="start-date-to" className="db-visually-hidden">Start date to</label>
      <input
        id="start-date-to"
        type="date"
        value={startDateTo}
        onChange={(e) => setStartDateTo(e.target.value + "T23:59:59")}
      />

      <h3>Registration Deadline</h3>
      <label htmlFor="reg-deadline-from" className="db-visually-hidden">Registration deadline from</label>
      <input
        id="reg-deadline-from"
        type="date"
        value={registrationDeadlineFrom}
        onChange={(e) => setRegistrationDeadlineFrom(e.target.value + "T00:00:00")}
      />
      <label htmlFor="reg-deadline-to" className="db-visually-hidden">Registration deadline to</label>
      <input
        id="reg-deadline-to"
        type="date"
        value={registrationDeadlineTo}
        onChange={(e) => setRegistrationDeadlineTo(e.target.value + "T23:59:59")}
      />

      <h3>Location</h3>
      <label htmlFor="location" className="db-visually-hidden">Location</label>
      <input
        id="location"
        type="text"
        placeholder="Place/City"
        value={searchLocation}
        onChange={(e) => setSearchLocation(e.target.value)}
      />

      <h3>League</h3>
      <label className="jd-checkline">
        <input
          type="checkbox"
          checked={selectedLeagues.includes(TournamentLeague.SCHOOL)}
          onChange={() => handleLeagueChange(TournamentLeague.SCHOOL)}
        />
        School
      </label>
      <label className="jd-checkline">
        <input
          type="checkbox"
          checked={selectedLeagues.includes(TournamentLeague.UNIVERSITY)}
          onChange={() => handleLeagueChange(TournamentLeague.UNIVERSITY)}
        />
        University
      </label>

      <h3>Availability</h3>
      <label className="jd-checkline">
        <input
          type="checkbox"
          checked={nonFull}
          onChange={(e) => setNonFull(e.target.checked)}
        />
        Show non-full debates only
      </label>
    </>
  )

  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 45%' }}>
        <img src="/images/senate/senate-oration.png" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
        <section className="db-hero" style={{ height: 220 }}>
          <div className="db-hero__content db-container" style={{ paddingBottom: 28 }}>
            <h1 className="db-hero__title" style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Explore Debates</h1>
          </div>
        </section>

        <div className="db-container">
          <div className="jd-layout">
            <aside
              id="filters-panel"
              className={
                mobileFiltersOpen
                  ? "jd-filters jd-filters--sheet"
                  : "jd-filters hidden min-[900px]:block"
              }
            >
              {mobileFiltersOpen && (
                <button
                  type="button"
                  className="jd-filters__close"
                  aria-label="Close filters"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {filtersContent}
            </aside>
            {mobileFiltersOpen && (
              <div className="db-nav-drawer__scrim min-[900px]:hidden" style={{ position: 'fixed', zIndex: 65 }} onClick={() => setMobileFiltersOpen(false)} />
            )}

            <div>
              <div className="jd-toolbar">
                <button
                  type="button"
                  className="db-btn db-btn-secondary min-[900px]:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Filter className="w-4 h-4" /> Filters
                </button>
                <div className="jd-search">
                  <Search className="jd-search__icon w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </div>
                <label htmlFor="sort-select" className="db-visually-hidden">Sort</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name,asc">Name (A-Z)</option>
                  <option value="name,desc">Name (Z-A)</option>
                  <option value="startDate,desc">Most Recent</option>
                  <option value="startDate,asc">Upcoming</option>
                </select>
              </div>

              <div className="debate-list">
                {tournamentError && (
                  <p role="alert" className="db-field-error text-center" style={{ padding: '12px 16px' }}>
                    {tournamentError}
                  </p>
                )}
                {tournaments.length === 0 && !loading && !tournamentError && (
                  <p className="empty-results">No debates found matching your criteria.</p>
                )}
                {tournaments.map((tournament) => (
                  <article key={tournament.id} className="db-card-dark debate-item">
                    <div className="debate-item__head">
                      <div className="debate-item__thumb">
                        <img
                          src={resolveMediaUrl(tournament.imageUrl?.url) || "/the-talking-logo.png"}
                          alt={tournament.name}
                        />
                      </div>
                      <div>
                        <p className="debate-item__name">{tournament.name}</p>
                        <p className="debate-item__meta-row"><Users className="w-4 h-4" /> League: {tournament.league}</p>
                        <p className="debate-item__meta-row"><Calendar className="w-4 h-4" /> Start Date: N/A</p>
                        <p className="debate-item__meta-row"><MapPin className="w-4 h-4" /> Location: N/A</p>
                      </div>
                    </div>
                    {tournament.tags && tournament.tags.length > 0 && (
                      <div className="debate-item__tags">
                        {tournament.tags.map(tag => (
                          <span key={tag.name} className="db-tag">{tag.name}</span>
                        ))}
                      </div>
                    )}
                    <p className="debate-item__desc">
                      {tournament.description.length > 200 ? `${tournament.description.substring(0, 200)}...` : tournament.description}
                    </p>
                    <div className="debate-item__actions">
                      <Link href={`/tournament/${tournament.id}`} className="db-btn db-btn-ghost-on-dark">
                        More...
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedTournamentId(tournament.id)
                          setRegistrationError(isGuestRegistration ? "Please sign in before registering a team." : null)
                          setRegistrationSuccess(false)
                          setSpeakerTwoUsername("")
                          setIsModalOpen(true)
                        }}
                        className="db-btn db-btn-primary"
                      >
                        Join Debates
                      </button>
                    </div>
                  </article>
                ))}
                {loading && (
                  <p className="empty-results">Loading more debates...</p>
                )}
              </div>

              {hasMore && (
                <div className="text-center mt-12">
                  <button
                    onClick={handleLoadMore}
                    className="db-btn db-btn-secondary"
                    disabled={loading}
                  >
                    Load More Debates
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="db-modal-scrim" data-open="true">
          <div className="db-modal" role="dialog" aria-labelledby="register-modal-title">
            <button
              onClick={() => setIsModalOpen(false)}
              className="db-modal__close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 id="register-modal-title" className="font-[var(--db-font-display)] text-[24px] mb-1">
              {registrationSuccess ? 'Registration Successful!' : 'Tournament Registration'}
            </h2>

            {registrationSuccess ? (
              <div className="text-center py-8">
                <div className="text-[18px] mb-3" style={{ color: 'var(--db-accent)' }}>✓ Your team has been registered successfully!</div>
                <p className="text-[14px] text-[var(--db-muted)]">You will receive a confirmation email shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleRegistrationSubmit}>
                <div className="db-field">
                  <label htmlFor="jd-team-name">Team Name</label>
                  <input
                    id="jd-team-name"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    placeholder="Enter team name"
                  />
                </div>

                <div className="db-field">
                  <label htmlFor="jd-club-name">Club Name</label>
                  <input
                    id="jd-club-name"
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    placeholder="Enter club/institution name"
                  />
                </div>

                <div className="db-field">
                  <label htmlFor="jd-teammate-1">Teammate</label>
                  <input
                    id="jd-teammate-1"
                    type="text"
                    value={speakerOneUsername}
                    onChange={(e) => setSpeakerOneUsername(e.target.value)}
                    placeholder="Username (optional)"
                  />
                </div>

                {maxInvitedParticipants > 1 && (
                  <div className="db-field">
                    <label htmlFor="jd-teammate-2">2nd Teammate</label>
                    <input
                      id="jd-teammate-2"
                      type="text"
                      value={speakerTwoUsername}
                      onChange={(e) => setSpeakerTwoUsername(e.target.value)}
                      placeholder="Username (optional)"
                    />
                  </div>
                )}

                <p className="db-hint" style={{ marginBottom: 18 }}>
                  Teammate usernames are optional — you can invite team members later. Only team name and club name are required for registration.
                </p>

                {isGuestRegistration && (
                  <div role="alert" className="db-panel text-center" style={{ padding: '14px 16px', marginBottom: 18 }}>
                    <p className="text-[14px] text-[var(--db-fg)]">Please sign in before registering a team.</p>
                    <div className="mt-3 flex justify-center gap-3">
                      <Link href="/auth?mode=login" prefetch={false} className="db-btn db-btn-primary" style={{ height: 36, padding: '0 14px' }}>
                        Log In
                      </Link>
                      <Link href="/auth?mode=register" prefetch={false} className="db-btn db-btn-secondary" style={{ height: 36, padding: '0 14px' }}>
                        Register
                      </Link>
                    </div>
                  </div>
                )}

                {registrationError && (
                  <p className="db-field-error" style={{ marginBottom: 18 }}>{registrationError}</p>
                )}

                <button
                  type="submit"
                  disabled={isRegistering || currentUserLoading || isGuestRegistration}
                  className="db-btn db-btn-primary db-btn-block"
                >
                  {isRegistering ? 'Registering...' : 'Register Team'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
