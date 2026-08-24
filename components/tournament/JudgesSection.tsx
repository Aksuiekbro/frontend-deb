"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import type { PageResult } from "@/types/page"
import type { JudgeResponse } from "@/types/tournament/judge"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: { name: "Name", email: "Email", phone: "Phone", checkIn: "Check In", actions: "Actions", loading: "Loading judges...", failed: "Failed to load judges", uncheck: "Uncheck", check: "Check in", edit: "Edit", delete: "Delete", empty: "No judges assigned yet", add: "Add judge" },
  ru: { name: "Имя", email: "Электронная почта", phone: "Телефон", checkIn: "Регистрация", actions: "Действия", loading: "Загрузка судей...", failed: "Не удалось загрузить судей", uncheck: "Отменить регистрацию", check: "Зарегистрировать", edit: "Изменить", delete: "Удалить", empty: "Судьи пока не назначены", add: "Добавить судью" },
  kk: { name: "Аты-жөні", email: "Электрондық пошта", phone: "Телефон", checkIn: "Тіркеу", actions: "Әрекеттер", loading: "Судьялар жүктелуде...", failed: "Судьяларды жүктеу мүмкін болмады", uncheck: "Тіркеуден шығару", check: "Тіркеу", edit: "Өзгерту", delete: "Жою", empty: "Судьялар әлі тағайындалмаған", add: "Судья қосу" },
}

interface JudgesSectionProps {
  judges?: PageResult<JudgeResponse>
  judgesLoading: boolean
  judgesError?: Error
  onAddJudge?: () => void
  onToggleJudgeCheckIn?: (judge: JudgeResponse) => void
  onEditJudge?: (judge: JudgeResponse) => void
  onDeleteJudge?: (judge: JudgeResponse) => void
  updatingJudgeId?: number | null
  deletingJudgeId?: number | null
}

export function JudgesSection({
  judges,
  judgesLoading,
  judgesError,
  onAddJudge,
  onToggleJudgeCheckIn,
  onEditJudge,
  onDeleteJudge,
  updatingJudgeId,
  deletingJudgeId,
}: JudgesSectionProps) {
  const t = useTranslations(catalog)
  const rows = judges?.content ?? []
  const hasActions = Boolean(onEditJudge || onDeleteJudge)
  const columnCount = hasActions ? 5 : 4

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("name")}</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("email")}</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">{t("phone")}</th>
              <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("checkIn")}</th>
              {hasActions ? (
                <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">{t("actions")}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {judgesLoading ? (
              <tr>
                <td colSpan={columnCount} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                  {t("loading")}
                </td>
              </tr>
            ) : judgesError ? (
              <tr>
                <td colSpan={columnCount} className="border border-gray-300 px-6 py-8 text-center text-red-500">
                  {t("failed")}
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((judge) => (
                <tr key={judge.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-6 py-4 text-[#0D1321] font-medium">{judge.fullName}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69]">{judge.email || "—"}</td>
                  <td className="border border-gray-300 px-6 py-4 text-[#4a4e69]">{judge.phoneNumber || "—"}</td>
                  <td className="border border-gray-300 px-6 py-4 text-center text-[#0D1321]">
                    {onToggleJudgeCheckIn ? (
                      <button
                        type="button"
                        onClick={() => onToggleJudgeCheckIn(judge)}
                        disabled={updatingJudgeId === judge.id}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold transition ${
                          judge.checkedIn
                            ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                            : "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        aria-label={`${judge.checkedIn ? t("uncheck") : t("check")} ${judge.fullName}`}
                      >
                        {updatingJudgeId === judge.id ? "..." : judge.checkedIn ? "✓" : "✕"}
                      </button>
                    ) : (
                      judge.checkedIn ? <span className="text-green-600">✓</span> : <span className="text-red-500">✕</span>
                    )}
                  </td>
                  {hasActions ? (
                    <td className="border border-gray-300 px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        {onEditJudge ? (
                          <button
                            type="button"
                            onClick={() => onEditJudge(judge)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0D1321] hover:bg-gray-50"
                            aria-label={`${t("edit")} ${judge.fullName}`}
                            title={`${t("edit")} ${judge.fullName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                        {onDeleteJudge ? (
                          <button
                            type="button"
                            onClick={() => onDeleteJudge(judge)}
                            disabled={deletingJudgeId === judge.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`${t("delete")} ${judge.fullName}`}
                            title={`${t("delete")} ${judge.fullName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnCount} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                  {t("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {onAddJudge && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onAddJudge}
            className="w-12 h-12 bg-[#3E5C76] hover:bg-[#2D3748] text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            aria-label={t("add")}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  )
}
