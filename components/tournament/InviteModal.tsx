"use client"

import { resolveMediaUrl } from "@/lib/media"
import type { SimpleTournamentParticipantResponse } from "@/types/tournament/tournament-participant"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: { invite: "Invite", copy: "Copy link", access: "Who Has Access", participant: "Participant", empty: "No tournament members yet", close: "Close invite" },
  ru: { invite: "Пригласить", copy: "Скопировать ссылку", access: "У кого есть доступ", participant: "Участник", empty: "У турнира пока нет участников", close: "Закрыть приглашение" },
  kk: { invite: "Шақыру", copy: "Сілтемені көшіру", access: "Кімнің қолы жетімді", participant: "Қатысушы", empty: "Турнирде әзірге мүше жоқ", close: "Шақыруды жабу" },
}

type InviteModalTab = "invite" | "copy-link"

interface InviteModalProps {
  isOpen: boolean
  members: SimpleTournamentParticipantResponse[]
  activeTab: InviteModalTab
  onTabChange: (tab: InviteModalTab) => void
  onClose: () => void
}

export function InviteModal({ isOpen, members, activeTab, onTabChange, onClose }: InviteModalProps) {
  const t = useTranslations(catalog)
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#0D1321] text-[24px] font-bold">{t("invite")}</h2>
          <button onClick={onClose} aria-label={t("close")} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="flex mb-6">
          {(["invite", "copy-link"] as InviteModalTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 text-center py-2 border-b-2 font-medium transition-colors ${
                activeTab === tab ? "border-[#0D1321] text-[#0D1321]" : "border-gray-300 text-[#9a8c98] hover:text-[#4a4e69]"
              }`}
            >
              {tab === "invite" ? t("invite") : t("copy")}
            </button>
          ))}
        </div>

        <div>
          <h3 className="text-[#0D1321] text-[16px] font-medium mb-4">{t("access")}</h3>
          <div className="space-y-3">
            {members.length > 0 ? (
              members.map((participant) => {
                const name = `${participant.user.firstName ?? ""} ${participant.user.lastName ?? ""}`.trim() || participant.user.username
                const avatar = resolveMediaUrl(participant.user.imageUrl?.url)
                return (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {avatar ? (
                        <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">{name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-[#4a4e69] text-[16px]">{name}</span>
                    </div>
                    <span className="text-[#9a8c98] text-[14px]">{t("participant")}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-[#9a8c98] text-[14px] py-4">{t("empty")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
