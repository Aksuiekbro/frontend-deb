"use client"

import { ChevronLeft, ChevronRight, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Link from "next/link"
import { useUpcomingTournaments } from "@/hooks/use-api"
import { LoadingState, CardSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/ui/error"
import Footer from "@/components/Footer"

export default function Component() {
  const router = useRouter()
  const [visibleGradients, setVisibleGradients] = useState<{[key: string]: boolean}>({})
  const [expandedDebates, setExpandedDebates] = useState<{[key: number]: boolean}>({})
  const gradientRefs = useRef<{[key: string]: HTMLDivElement | null}>({})
  const [isSwiping, setIsSwiping] = useState(false)
  const [activeSlide, setActiveSlide] = useState<number>(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" })

  // API hooks
  const { upcomingTournaments, isLoading: tournamentsLoading, error: tournamentsError } = useUpcomingTournaments(6)

  const toggleDebateDetails = (debateId: number) => {
    setExpandedDebates(prev => ({
      ...prev,
      [debateId]: !prev[debateId]
    }))
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleGradients(prev => ({
              ...prev,
              [entry.target.id]: true
            }))
          }
        })
      },
      { threshold: 0.3 }
    )

    Object.values(gradientRefs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveSlide(emblaApi.selectedScrollSnap())
    const onScroll = () => setIsSwiping(true)
    const onSettle = () => setIsSwiping(false)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('scroll', onScroll)
    emblaApi.on('settle', onSettle)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      emblaApi.off('scroll', onScroll)
      emblaApi.off('settle', onSettle)
    }
  }, [emblaApi])
  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 62%' }}>
        <img src="/images/senate/forum-panorama.png" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
        {/* Hero Section */}
        <section className="text-center py-8">
          <h1 className="home-heading font-bold mb-8 font-[var(--db-font-display)] px-4" style={{ fontSize: 'clamp(32px, 6vw, 56px)' }}>Welcome to DeBetter</h1>

          <div className="relative mx-8">
            <div ref={emblaRef} className="overflow-hidden rounded-[16px]">
              <div className="flex">
                {[0, 1].map((i) => (
                  <div key={i} className="min-w-0 flex-[0_0_100%]">
                    <div
                      className="rounded-[16px] py-16 px-8 relative min-h-[311px] overflow-hidden"
                      style={{ boxShadow: 'var(--db-shadow)' }}
                    >
                      {i === 1 ? (
                        // Second slide: exact frame image
                        <img
                          src="/images/Frame 78.png"
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover rounded-[16px]"
                        />
                      ) : (
                        <>
                          {/* First slide: gradient background + content */}
                          <div className="home-hero-slide absolute inset-0 rounded-[16px] z-10" />
                          <div className="relative z-20 h-full flex flex-col justify-center">
                            <h2 className="text-white font-semibold mb-8 font-[var(--db-font-display)]" style={{ fontSize: 'clamp(26px, 4.5vw, 46px)' }}>
                              <span className="text-[var(--db-accent)]">DeBetter</span> - website for{" "}
                              <span className="text-[var(--db-accent)]">debates</span> organisation
                            </h2>
                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                              <Link href="/join" className="db-btn db-btn-primary">
                                Join Debate
                              </Link>
                              <button className="db-btn db-btn-ghost-on-dark">
                                Create Tournament
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Pagination indicators (clickable, overlay) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
              <button
                type="button"
                aria-label="Slide 1"
                onClick={() => emblaApi && emblaApi.scrollTo(0)}
                className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 0 ? 'w-[28px] bg-white' : 'w-[24px] bg-white/40'}`}
              />
              <button
                type="button"
                aria-label="Slide 2"
                onClick={() => emblaApi && emblaApi.scrollTo(1)}
                className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 1 ? 'w-[28px] bg-white' : 'w-[24px] bg-white/40'}`}
              />
            </div>
          </div>
        </section>

        {/* Upcoming Debates */}
        <section className="px-8 py-12 db-container">
          <div className="db-panel content-panel" style={{ padding: '40px 32px' }}>
          <h3 className="section-title">Upcoming Debates</h3>

          <LoadingState
            isLoading={tournamentsLoading}
            fallback={
              <div className="flex flex-col sm:flex-row gap-6">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            }
          >
            {tournamentsError ? (
              <ErrorState
                error={tournamentsError}
                onRetry={() => window.location.reload()}
                message="Failed to load upcoming tournaments"
              />
            ) : upcomingTournaments && upcomingTournaments.content.length > 0 ? (
              <div className="relative">
                <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-[var(--db-bg-elevated)] rounded-full p-2 shadow-lg z-10">
                  <ChevronLeft className="w-[24px] h-[24px] text-[var(--db-muted)]" />
                </button>

                <div className="debate-rail px-16">
                  {upcomingTournaments.content.slice(0, 2).map((tournament) => (
                    <div key={tournament.id} className="db-card-dark">
                      <p className="debate-card__title">{tournament.name}</p>
                      <p className="debate-card__meta">{tournament.location || "Location TBA"}</p>
                      <p className="debate-card__meta">
                        {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "Date TBA"}
                      </p>

                      <div className="debate-card__tags">
                        <span className="db-tag">{tournament.preliminaryFormat}</span>
                        <span className="db-tag">{tournament.teamEliminationFormat}</span>
                        <span className="db-tag">{tournament.league}</span>
                      </div>

                      {/* Expandable content */}
                      {expandedDebates[tournament.id] && (
                        <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(0,0,0,.18)' }}>
                          <h5 className="text-[18px] font-medium mb-2">Tournament Details</h5>
                          <p className="text-[14px] mb-2 db-muted">
                            Description: {tournament.description || "No description available"}
                          </p>
                          <p className="text-[14px] mb-2 db-muted">
                            Registration deadline: {tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toLocaleDateString() : "TBA"}
                          </p>
                          <p className="text-[14px] mb-2 db-muted">
                            Team limit: {tournament.teamLimit ? `${tournament.teamLimit} teams` : "No limit"}
                          </p>
                        </div>
                      )}

                      <div className="row gap-md" style={{ flexWrap: 'wrap' }}>
                        <button
                          onClick={() => toggleDebateDetails(tournament.id)}
                          className="db-btn db-btn-ghost-on-dark"
                        >
                          {expandedDebates[tournament.id] ? 'Less...' : 'More...'}
                        </button>
                        <Link href={`/tournament/${tournament.id}`} className="db-btn db-btn-primary">
                          View Details
                        </Link>
                        <Link href="/join" className="db-btn db-btn-ghost-on-dark">
                          Join Tournament
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[var(--db-bg-elevated)] rounded-full p-2 shadow-lg z-10">
                  <ChevronRight className="w-[24px] h-[24px] text-[var(--db-muted)]" />
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <p>No upcoming tournaments available</p>
                <Link href="/tournament/create" className="db-btn db-btn-primary" style={{ marginTop: 18 }}>
                  Create Tournament
                </Link>
              </div>
            )}
          </LoadingState>
          </div>
        </section>

        {/* Testimonials (leaderboard disabled) */}
        <section className="px-8 py-12 db-container">
          <div className="db-panel content-panel" style={{ padding: '40px 32px' }}>
            <h3 className="section-title">Community Voices</h3>
            <div className="empty-state">
              <p>Community testimonials will appear as more users join tournaments</p>
              <Link href="/tournaments" className="db-btn db-btn-primary" style={{ marginTop: 18 }}>
                Join a Tournament
              </Link>
            </div>
          </div>
        </section>

        {/* Leader Board (disabled) */}
        <section className="px-8 py-12 db-container">
          <div className="text-center py-12">
            <p className="home-sub text-[18px]">Leaderboard is disabled until ratings are supported.</p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
