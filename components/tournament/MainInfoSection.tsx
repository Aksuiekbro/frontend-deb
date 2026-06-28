"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

import { LoadingState, Skeleton } from "@/components/ui/loading"
import { resolveMediaUrl } from "@/lib/media"
import type { PageResult } from "@/types/page"
import type { AnnouncementResponse } from "@/types/tournament/announcement/announcement"
import type { ScheduleResponse } from "@/types/tournament/schedule"
import type { TournamentResponse } from "@/types/tournament/tournament"

interface MainInfoSectionProps {
  selectedOption: string
  tournament?: TournamentResponse
  tournamentLoading: boolean
  tournamentError?: Error
  announcements?: PageResult<AnnouncementResponse>
  announcementsLoading: boolean
  announcementsError?: Error
  schedules?: ScheduleResponse[]
  schedulesLoading: boolean
  schedulesError?: Error
  onOpenModal?: (context: "announcements" | "schedule" | "map") => void
  onAddAnnouncementComment?: (announcementId: number, content: string) => Promise<void> | void
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
  schedules,
  schedulesLoading,
  schedulesError,
  onOpenModal,
  onAddAnnouncementComment,
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
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [removedAnnouncementImages, setRemovedAnnouncementImages] = useState<Set<number>>(new Set())
  const [removedScheduleImages, setRemovedScheduleImages] = useState<Set<number>>(new Set())

  const handleRemoveAnnouncementImage = (announcementId: number) => {
    setRemovedAnnouncementImages((prev) => {
      const next = new Set(prev)
      next.add(announcementId)
      return next
    })
  }

  const handleRemoveScheduleImage = (scheduleId: number) => {
    setRemovedScheduleImages((prev) => {
      const next = new Set(prev)
      next.add(scheduleId)
      return next
    })
  }

  const handleAddComment = async (announcementId: number) => {
    const content = commentDrafts[announcementId]?.trim()
    if (!content || !onAddAnnouncementComment || commentSubmitting) return

    try {
      setCommentSubmitting(true)
      setCommentError(null)
      await onAddAnnouncementComment(announcementId, content)
      setCommentDrafts((prev) => ({ ...prev, [announcementId]: "" }))
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Failed to add comment")
    } finally {
      setCommentSubmitting(false)
    }
  }

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
                  {currentAnnouncement?.imageUrl?.url && !removedAnnouncementImages.has(currentAnnouncement.id) ? (
                    <img
                      src={resolveMediaUrl(currentAnnouncement.imageUrl.url)}
                      alt={currentAnnouncement.title}
                      className="h-[320px] w-full object-cover"
                      onError={() => handleRemoveAnnouncementImage(currentAnnouncement.id)}
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
                  <div className="mt-6 space-y-3 border-t border-[#E3E8F6] pt-4">
                    <h4 className="text-base font-semibold text-[#0B1327]">Comments</h4>
                    {currentAnnouncement.comments?.length ? (
                      <div className="space-y-2">
                        {currentAnnouncement.comments.map((comment) => (
                          <div key={comment.id} className="rounded-lg bg-[#F7F9FF] px-4 py-3">
                            <p className="text-sm text-[#0B1327]">{comment.content}</p>
                            <p className="mt-1 text-xs text-[#8A91A8]">
                              {comment.author.username} · {new Date(comment.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#8A91A8]">No comments yet</p>
                    )}
                    {onAddAnnouncementComment && (
                      <div className="flex gap-3">
                        <label className="sr-only" htmlFor={`announcement-comment-${currentAnnouncement.id}`}>
                          Announcement comment
                        </label>
                        <input
                          id={`announcement-comment-${currentAnnouncement.id}`}
                          value={commentDrafts[currentAnnouncement.id] ?? ""}
                          onChange={(event) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [currentAnnouncement.id]: event.target.value,
                            }))
                          }
                          placeholder="Add a comment"
                          className="min-w-0 flex-1 rounded-lg border border-[#D6DEEF] px-3 py-2 text-sm text-[#0B1327] outline-none focus:border-[#3E5C76]"
                        />
                        <button
                          type="button"
                          disabled={commentSubmitting || !(commentDrafts[currentAnnouncement.id] ?? "").trim()}
                          onClick={() => handleAddComment(currentAnnouncement.id)}
                          className="rounded-lg bg-[#0D1321] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22223b] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add comment
                        </button>
                      </div>
                    )}
                    {commentError && <p role="alert" className="text-sm text-red-600">{commentError}</p>}
                  </div>
                </div>
              </>
            )}
          </LoadingState>

          {onOpenModal ? (
            <button
              onClick={() => onOpenModal("announcements")}
              className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#0D1321] text-white shadow-lg transition hover:bg-[#22223b]"
              aria-label="Add announcement"
            >
              <Plus className="h-6 w-6" />
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  if (selectedOption === "Schedule") {
    const sortedSchedules = schedules ?? []
    return (
      <div>
        <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Schedule</h2>
        <div className="relative rounded-3xl border border-[#CFD6EA] bg-white p-6">
          <LoadingState isLoading={schedulesLoading} fallback={<Skeleton className="h-80 w-full rounded-2xl" />}>
            {schedulesError ? (
              <div className="text-center text-red-500 text-[16px] py-20">Failed to load schedule</div>
            ) : sortedSchedules.length === 0 ? (
              <div className="text-center text-[#9a8c98] text-[16px] py-20">No schedule entries yet</div>
            ) : (
              <div className="flex max-h-[480px] flex-col gap-6 overflow-y-auto pr-2">
                {sortedSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#E3E8F6] bg-[#F7F9FF] shadow-sm"
                  >
                    {schedule.imageUrl?.url && !removedScheduleImages.has(schedule.id) ? (
                      <div className="group relative">
                        <img
                          src={resolveMediaUrl(schedule.imageUrl.url)}
                          alt={schedule.name}
                          className="h-64 w-full object-cover transition duration-300 group-hover:blur-sm group-hover:brightness-75"
                        />
                        <button
                          type="button"
                          className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100"
                          onClick={() => handleRemoveScheduleImage(schedule.id)}
                          aria-label="Remove schedule image"
                        >
                          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-black/40 text-white">
                            <Trash2 className="h-5 w-5" />
                          </span>
                        </button>
                      </div>
                    ) : null}
                    <div className="space-y-2 px-6 py-5">
                      <h3 className="text-xl font-semibold text-[#0B1327]">{schedule.name}</h3>
                      <p className="text-[#3A4156]">{schedule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LoadingState>

          {onOpenModal ? (
            <button
              onClick={() => onOpenModal("schedule")}
              className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#0D1321] text-white shadow-lg transition hover:bg-[#22223b]"
              aria-label="Add schedule"
            >
              <Plus className="h-6 w-6" />
            </button>
          ) : null}
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
          {onOpenModal ? (
            <button
              onClick={() => onOpenModal("map")}
              className="absolute bottom-6 right-6 w-12 h-12 bg-[#0D1321] text-white rounded-full flex items-center justify-center hover:bg-[#22223b] transition-colors shadow-lg"
              aria-label="Add map"
            >
              <Plus className="h-6 w-6" />
            </button>
          ) : null}
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
              <LoadingState isLoading={schedulesLoading} fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
                {schedulesError ? (
                  <p className="text-red-500 text-[16px]">Unable to load schedule</p>
                ) : schedules && schedules.length > 0 ? (
                  <div className="space-y-4">
                    {schedules.slice(0, 3).map((schedule) => (
                      <div key={schedule.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h4 className="font-medium text-[16px] text-[#0D1321]">{schedule.name}</h4>
                        <p className="mt-1 text-[14px] text-[#4a4e69]">{schedule.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[#9a8c98] text-[16px] py-8">No schedule entries yet</div>
                )}
              </LoadingState>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
