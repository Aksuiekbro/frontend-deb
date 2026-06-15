"use client"

import type { FormEvent } from "react"
import type { JudgeRequest } from "@/types/tournament/judge"

interface AddJudgeModalProps {
  isOpen: boolean
  form: JudgeRequest
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof JudgeRequest, value: string) => void
  isSubmitting?: boolean
  errorMessage?: string | null
}

export function AddJudgeModal({ isOpen, form, onClose, onSubmit, onChange, isSubmitting, errorMessage }: AddJudgeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
        <button type="button" onClick={onClose} className="absolute top-3 right-4 text-3xl text-[#9a8c98] hover:text-[#0D1321] transition" aria-label="Close add judge modal">
          ×
        </button>
        <h2 className="text-center text-[32px] font-bold text-[#0D1321] mb-8">Add Judge</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-name">
              Full name
            </label>
            <input
              id="judge-name"
              type="text"
              value={form.fullName ?? ""}
              onChange={(event) => onChange("fullName", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder="Enter judge name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-email">
              Email
            </label>
            <input
              id="judge-email"
              type="email"
              value={form.email ?? ""}
              onChange={(event) => onChange("email", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder="Enter email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-phone">
              Phone
            </label>
            <input
              id="judge-phone"
              type="tel"
              value={form.phoneNumber ?? ""}
              onChange={(event) => onChange("phoneNumber", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder="Enter phone number"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500" role="alert">{errorMessage}</p>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#3E5C76] hover:bg-[#2f4858] text-white text-[18px] font-semibold py-3 rounded-2xl transition-colors shadow-md disabled:opacity-60">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
