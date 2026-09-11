"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useUpcomingTournaments } from "@/hooks/use-api"
import { LoadingState, CardSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/ui/error"

type HomeTopProps = { includeTestimonials?: boolean; aboveUpcoming?: ReactNode }

export default function HomeTop({ includeTestimonials = true, aboveUpcoming }: HomeTopProps) {
  const [activeSlide, setActiveSlide] = useState<number>(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" })
  const [visibleGradients, setVisibleGradients] = useState<{[key: string]: boolean}>({})
  const gradientRefs = useRef<{[key: string]: HTMLDivElement | null}>({})

  const { upcomingTournaments, isLoading: tournamentsLoading, error: tournamentsError } = useUpcomingTournaments(6)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveSlide(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleGradients(prev => ({ ...prev, [entry.target.id]: true }))
        }
      })
    }, { threshold: 0.3 })
    Object.values(gradientRefs.current).forEach(ref => { if (ref) observer.observe(ref) })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="text-center py-8">
        <h1 className="home-heading font-bold mb-6 md:mb-8 font-[var(--db-font-display)] px-4" style={{ fontSize: 'clamp(32px,6vw,56px)' }}>Welcome to DeBetter</h1>
        <div className="relative mx-8">
          <div ref={emblaRef} className="overflow-hidden rounded-[16px]">
            <div className="flex">
              {[0, 1].map((i) => (
                <div key={i} className="min-w-0 flex-[0_0_100%]">
                  <div className="home-hero-slide rounded-[16px] py-6 md:py-10 px-6 md:px-8 relative min-h-[360px] md:min-h-[311px] overflow-hidden" style={{ boxShadow: 'var(--db-shadow)' }}>
                    {i === 1 ? (
                      <img src="/images/Frame 78.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover rounded-[16px]" />
                    ) : (
                      <>
                        <div className="relative z-20 h-full flex flex-col justify-center">
                          <h2 className="text-white font-semibold mb-6 md:mb-8 font-[var(--db-font-display)]" style={{ fontSize: 'clamp(26px,4.5vw,46px)' }}>
                            <span className="text-[var(--db-accent)]">DeBetter</span> - website for <span className="text-[var(--db-accent)]">debates</span> organisation
                          </h2>
                          <div className="flex flex-wrap justify-center gap-4 mb-8">
                            <Link href="/join" className="db-btn db-btn-primary">Join Debate</Link>
                            <Link href="/tournament/create" className="db-btn db-btn-ghost-on-dark">Create Tournament</Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
            <button type="button" aria-label="Slide 1" onClick={() => emblaApi && emblaApi.scrollTo(0)} className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 0 ? 'w-[28px] bg-white' : 'w-[24px] bg-white/40'}`} />
            <button type="button" aria-label="Slide 2" onClick={() => emblaApi && emblaApi.scrollTo(1)} className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 1 ? 'w-[28px] bg-white' : 'w-[24px] bg-white/40'}`} />
          </div>
        </div>
      </section>

      {/* Slot right above Upcoming Debates */}
      <div className="db-container">{aboveUpcoming}</div>

      {/* Upcoming Debates */}
      <section className="px-8 pt-6 pb-12 db-container">
        <div className="db-panel content-panel">
        <h3 className="section-title">Upcoming Debates</h3>
        <LoadingState isLoading={tournamentsLoading} fallback={<div className="flex flex-col sm:flex-row gap-6"><CardSkeleton /><CardSkeleton /></div>}>
          {tournamentsError ? (
            <ErrorState error={tournamentsError} onRetry={() => window.location.reload()} message="Failed to load upcoming tournaments" />
          ) : upcomingTournaments && upcomingTournaments.content.length > 0 ? (
            <div className="debate-rail">
              {upcomingTournaments.content.slice(0, 2).map((tournament) => (
                <div key={tournament.id} className="db-card-dark min-w-0">
                  <p className="debate-card__title">{tournament.name}</p>
                  <p className="debate-card__meta">{tournament.location || 'Location TBA'}</p>
                  <p className="debate-card__meta">{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Date TBA'}</p>
                  <div className="debate-card__tags">
                    <span className="db-tag">{tournament.preliminaryFormat}</span>
                    <span className="db-tag">{tournament.teamEliminationFormat}</span>
                    <span className="db-tag">{tournament.league}</span>
                  </div>
                  <div className="row gap-md" style={{ flexWrap: 'wrap' }}>
                    <Link href={`/tournament/${tournament.id}`} className="db-btn db-btn-ghost-on-dark">More...</Link>
                    <Link href="/join" className="db-btn db-btn-primary">Join Debates</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No upcoming tournaments available</p>
              <Link href="/tournament/create" className="db-btn db-btn-primary" style={{ marginTop: 18 }}>Create Tournament</Link>
            </div>
          )}
        </LoadingState>
        </div>
      </section>

      {/* Testimonials (optional; leaderboard disabled) */}
      {includeTestimonials && (
        <section className="px-8 py-12 db-container">
          <div className="db-panel content-panel">
            <h3 className="section-title">Community Voices</h3>
            <div className="empty-state"><p>Community testimonials will appear as more users join tournaments</p></div>
          </div>
        </section>
      )}
    </>
  )
}

