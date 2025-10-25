"use client"

import { ChevronLeft, ChevronRight, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Link from "next/link"
import { useUpcomingTournaments } from "@/hooks/use-api"
import { LoadingState, CardSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/ui/error"

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
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-4">
        <div className="flex items-center space-x-16">
          <div className="text-[#0D1321] text-[45px] font-bold font-hikasami">DB</div>
          <nav className="flex space-x-16">
            <Link href="/join" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal font-hikasami">
              Join Debates
            </Link>
            <Link href="/rating" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal font-hikasami">
              Rating
            </Link>
            <Link href="/news" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal font-hikasami">
              News
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <select
              className="border border-[#3E5C76] rounded-none px-4 py-2 text-[#0D1321] bg-white text-[14px] font-medium font-hikasami appearance-none bg-no-repeat bg-right bg-[length:20px] pr-4 hover:border-[#748CAB] focus:outline-none focus:ring-2 focus:ring-[#3E5C76] focus:ring-opacity-20 transition-all duration-200 cursor-pointer min-w-[100px] shadow-sm"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%233E5C76%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")',
              }}
            >
              <option>🇺🇸 English</option>
              <option>🇷🇺 Русский</option>
              <option>🇰🇿 Қазақша</option>
            </select>
          </div>
          <button 
            onClick={() => router.push('/auth?mode=register')}
            className="bg-[#3E5C76] text-white px-8 py-4 rounded-lg hover:bg-[#22223b] text-[14px] font-normal font-hikasami"
          >
            Registration
          </button>
          <button 
            onClick={() => router.push('/auth?mode=login')}
            className="border border-[#3E5C76] text-[#3E5C76] px-8 py-4 rounded-lg hover:bg-[#3E5C76] hover:text-white text-[14px] font-normal font-hikasami"
          >
            Log In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-[#0D1321] text-[56px] font-bold mb-8 font-hikasami">Welcome to DeBetter</h1>

        <div className="relative mx-8">
          <div ref={emblaRef} className="overflow-hidden rounded-[16px]">
            <div className="flex">
              {[0, 1].map((i) => (
                <div key={i} className="min-w-0 flex-[0_0_100%]">
                  <div
                    className="rounded-[16px] py-16 px-8 relative h-[311px] overflow-hidden"
                    style={{ boxShadow: '0px 10px 28px 4px rgba(43, 63, 108, 0.25)' }}
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
                        <div className="absolute inset-0 rounded-[16px] bg-gradient-to-r from-[#0D1321] to-[#2B3F6C] z-10" />
                        <div className="relative z-20 h-full flex flex-col justify-center">
                          <h2 className="text-[#FFFFFF] text-[46px] font-semibold mb-8 font-hikasami">
                            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">DeBetter</span> - website for{" "}
                            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">debates</span> organisation
                          </h2>
                          <div className="flex justify-center space-x-4 mb-8">
                            <Link href="/join" className="inline-block bg-[#3E5C76] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal font-hikasami text-center">
                              Join Debate
                            </Link>
                            <button className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal font-hikasami">
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
              className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 0 ? 'w-[28px] bg-white' : 'w-[24px] bg-[#3E5C76]'}`}
            />
            <button
              type="button"
              aria-label="Slide 2"
              onClick={() => emblaApi && emblaApi.scrollTo(1)}
              className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 1 ? 'w-[28px] bg-white' : 'w-[24px] bg-[#3E5C76]'}`}
            />
          </div>
        </div>
      </section>

      {/* Upcoming Debates */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8 font-hikasami">Upcoming Debates</h3>

        <LoadingState
          isLoading={tournamentsLoading}
          fallback={
            <div className="flex space-x-6 px-16">
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
              <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10">
                <ChevronLeft className="w-[24px] h-[24px] text-[#4a4e69]" />
              </button>

              <div className="flex space-x-6 overflow-hidden px-16">
                {upcomingTournaments.content.slice(0, 2).map((tournament) => (
                  <div key={tournament.id} className="bg-[#0D1321] rounded-[12px] p-6 flex-1 min-w-0">
                    <h4 className="text-[#FFFFFF] text-[30px] font-medium mb-2 font-hikasami">{tournament.name}</h4>
                    <p className="text-[#9a8c98] mb-1 text-[16px] font-normal font-hikasami">{tournament.location || "Location TBA"}</p>
                    <p className="text-[#9a8c98] mb-4 text-[16px] font-normal font-hikasami">
                      {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "Date TBA"}
                    </p>

                    <div className="flex space-x-2 mb-6">
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">
                        {tournament.preliminaryFormat}
                      </span>
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">
                        {tournament.teamElimintationFormat}
                      </span>
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">
                        {tournament.league}
                      </span>
                    </div>

                    {/* Expandable content */}
                    {expandedDebates[tournament.id] && (
                      <div className="mb-4 p-4 bg-[#0D1321] rounded-lg">
                        <h5 className="text-[#FFFFFF] text-[18px] font-medium mb-2 font-hikasami">Tournament Details</h5>
                        <p className="text-[#FFFFFF] text-[14px] font-normal mb-2 font-hikasami">
                          Description: {tournament.description || "No description available"}
                        </p>
                        <p className="text-[#FFFFFF] text-[14px] font-normal mb-2 font-hikasami">
                          Registration deadline: {tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toLocaleDateString() : "TBA"}
                        </p>
                        <p className="text-[#FFFFFF] text-[14px] font-normal mb-2 font-hikasami">
                          Team limit: {tournament.teamLimit ? `${tournament.teamLimit} teams` : "No limit"}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <button
                          onClick={() => toggleDebateDetails(tournament.id)}
                          className="text-[#FFFFFF] underline hover:text-[#83c5be] text-[14px] font-normal font-hikasami"
                        >
                          {expandedDebates[tournament.id] ? 'Less...' : 'More...'}
                        </button>
                      </div>
                      <div className="flex justify-start space-x-2">
                        <Link
                          href={`/tournament/${tournament.id}`}
                          className="inline-block bg-[#3E5C76] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#748cab] text-[14px] font-normal font-hikasami text-center"
                        >
                          View Details
                        </Link>
                        <Link
                          href="/join"
                          className="inline-block border border-[#3E5C76] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#3E5C76] text-[14px] font-normal font-hikasami text-center"
                        >
                          Join Tournament
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10">
                <ChevronRight className="w-[24px] h-[24px] text-[#4a4e69]" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#4a4e69] text-[18px] font-hikasami">No upcoming tournaments available</p>
              <Link
                href="/tournament/create"
                className="inline-block mt-4 bg-[#3E5C76] text-[#FFFFFF] px-6 py-3 rounded hover:bg-[#748cab] text-[16px] font-normal font-hikasami"
              >
                Create Tournament
              </Link>
            </div>
          )}
        </LoadingState>
      </section>

      {/* Testimonials (leaderboard disabled) */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8 font-hikasami">Community Voices</h3>
        <div className="text-center py-12">
          <p className="text-[#4a4e69] text-[18px] font-hikasami">Community testimonials will appear as more users join tournaments</p>
          <Link
            href="/tournaments"
            className="inline-block mt-4 bg-[#3E5C76] text-[#FFFFFF] px-6 py-3 rounded hover:bg-[#748cab] text-[16px] font-normal font-hikasami"
          >
            Join a Tournament
          </Link>
        </div>
      </section>

      {/* Leader Board (disabled) */}
      <section className="px-8 py-12">
        <div className="text-center py-12">
          <p className="text-[#4a4e69] text-[18px] font-hikasami">Leaderboard is disabled until ratings are supported.</p>
        </div>
      </section>

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

          <div className="flex justify-between items-center text-[14px] font-normal font-hikasami">
            <div>Contact us: debetter@gmail.com</div>
            <div>© 2025 all rights reserved</div>
            <div>Privacy Policy</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
