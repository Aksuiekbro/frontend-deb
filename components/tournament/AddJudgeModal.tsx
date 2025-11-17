"use client"

import type { FormEvent } from "react"

interface JudgeForm {
  name: string
  club: string
  phone: string
}

interface AddJudgeModalProps {
  isOpen: boolean
  form: JudgeForm
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof JudgeForm, value: string) => void
}

export function AddJudgeModal({ isOpen, form, onClose, onSubmit, onChange }: AddJudgeModalProps) {
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
              Name
            </label>
            <input
              id="judge-name"
              type="text"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder="Enter judge name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-club">
              Club
            </label>
            <input
              id="judge-club"
              type="text"
              value={form.club}
              onChange={(event) => onChange("club", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder="Enter club name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-phone">
              Phone
            </label>
            <input
              id="judge-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder="Enter phone number"
            />
          </div>

          <button type="submit" className="w-full bg-[#3E5C76] hover:bg-[#2f4858] text-white text-[18px] font-semibold py-3 rounded-2xl transition-colors shadow-md">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
