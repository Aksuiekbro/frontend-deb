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
        <h1 className="text-[#0D1321] text-[56px] font-bold mb-6 md:mb-8 font-hikasami">Welcome to DeBetter</h1>
        <div className="relative mx-8">
          <div ref={emblaRef} className="overflow-hidden rounded-[16px]">
            <div className="flex">
              {[0, 1].map((i) => (
                <div key={i} className="min-w-0 flex-[0_0_100%]">
                  <div className="rounded-[16px] py-6 md:py-10 px-6 md:px-8 relative h-[360px] md:h-[311px] overflow-hidden" style={{ boxShadow: '0px 10px 28px 4px rgba(43, 63, 108, 0.25)' }}>
                    {i === 1 ? (
                      <img src="/images/Frame 78.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover rounded-[16px]" />
                    ) : (
                      <>
                        <div className="absolute inset-0 rounded-[16px] bg-gradient-to-r from-[#0D1321] to-[#2B3F6C] z-10" />
                        <div className="relative z-20 h-full flex flex-col justify-center">
                          <h2 className="text-[#FFFFFF] text-[30px] md:text-[46px] font-semibold mb-6 md:mb-8 font-hikasami">
                            <span className="text-[#748CAB] font-hikasami font-semibold">DeBetter</span> - website for <span className="text-[#748CAB] font-hikasami font-semibold">debates</span> organisation
                          </h2>
                          <div className="flex justify-center space-x-4 mb-8">
                            <Link href="/join" className="inline-block bg-[#3E5C76] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal font-hikasami text-center">Join Debate</Link>
                            <Link href="/tournament/create" className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal font-hikasami">Create Tournament</Link>
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
            <button type="button" aria-label="Slide 1" onClick={() => emblaApi && emblaApi.scrollTo(0)} className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 0 ? 'w-[28px] bg-white' : 'w-[24px] bg-[#3E5C76]'}`} />
            <button type="button" aria-label="Slide 2" onClick={() => emblaApi && emblaApi.scrollTo(1)} className={`h-[4px] rounded transition-all duration-200 ${activeSlide === 1 ? 'w-[28px] bg-white' : 'w-[24px] bg-[#3E5C76]'}`} />
          </div>
        </div>
      </section>

      {/* Slot right above Upcoming Debates */}
      {aboveUpcoming}

      {/* Upcoming Debates */}
      <section className="px-8 pt-6 pb-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8 font-hikasami">Upcoming Debates</h3>
        <LoadingState isLoading={tournamentsLoading} fallback={<div className="flex space-x-6 px-16"><CardSkeleton /><CardSkeleton /></div>}>
          {tournamentsError ? (
            <ErrorState error={tournamentsError} onRetry={() => window.location.reload()} message="Failed to load upcoming tournaments" />
          ) : upcomingTournaments && upcomingTournaments.content.length > 0 ? (
            <div className="relative">
              <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10"><ChevronLeft className="w-[24px] h-[24px] text-[#4a4e69]" /></button>
              <div className="flex space-x-6 overflow-hidden px-16">
                {upcomingTournaments.content.slice(0, 2).map((tournament) => (
                  <div key={tournament.id} className="bg-[#0D1321] rounded-[12px] p-6 flex-1 min-w-0">
                    <h4 className="text-[#FFFFFF] text-[30px] font-medium mb-2 font-hikasami">{tournament.name}</h4>
                    <p className="text-[#9a8c98] mb-1 text-[16px] font-normal font-hikasami">{tournament.location || 'Location TBA'}</p>
                    <p className="text-[#9a8c98] mb-4 text-[16px] font-normal font-hikasami">{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Date TBA'}</p>
                    <div className="flex space-x-2 mb-6">
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">{tournament.preliminaryFormat}</span>
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">{tournament.teamElimintationFormat}</span>
                      <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal font-hikasami cursor-default">{tournament.league}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <Link href={`/tournament/${tournament.id}`} className="text-[#FFFFFF] underline hover:text-[#83c5be] text-[14px] font-normal font-hikasami">More...</Link>
                      </div>
                      <div className="flex justify-start">
                        <Link href="/join" className="inline-block bg-[#3E5C76] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#748cab] text-[14px] font-normal font-hikasami text-center">Join Debates</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10"><ChevronRight className="w-[24px] h-[24px] text-[#4a4e69]" /></button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#4a4e69] text-[18px] font-hikasami">No upcoming tournaments available</p>
              <Link href="/tournament/create" className="inline-block mt-4 bg-[#3E5C76] text-[#FFFFFF] px-6 py-3 rounded hover:bg-[#748cab] text-[16px] font-normal font-hikasami">Create Tournament</Link>
            </div>
          )}
        </LoadingState>
      </section>

      {/* Testimonials (optional; leaderboard disabled) */}
      {includeTestimonials && (
        <section className="px-8 py-12">
          <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8 font-hikasami">Community Voices</h3>
          <div className="text-center py-12"><p className="text-[#4a4e69] text-[18px] font-hikasami">Community testimonials will appear as more users join tournaments</p></div>
        </section>
      )}
    </>
  )
}

