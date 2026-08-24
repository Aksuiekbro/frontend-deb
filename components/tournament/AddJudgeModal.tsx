"use client"

import type { FormEvent } from "react"
import type { JudgeRequest } from "@/types/tournament/judge"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: { add: "Add Judge", edit: "Edit Judge", submit: "Submit", close: "Close judge modal", fullName: "Full name", namePlaceholder: "Enter judge name", email: "Email", emailPlaceholder: "Enter email", phone: "Phone", phonePlaceholder: "Enter phone number", saving: "Saving..." },
  ru: { add: "Добавить судью", edit: "Изменить судью", submit: "Отправить", close: "Закрыть окно судьи", fullName: "Полное имя", namePlaceholder: "Введите имя судьи", email: "Электронная почта", emailPlaceholder: "Введите электронную почту", phone: "Телефон", phonePlaceholder: "Введите номер телефона", saving: "Сохранение..." },
  kk: { add: "Судья қосу", edit: "Судьяны өзгерту", submit: "Жіберу", close: "Судья терезесін жабу", fullName: "Толық аты-жөні", namePlaceholder: "Судьяның атын енгізіңіз", email: "Электрондық пошта", emailPlaceholder: "Электрондық поштаны енгізіңіз", phone: "Телефон", phonePlaceholder: "Телефон нөмірін енгізіңіз", saving: "Сақталуда..." },
}

interface AddJudgeModalProps {
  isOpen: boolean
  form: JudgeRequest
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof JudgeRequest, value: string) => void
  isSubmitting?: boolean
  errorMessage?: string | null
  title?: string
  submitLabel?: string
}

export function AddJudgeModal({
  isOpen,
  form,
  onClose,
  onSubmit,
  onChange,
  isSubmitting,
  errorMessage,
  title = "Add Judge",
  submitLabel = "Submit",
}: AddJudgeModalProps) {
  const t = useTranslations(catalog)
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
        <button type="button" onClick={onClose} className="absolute top-3 right-4 text-3xl text-[#9a8c98] hover:text-[#0D1321] transition" aria-label={t("close")}>
          ×
        </button>
        <h2 className="text-center text-[32px] font-bold text-[#0D1321] mb-8">{title === "Edit Judge" ? t("edit") : title === "Add Judge" ? t("add") : title}</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-name">
              {t("fullName")}
            </label>
            <input
              id="judge-name"
              type="text"
              value={form.fullName ?? ""}
              onChange={(event) => onChange("fullName", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder={t("namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-email">
              {t("email")}
            </label>
            <input
              id="judge-email"
              type="email"
              value={form.email ?? ""}
              onChange={(event) => onChange("email", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#0D1321] text-[16px] font-medium" htmlFor="judge-phone">
              {t("phone")}
            </label>
            <input
              id="judge-phone"
              type="tel"
              value={form.phoneNumber ?? ""}
              onChange={(event) => onChange("phoneNumber", event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-[#F8F8F8] px-4 py-3 text-[#0D1321] text-[16px] focus:border-[#3E5C76] focus:ring-2 focus:ring-[#3E5C76]/20 outline-none transition-all"
              placeholder={t("phonePlaceholder")}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500" role="alert">{errorMessage}</p>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#3E5C76] hover:bg-[#2f4858] text-white text-[18px] font-semibold py-3 rounded-2xl transition-colors shadow-md disabled:opacity-60">
            {isSubmitting ? t("saving") : submitLabel ?? t("submit")}
          </button>
        </form>
      </div>
    </div>
  )
}
