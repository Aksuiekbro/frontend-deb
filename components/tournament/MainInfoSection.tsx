"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { LoadingState, Skeleton } from "@/components/ui/loading"
import type { PageResult } from "@/types/page"
import type { AnnouncementResponse } from "@/types/tournament/announcement/announcement"
import type { TournamentResponse } from "@/types/tournament/tournament"

interface MainInfoSectionProps {
  selectedOption: string
  tournament?: TournamentResponse
  tournamentLoading: boolean
  tournamentError?: Error
  announcements?: PageResult<AnnouncementResponse>
  announcementsLoading: boolean
  announcementsError?: Error
  onOpenModal: (context: "announcements" | "schedule" | "map") => void
}

const SPECIAL_OPTIONS = ["Announcements", "Schedule", "Map"] as const

type SpecialOption = (typeof SPECIAL_OPTIONS)[number]

export function MainInfoSection({
  selectedOption,
  tournament,
  tournamentLoading,
  tournamentError,
  announcements,
  announcementsLoading,
  announcementsError,
  onOpenModal,
}: MainInfoSectionProps) {
  const isSpecialOption = (option: string): option is SpecialOption =>
    SPECIAL_OPTIONS.includes(option as SpecialOption)

  const sortedAnnouncements = useMemo(
    () =>
      (announcements?.content ?? [])
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [announcements]
  )
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0)

  useEffect(() => {
    setActiveAnnouncementIndex(0)
  }, [sortedAnnouncements.length])

  const currentAnnouncement = sortedAnnouncements[activeAnnouncementIndex]

  if (selectedOption === "Announcements") {
    return (
      <div>
        <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Announcements</h2>
        <div className="relative rounded-3xl border border-[#CFD6EA] bg-white p-6">
          <LoadingState isLoading={announcementsLoading} fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
            {announcementsError ? (
              <div className="text-center text-red-500 text-[16px] py-20">Failed to load announcements</div>
            ) : sortedAnnouncements.length === 0 ? (
              <div className="text-center text-[#9a8c98] text-[16px] py-20">No announcements yet</div>
            ) : (
              <>
                <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-[#D6DEEF] bg-[#1F5957]">
                  {currentAnnouncement?.imageUrl?.url ? (
                    <img
                      src={currentAnnouncement.imageUrl.url}
                      alt={currentAnnouncement.title}
                      className="h-[320px] w-full object-cover"
                    />
                  ) : (
                    <div className="h-[320px] w-full bg-[#1F5957]" />
                  )}

                  <button
                    className="absolute left-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 text-white transition hover:bg-white/10 disabled:opacity-50"
                    onClick={() => setActiveAnnouncementIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={activeAnnouncementIndex === 0}
                    aria-label="Previous announcement"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    className="absolute right-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 text-white transition hover:bg-white/10 disabled:opacity-50"
                    onClick={() =>
                      setActiveAnnouncementIndex((prev) => Math.min(prev + 1, sortedAnnouncements.length - 1))
                    }
                    disabled={activeAnnouncementIndex === sortedAnnouncements.length - 1}
                    aria-label="Next announcement"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="mx-auto mt-6 max-w-4xl">
                  <div className="flex items-center justify-between text-sm text-[#8A91A8]">
                    <span>
                      {new Date(currentAnnouncement.timestamp).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span>
                      {activeAnnouncementIndex + 1}/{sortedAnnouncements.length}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-[#0B1327]">{currentAnnouncement.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-[#3A4156]">{currentAnnouncement.content}</p>
                </div>
              </>
            )}
          </LoadingState>

          <button
            onClick={() => onOpenModal("announcements")}
            className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#0D1321] text-white shadow-lg transition hover:bg-[#22223b]"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (selectedOption === "Schedule") {
    return (
      <div>
        <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Schedule</h2>
        <div className="relative bg-white rounded-lg border border-gray-300 min-h-[500px] p-6">
          <div className="h-full" />
          <button
            onClick={() => onOpenModal("schedule")}
            className="absolute bottom-6 right-6 w-12 h-12 bg-[#0D1321] text-white rounded-full flex items-center justify-center hover:bg-[#22223b] transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (selectedOption === "Map") {
    return (
      <div>
        <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Map</h2>
        <div className="relative bg-[#E5E5E5] rounded-lg border border-gray-300 min-h-[400px] p-6">
          <div className="text-center text-[#9a8c98] text-[16px] py-20">Map will be displayed here</div>
          <button
            onClick={() => onOpenModal("map")}
            className="absolute bottom-6 right-6 w-12 h-12 bg-[#0D1321] text-white rounded-full flex items-center justify-center hover:bg-[#22223b] transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300">
      {(!isSpecialOption(selectedOption)) && (
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-[#0D1321] text-[24px] font-bold mb-4">Details</h2>
            <LoadingState isLoading={tournamentLoading} fallback={<Skeleton className="h-24 w-full" />}>
              {tournamentError ? (
                <p className="text-red-500 text-[16px]">Unable to load tournament details</p>
              ) : tournament ? (
                <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-6">
                  {tournament.description || "No description available for this tournament."}
                </p>
              ) : (
                <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-6">
                  Tournament details will appear here once loaded.
                </p>
              )}
            </LoadingState>

            <div className="flex space-x-12 mb-8">
              <div>
                <h3 className="text-[#0D1321] text-[18px] font-bold mb-2">Dates</h3>
                <LoadingState isLoading={tournamentLoading} fallback={<Skeleton className="h-6 w-48" />}>
                  <p className="text-[#4a4e69] text-[16px]">
                    {tournament ? (
                      tournament.endDate
                        ? `${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}`
                        : new Date(tournament.startDate).toLocaleDateString()
                    ) : (
                      "Tournament dates TBA"
                    )}
                  </p>
                </LoadingState>
              </div>
              <div>
                <h3 className="text-[#0D1321] text-[18px] font-bold mb-2">Location</h3>
                <LoadingState isLoading={tournamentLoading} fallback={<Skeleton className="h-6 w-32" />}>
                  <p className="text-[#4a4e69] text-[16px]">{tournament?.location || "Location TBA"}</p>
                </LoadingState>
              </div>
            </div>
          </div>

          <hr className="border-gray-300 mb-8" />

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-[#0D1321] text-[24px] font-bold mb-6">Announcements</h2>
              <LoadingState isLoading={announcementsLoading} fallback={<Skeleton className="h-20 w-full" />}>
                {announcementsError ? (
                  <p className="text-red-500 text-[16px]">Unable to load announcements</p>
                ) : announcements && announcements.content.length > 0 ? (
                  <div className="text-[#0D1321] text-[18px] leading-relaxed space-y-4">
                    {announcements.content.slice(0, 3).map((announcement) => (
                      <div key={announcement.id} className="border-b border-gray-200 pb-2 mb-2 last:border-b-0">
                        <h4 className="font-medium text-[16px] mb-1">{announcement.title}</h4>
                        <p className="text-[14px] text-[#4a4e69]">{announcement.content}</p>
                        <span className="text-[12px] text-[#9a8c98]">
                          {new Date(announcement.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[#9a8c98] text-[16px] py-8">No announcements yet</div>
                )}
              </LoadingState>
            </div>

            <div>
              <h2 className="text-[#0D1321] text-[24px] font-bold mb-6">Schedule</h2>
              <div className="bg-gray-500 h-80 rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
