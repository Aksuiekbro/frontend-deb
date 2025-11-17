"use client"

import { useState } from "react"
import { ArrowUp, MessageSquare, Pencil, Reply, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react"

interface FeedbackComment {
  id: number
  name: string
  username: string
  avatar: string
  message: string
  likes: number
  dislikes: number
  timestamp: string
  replies: number
}

const MOCK_COMMENTS: FeedbackComment[] = [
  {
    id: 1,
    name: "Niceass",
    username: "@nice_ass",
    avatar: "/feedback/niceass.jpg",
    message: "Actually I love debetter it is very simple and minimalistic. The design is very human!",
    likes: 12,
    dislikes: 1,
    timestamp: "2 min",
    replies: 4,
  },
  {
    id: 2,
    name: "Hair_ass",
    username: "@hair_ass",
    avatar: "/feedback/hairass.jpg",
    message: "Actually I love debetter it is very simple and minimalistic. The design is very human!",
    likes: 8,
    dislikes: 0,
    timestamp: "8 min",
    replies: 0,
  },
]

export function FeedbackSection() {
  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [draft, setDraft] = useState("")

  const handleReaction = (id: number, type: "like" | "dislike") => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === id
          ? {
              ...comment,
              likes: type === "like" ? comment.likes + 1 : comment.likes,
              dislikes: type === "dislike" ? comment.dislikes + 1 : comment.dislikes,
            }
          : comment
      )
    )
  }

  const handleSubmit = () => {
    if (!draft.trim()) return
    setComments((prev) => [
      {
        id: Date.now(),
        name: "You",
        username: "@you",
        avatar: "/placeholder-user.jpg",
        message: draft.trim(),
        likes: 0,
        dislikes: 0,
        timestamp: "just now",
        replies: 0,
      },
      ...prev,
    ])
    setDraft("")
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="border-b border-[#E7EAF3] pb-4">
        <h2 className="text-3xl font-semibold text-[#0B1327]">Feedback</h2>
      </div>

      <div className="mt-8 space-y-8">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-3xl border border-[#ECEFF6] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-[#E7EAF3]">
                <img
                  src={comment.avatar}
                  alt={comment.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-[#0B1327]">{comment.name}</p>
                  <p className="text-sm text-[#8B93AC]">{comment.username}</p>
                </div>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-[#101737]">{comment.message}</p>
                <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-[#7A8096]">
                  <button
                    className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1 transition hover:border-[#CBD3EC] hover:text-[#162042]"
                    onClick={() => handleReaction(comment.id, "like")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {comment.likes}
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1 transition hover:border-[#CBD3EC] hover:text-[#162042]"
                    onClick={() => handleReaction(comment.id, "dislike")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    {comment.dislikes}
                  </button>
                  <span>{comment.timestamp}</span>
                  <button className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1 transition hover:border-[#CBD3EC] hover:text-[#162042]">
                    <Reply className="h-4 w-4" />
                    Reply
                  </button>
                  <button className="flex items-center gap-1 rounded-full border border-transparent px-2 py-1 transition hover:border-[#CBD3EC] hover:text-[#162042]">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="flex items-center gap-1 rounded-full border border-transparent px-2 py-1 transition hover:border-[#CBD3EC] hover:text-[#B42318]">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
                <button className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1D2640] transition hover:text-[#2F3E68]">
                  <MessageSquare className="h-4 w-4" />
                  {comment.replies ? `View Replies (${comment.replies})` : "Reply"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="sticky bottom-6 mt-10 rounded-full border border-[#E7EAF3] bg-white p-2 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-[#E7EAF3]">
            <img src="/placeholder-user.jpg" alt="" className="h-full w-full object-cover" />
          </div>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add comment..."
            className="flex-1 rounded-full bg-[#F4F6FB] px-4 py-3 text-sm text-[#0F1423] outline-none focus:ring-1 focus:ring-[#CBD3EC]"
          />
          <button
            onClick={handleSubmit}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E456E] text-white transition hover:bg-[#1B2C4C]"
            aria-label="Submit feedback"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
