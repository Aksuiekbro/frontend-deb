"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: { title: "Edit team", description: "Update the team name, club, and participant usernames.", team: "Team name", teamPlaceholder: "Enter team name", club: "Club", clubPlaceholder: "Enter club name", participants: "Participants", speaker: "Speaker {n} username", optional: "Speaker 3 username", cancel: "Cancel", saving: "Saving...", save: "Save" },
  ru: { title: "Изменить команду", description: "Обновите название команды, клуб и имена участников.", team: "Название команды", teamPlaceholder: "Введите название команды", club: "Клуб", clubPlaceholder: "Введите название клуба", participants: "Участники", speaker: "Имя пользователя спикера {n}", optional: "Имя пользователя спикера 3", cancel: "Отмена", saving: "Сохранение...", save: "Сохранить" },
  kk: { title: "Команданы өзгерту", description: "Команда атауын, клубты және қатысушылардың пайдаланушы аттарын жаңартыңыз.", team: "Команда атауы", teamPlaceholder: "Команда атауын енгізіңіз", club: "Клуб", clubPlaceholder: "Клуб атауын енгізіңіз", participants: "Қатысушылар", speaker: "{n}-спикердің пайдаланушы аты", optional: "3-спикердің пайдаланушы аты", cancel: "Бас тарту", saving: "Сақталуда...", save: "Сақтау" },
}

interface EditTeamModalProps {
  isOpen: boolean
  teamName?: string
  clubName?: string
  speakerUsernames?: string[]
  isSaving?: boolean
  onClose: () => void
  onSave: (values: { name: string; club: string; speakerUsernames: string[] }) => Promise<void> | void
}

const EMPTY_SPEAKER_USERNAMES: string[] = []

export function EditTeamModal({
  isOpen,
  teamName = "",
  clubName = "",
  speakerUsernames = EMPTY_SPEAKER_USERNAMES,
  isSaving = false,
  onClose,
  onSave,
}: EditTeamModalProps) {
  const t = useTranslations(catalog)
  const [name, setName] = useState(teamName)
  const [club, setClub] = useState(clubName)
  const [speakers, setSpeakers] = useState<string[]>(["", "", ""])
  const firstSpeakerUsername = speakerUsernames[0] ?? ""
  const secondSpeakerUsername = speakerUsernames[1] ?? ""
  const thirdSpeakerUsername = speakerUsernames[2] ?? ""

  useEffect(() => {
    setName(teamName)
    setClub(clubName)
    setSpeakers([firstSpeakerUsername, secondSpeakerUsername, thirdSpeakerUsername])
  }, [teamName, clubName, firstSpeakerUsername, secondSpeakerUsername, thirdSpeakerUsername])

  const handleSubmit = async () => {
    if (!name.trim() || isSaving) return
    await onSave({
      name: name.trim(),
      club: club.trim(),
      speakerUsernames: speakers.map((speaker) => speaker.trim()),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl border border-[#E2E6F2] bg-white p-8 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#0B1327]">{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-[#4A5168]">{t("team")}</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} className="mt-2" placeholder={t("teamPlaceholder")} />
          </div>
          <div>
            <label className="text-sm font-medium text-[#4A5168]">{t("club")}</label>
            <Input value={club} onChange={(event) => setClub(event.target.value)} className="mt-2" placeholder={t("clubPlaceholder")} />
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium text-[#4A5168]">{t("participants")}</label>
            {speakers.map((speaker, index) => (
              <Input
                key={index}
                value={speaker}
                onChange={(event) => {
                  const next = [...speakers]
                  next[index] = event.target.value
                  setSpeakers(next)
                }}
                placeholder={index === 2 ? t("optional") : t("speaker", { n: index + 1 })}
                aria-label={index === 2 ? t("optional") : t("speaker", { n: index + 1 })}
              />
            ))}
          </div>
        </div>
        <DialogFooter className="flex w-full flex-row gap-4">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-[#0B1327] px-6 py-3 text-sm font-semibold text-[#4A5A7A] transition hover:bg-[#EEF2FB]"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-[#2B3F63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E2D48] disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? t("saving") : t("save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
