"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface EditTeamModalProps {
  isOpen: boolean
  teamName?: string
  clubName?: string
  isSaving?: boolean
  onClose: () => void
  onSave: (values: { name: string; club: string }) => Promise<void> | void
}

export function EditTeamModal({ isOpen, teamName = "", clubName = "", isSaving = false, onClose, onSave }: EditTeamModalProps) {
  const [name, setName] = useState(teamName)
  const [club, setClub] = useState(clubName)

  useEffect(() => {
    setName(teamName)
    setClub(clubName)
  }, [teamName, clubName])

  const handleSubmit = async () => {
    if (!name.trim() || isSaving) return
    await onSave({ name: name.trim(), club: club.trim() })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl border border-[#E2E6F2] bg-white p-8 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#0B1327]">Edit team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-[#4A5168]">Team name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} className="mt-2" placeholder="Enter team name" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#4A5168]">Club</label>
            <Input value={club} onChange={(event) => setClub(event.target.value)} className="mt-2" placeholder="Enter club name" />
          </div>
        </div>
        <DialogFooter className="flex w-full flex-row gap-4">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-[#0B1327] px-6 py-3 text-sm font-semibold text-[#4A5A7A] transition hover:bg-[#EEF2FB]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-[#2B3F63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E2D48] disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
