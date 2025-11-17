"use client"

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

  if (selectedOption === "Announcements") {
    return (
      <div>
        <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Announcements</h2>
        <div className="relative bg-[#E5E5E5] rounded-lg border border-gray-300 min-h-[400px] p-6">
          <LoadingState isLoading={announcementsLoading} fallback={<Skeleton className="h-32 w-full" />}>
            {announcementsError ? (
              <div className="text-center text-red-500 text-[16px] py-20">Failed to load announcements</div>
            ) : announcements && announcements.content.length > 0 ? (
              <div className="space-y-6">
                {announcements.content.map((announcement) => (
                  <div key={announcement.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[#0D1321] text-[20px] font-bold">{announcement.title}</h3>
                      <span className="text-[#9a8c98] text-[14px]">
                        {new Date(announcement.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">{announcement.content}</p>
                    {announcement.user && (
                      <div className="text-[#9a8c98] text-[14px]">
                        Posted by {announcement.user.firstName} {announcement.user.lastName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[#9a8c98] text-[16px] py-20">No announcements yet</div>
            )}
          </LoadingState>

          <button
            onClick={() => onOpenModal("announcements")}
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
