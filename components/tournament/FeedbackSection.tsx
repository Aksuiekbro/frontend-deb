"use client"

import { useMemo, useState } from "react"
import { ArrowUp, MessageSquare } from "lucide-react"

import { api } from "@/lib/api"
import type { PageResult } from "@/types/page"
import type { FeedbackRequest, FeedbackResponse } from "@/types/tournament/feedback"

interface FeedbackSectionProps {
  tournamentId: number
  feedbacks?: PageResult<FeedbackResponse>
  feedbacksLoading: boolean
  feedbacksError?: Error
  onFeedbackAdded?: () => Promise<unknown> | unknown
}

export function FeedbackSection({
  tournamentId,
  feedbacks,
  feedbacksLoading,
  feedbacksError,
  onFeedbackAdded,
}: FeedbackSectionProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const items = useMemo(() => feedbacks?.content ?? [], [feedbacks])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) {
      setSubmitError("Title and feedback are required")
      return
    }

    const payload: FeedbackRequest = {
      title: trimmedTitle,
      content: trimmedContent,
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await api.addFeedback(tournamentId, payload)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Failed to submit feedback")
      }

      setTitle("")
      setContent("")
      await onFeedbackAdded?.()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const renderBody = () => {
    if (feedbacksLoading) {
      return <p className="text-center text-[#7A8096]">Loading feedback…</p>
    }

    if (feedbacksError) {
      return <p className="text-center text-red-500">Failed to load feedback</p>
    }

    if (!items.length) {
      return <p className="text-center text-[#9a8c98]">No feedback yet</p>
    }

    return (
      <div className="space-y-8">
        {items.map((item) => {
          const displayName = `${item.user.firstName ?? ""} ${item.user.lastName ?? ""}`.trim() || item.user.username
          const avatarUrl = item.user.imageUrl?.url ?? "/placeholder-user.jpg"
          const timestamp = new Date(item.timestamp).toLocaleString()

          return (
            <article key={item.id} className="rounded-3xl border border-[#ECEFF6] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-[#E7EAF3] bg-[#F6F8FD]">
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-semibold text-[#0B1327]">{displayName}</p>
                    <p className="text-sm text-[#8B93AC]">{timestamp}{item.edited ? " · edited" : ""}</p>
                  </div>
                  <p className="mt-3 text-[1.05rem] leading-relaxed text-[#101737]">{item.title}</p>
                  <p className="mt-2 text-[#0F1423] text-[0.98rem] leading-relaxed">{item.content}</p>
                  {item.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#3E5C76]">
                      {item.tags.map((tag) => (
                        <span key={tag.name} className="rounded-full bg-[#EEF2FB] px-3 py-1">#{tag.name}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="border-b border-[#E7EAF3] pb-4">
        <h2 className="text-3xl font-semibold text-[#0B1327]">Feedback</h2>
      </div>

      <div className="mt-8">{renderBody()}</div>

      <div className="sticky bottom-6 mt-10 rounded-2xl border border-[#E7EAF3] bg-white p-4 shadow-lg">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-lg bg-[#F4F6FB] px-4 py-3 text-sm text-[#0F1423] outline-none focus:ring-1 focus:ring-[#CBD3EC]"
          />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-[#E7EAF3]">
              <img src="/placeholder-user.jpg" alt="" className="h-full w-full object-cover" />
            </div>
            <input
              type="text"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Add feedback..."
              className="flex-1 rounded-full bg-[#F4F6FB] px-4 py-3 text-sm text-[#0F1423] outline-none focus:ring-1 focus:ring-[#CBD3EC]"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E456E] text-white transition hover:bg-[#1B2C4C] disabled:opacity-60"
              aria-label="Submit feedback"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-[#9a8c98]">
            <div className="flex items-center gap-2 text-[#1D2640]">
              <MessageSquare className="h-4 w-4" />
              Share constructive suggestions with organizers
            </div>
            {submitError && <span className="text-red-500">{submitError}</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
