"use client"

import type { ImagePreview } from "@/hooks/tournament/useImageUpload"
import { resolveMediaUrl } from "@/lib/media"
import { useEffect, useId, useRef } from "react"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const catalog: TranslationCatalog = {
  en: { addAnnouncement: "Add Announcement", addSchedule: "Add Schedule Item", addMap: "Add Map", addNews: "Add News", addContent: "Add Content", editAnnouncement: "Edit Announcement", editMap: "Edit Map", close: "Close", replace: "Replace Image", attach: "Attach Images", drag: "Drag and Drop here", or: "or", browse: "Browse files", current: "Current announcement", currentMap: "Current map", currentImage: "Current image", noPhoto: "No photo saved", remove: "Remove", title: "Title", titlePlaceholder: "Enter post title", description: "Description", descriptionPlaceholder: "Enter post description", category: "Category", important: "Important", update: "Update", info: "Info", submitting: "Submitting...", submit: "Submit", save: "Save changes" },
  ru: { addAnnouncement: "Добавить объявление", addSchedule: "Добавить пункт расписания", addMap: "Добавить карту", addNews: "Добавить новость", addContent: "Добавить материал", editAnnouncement: "Изменить объявление", editMap: "Изменить карту", close: "Закрыть", replace: "Заменить изображение", attach: "Прикрепить изображения", drag: "Перетащите файлы сюда", or: "или", browse: "Выбрать файлы", current: "Текущее объявление", currentMap: "Текущая карта", currentImage: "Текущее изображение", noPhoto: "Фото не сохранено", remove: "Удалить", title: "Заголовок", titlePlaceholder: "Введите заголовок публикации", description: "Описание", descriptionPlaceholder: "Введите описание публикации", category: "Категория", important: "Важно", update: "Обновление", info: "Информация", submitting: "Отправка...", submit: "Отправить", save: "Сохранить изменения" },
  kk: { addAnnouncement: "Хабарландыру қосу", addSchedule: "Кесте тармағын қосу", addMap: "Карта қосу", addNews: "Жаңалық қосу", addContent: "Материал қосу", editAnnouncement: "Хабарландыруды өзгерту", editMap: "Картаны өзгерту", close: "Жабу", replace: "Суретті ауыстыру", attach: "Суреттерді тіркеу", drag: "Файлдарды осында сүйреп әкеліңіз", or: "немесе", browse: "Файлдарды шолу", current: "Ағымдағы хабарландыру", currentMap: "Ағымдағы карта", currentImage: "Ағымдағы сурет", noPhoto: "Фото сақталмаған", remove: "Жою", title: "Тақырып", titlePlaceholder: "Жазба тақырыбын енгізіңіз", description: "Сипаттама", descriptionPlaceholder: "Жазба сипаттамасын енгізіңіз", category: "Санат", important: "Маңызды", update: "Жаңарту", info: "Ақпарат", submitting: "Жіберілуде...", submit: "Жіберу", save: "Өзгерістерді сақтау" },
}

type NewsCategory = "Important" | "Update" | "Info"

type ModalContext = "announcements" | "schedule" | "map" | "news" | ""

interface AddPostModalProps {
  isOpen: boolean
  modalContext: ModalContext
  mode?: "add" | "edit"
  postTitle: string
  postDescription: string
  selectedNewsCategory: NewsCategory
  currentImageUrl?: string | null
  imagePreviews: ImagePreview[]
  uploadErrors: string[]
  isSubmitting?: boolean
  errorMessage?: string | null
  submitLabel?: string
  dzAnimate: boolean
  formatBytes: (bytes: number) => string
  onClose: () => void
  onSubmit: () => void
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCategoryChange: (value: NewsCategory) => void
  onImageUpload: (files: FileList | null) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (event: React.DragEvent) => void
  onRemoveImage: (key: string) => void
}

export function AddPostModal({
  isOpen,
  modalContext,
  mode = "add",
  postTitle,
  postDescription,
  selectedNewsCategory,
  currentImageUrl,
  imagePreviews,
  uploadErrors,
  isSubmitting = false,
  errorMessage,
  submitLabel,
  dzAnimate,
  formatBytes,
  onClose,
  onSubmit,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onImageUpload,
  onDragOver,
  onDrop,
  onRemoveImage,
}: AddPostModalProps) {
  const t = useTranslations(catalog)
  const inputId = useId()
  const dialogTitleId = useId()
  const postTitleId = useId()
  const postDescriptionId = useId()
  const categoryId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)
  const isEditMode = mode === "edit"
  const addModalTitles: Record<ModalContext, string> = {
    announcements: t("addAnnouncement"),
    schedule: t("addSchedule"),
    map: t("addMap"),
    news: t("addNews"),
    "": t("addContent"),
  }
  const modalTitle = isEditMode && modalContext === "announcements"
    ? t("editAnnouncement")
    : isEditMode && modalContext === "map"
      ? t("editMap")
      : addModalTitles[modalContext]
  const resolvedSubmitLabel = submitLabel === "Save changes" ? t("save") : submitLabel === "Submit" ? t("submit") : submitLabel
  const resolvedCurrentImageUrl = resolveMediaUrl(currentImageUrl)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    closeButtonRef.current?.focus()

    return () => {
      previouslyFocusedElementRef.current?.focus()
      previouslyFocusedElementRef.current = null
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose()
        }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id={dialogTitleId} className="text-[#0D1321] text-[32px] font-bold">{modalTitle}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="space-y-6"
        >
          <div>
            <p className="block text-[#9a8c98] text-[18px] font-medium mb-4">
              {isEditMode ? t("replace") : t("attach")}
            </p>
            <div className="md:flex md:items-start md:gap-6">
              <button
                type="button"
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`relative border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#3E5C76] transition-colors cursor-pointer w-full md:flex-1 md:min-h-[360px] ${dzAnimate ? "dz-animate" : ""}`}
                onClick={() => document.getElementById(inputId)?.click()}
                aria-label={isEditMode ? t("replace") : t("attach")}
              >
                <span className="flex flex-col items-center space-y-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-[#4a4e69]">
                    <span className="mb-2 block text-[18px] font-medium">{t("drag")}</span>
                    <span className="mb-2 block text-[16px]">{t("or")}</span>
                    <span className="block text-[16px] font-medium text-[#3E5C76] hover:underline">{t("browse")}</span>
                  </span>
                </span>
              </button>
              <input
                id={inputId}
                type="file"
                multiple={!isEditMode && modalContext !== "map"}
                accept="image/jpeg,image/png"
                onChange={(event) => {
                  onImageUpload(event.currentTarget.files)
                  event.currentTarget.value = ""
                }}
                className="hidden"
              />

              {isEditMode && resolvedCurrentImageUrl && imagePreviews.length === 0 ? (
                <div className="mt-4 md:mt-0 md:w-[260px]">
                  <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
                    <img src={resolvedCurrentImageUrl} alt={modalContext === "map" ? t("currentMap") : t("current")} className="h-40 w-full bg-[#F7F9FF] object-contain" />
                    <div className="px-3 py-2 text-sm font-medium text-[#4a4e69]">{t("currentImage")}</div>
                  </div>
                </div>
              ) : null}

              {isEditMode && !resolvedCurrentImageUrl && imagePreviews.length === 0 ? (
                <div className="mt-4 md:mt-0 md:w-[260px] rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-[#8A91A8]">
                  {t("noPhoto")}
                </div>
              ) : null}

              {imagePreviews.length > 0 && (
                <div className="mt-4 md:mt-0 md:w-[260px] space-y-4">
                  {imagePreviews.map((img) => {
                    const ext = img.name.includes(".") ? img.name.split(".").pop()?.toUpperCase() : ""
                    return (
                      <div key={img.key} className="relative">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-md border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                            {img.src ? (
                              <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[12px] font-medium text-[#0D1321]">{ext}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[20px] text-[#0D1321] font-medium truncate" title={img.name}>
                              {img.name}
                            </div>
                            <div className="text-[14px] text-[#0D1321]/60">{formatBytes(img.sizeBytes)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveImage(img.key)}
                            className="ml-auto w-6 h-6 aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-black/60 text-white"
                            aria-label={`${t("remove")} ${img.name}`}
                            title={`${t("remove")} ${img.name}`}
                          >
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                        {img.status !== "done" && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-[#3E5C76]" style={{ width: `${img.progress}%` }} />
                          </div>
                        )}
                        {img.status === "error" && (
                          <p className="text-xs text-red-500 mt-1">{img.error}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {uploadErrors.length > 0 && (
              <div className="mt-4 text-sm text-red-500">
                <ul className="list-disc list-inside space-y-1">
                  {uploadErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {(modalContext === "announcements" || modalContext === "schedule" || modalContext === "map" || modalContext === "news") && (
            <div className="space-y-6">
              <div>
                <label htmlFor={postTitleId} className="block text-[#4a4e69] text-[16px] font-medium mb-3">{t("title")}</label>
                <input
                  id={postTitleId}
                  type="text"
                  value={postTitle}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                  placeholder={t("titlePlaceholder")}
                  maxLength={modalContext === "map" ? 120 : undefined}
                  required
                />
              </div>
              <div>
                <label htmlFor={postDescriptionId} className="block text-[#4a4e69] text-[16px] font-medium mb-3">{t("description")}</label>
                <textarea
                  id={postDescriptionId}
                  value={postDescription}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69] resize-vertical"
                  placeholder={t("descriptionPlaceholder")}
                  maxLength={modalContext === "map" ? 5000 : undefined}
                  required
                />
              </div>
              {modalContext === "announcements" && (
                <div>
                  <label htmlFor={categoryId} className="block text-[#4a4e69] text-[16px] font-medium mb-3">{t("category")}</label>
                  <select
                    id={categoryId}
                    value={selectedNewsCategory}
                    onChange={(event) => onCategoryChange(event.target.value as NewsCategory)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                  >
                    <option value="Important">{t("important")}</option>
                    <option value="Update">{t("update")}</option>
                    <option value="Info">{t("info")}</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {errorMessage ? (
            <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[18px] font-medium transition-colors disabled:opacity-60"
            >
              {isSubmitting ? t("submitting") : resolvedSubmitLabel ?? t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
