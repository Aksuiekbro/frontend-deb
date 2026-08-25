"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Edit3, Trash2 } from "lucide-react"
import { useSWRConfig } from "swr"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCurrentUser, useSingleNews } from "@/hooks/use-api"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n"
import { resolveMediaUrl } from "@/lib/media"

const catalog: TranslationCatalog = {
  en: {
    back: "Back to News",
    loading: "Loading news...",
    loadFailed: "Failed to load this News post.",
    notFound: "News post not found.",
    by: "By {name}",
    edit: "Edit",
    delete: "Delete",
    title: "Title",
    article: "Article",
    replaceCover: "Replace cover photo",
    addPhotos: "Add gallery photos",
    currentPhotos: "Current gallery photos",
    newPhotos: "New gallery photos",
    newPhoto: "New photo {number}",
    removePhoto: "Remove gallery photo {number}",
    removeNewPhoto: "Remove new photo {number}",
    movePhotoEarlier: "Move gallery photo {number} earlier",
    movePhotoLater: "Move gallery photo {number} later",
    moveNewPhotoEarlier: "Move new photo {number} earlier",
    moveNewPhotoLater: "Move new photo {number} later",
    cancel: "Cancel",
    save: "Save changes",
    saving: "Saving...",
    saveFailed: "Could not save the News post.",
    required: "Title and article text are required.",
    tooManyPhotos: "A News post can contain at most 10 gallery photos.",
    deleteTitle: "Delete this News post?",
    deleteDescription: "This action cannot be undone. The article and its photos will be removed.",
    deleting: "Deleting...",
    deleteFailed: "Could not delete the News post.",
    coverAlt: "{title} cover",
    photoAlt: "{title} photo {number}",
  },
  ru: {
    back: "Назад к новостям",
    loading: "Загрузка новости...",
    loadFailed: "Не удалось загрузить эту новость.",
    notFound: "Новость не найдена.",
    by: "Автор: {name}",
    edit: "Изменить",
    delete: "Удалить",
    title: "Заголовок",
    article: "Статья",
    replaceCover: "Заменить обложку",
    addPhotos: "Добавить фотографии",
    currentPhotos: "Текущие фотографии",
    newPhotos: "Новые фотографии",
    newPhoto: "Новая фотография {number}",
    removePhoto: "Удалить фотографию {number}",
    removeNewPhoto: "Удалить новую фотографию {number}",
    movePhotoEarlier: "Переместить фотографию {number} раньше",
    movePhotoLater: "Переместить фотографию {number} позже",
    moveNewPhotoEarlier: "Переместить новую фотографию {number} раньше",
    moveNewPhotoLater: "Переместить новую фотографию {number} позже",
    cancel: "Отмена",
    save: "Сохранить изменения",
    saving: "Сохранение...",
    saveFailed: "Не удалось сохранить новость.",
    required: "Укажите заголовок и текст статьи.",
    tooManyPhotos: "К новости можно прикрепить не более 10 фотографий.",
    deleteTitle: "Удалить эту новость?",
    deleteDescription: "Это действие нельзя отменить. Статья и фотографии будут удалены.",
    deleting: "Удаление...",
    deleteFailed: "Не удалось удалить новость.",
    coverAlt: "Обложка: {title}",
    photoAlt: "{title}: фотография {number}",
  },
  kk: {
    back: "Жаңалықтарға оралу",
    loading: "Жаңалық жүктелуде...",
    loadFailed: "Бұл жаңалықты жүктеу мүмкін болмады.",
    notFound: "Жаңалық табылмады.",
    by: "Авторы: {name}",
    edit: "Өзгерту",
    delete: "Жою",
    title: "Тақырып",
    article: "Мақала",
    replaceCover: "Мұқабаны ауыстыру",
    addPhotos: "Фотосуреттер қосу",
    currentPhotos: "Қазіргі фотосуреттер",
    newPhotos: "Жаңа фотосуреттер",
    newPhoto: "{number}-жаңа фотосурет",
    removePhoto: "{number}-фотосуретті жою",
    removeNewPhoto: "{number}-жаңа фотосуретті жою",
    movePhotoEarlier: "{number}-фотосуретті ертерек жылжыту",
    movePhotoLater: "{number}-фотосуретті кейінірек жылжыту",
    moveNewPhotoEarlier: "{number}-жаңа фотосуретті ертерек жылжыту",
    moveNewPhotoLater: "{number}-жаңа фотосуретті кейінірек жылжыту",
    cancel: "Бас тарту",
    save: "Өзгерістерді сақтау",
    saving: "Сақталуда...",
    saveFailed: "Жаңалықты сақтау мүмкін болмады.",
    required: "Тақырып пен мақала мәтінін енгізіңіз.",
    tooManyPhotos: "Жаңалыққа ең көбі 10 фотосурет тіркеуге болады.",
    deleteTitle: "Бұл жаңалық жойылсын ба?",
    deleteDescription: "Бұл әрекетті болдырмау мүмкін емес. Мақала мен фотосуреттер жойылады.",
    deleting: "Жойылуда...",
    deleteFailed: "Жаңалықты жою мүмкін болмады.",
    coverAlt: "{title} мұқабасы",
    photoAlt: "{title}: {number}-фотосурет",
  },
}

type GalleryItem =
  | { kind: "existing"; imageId: number }
  | { kind: "new"; key: number; file: File }

let nextGalleryItemKey = 1

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return items
  }

  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(fromIndex, 1)
  reorderedItems.splice(toIndex, 0, movedItem)
  return reorderedItems
}

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const newsId = Number(params.id)
  const { newsItem, isLoading, error, mutate: mutateNewsItem } = useSingleNews(newsId)
  const { user: currentUser } = useCurrentUser()
  const { mutate: mutateCache } = useSWRConfig()
  const { locale } = useLocale()
  const t = useTranslations(catalog)

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [article, setArticle] = useState("")
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [initialGalleryImageIds, setInitialGalleryImageIds] = useState<number[]>([])
  const [newCover, setNewCover] = useState<File>()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const existingImages = newsItem?.images ?? []
  const existingImagesById = new Map(existingImages.map((image) => [image.id, image]))
  const isOwner = Boolean(newsItem && currentUser && newsItem.user?.id === currentUser.id)

  const beginEditing = () => {
    if (!newsItem) return
    setTitle(newsItem.title)
    setArticle(newsItem.content)
    const imageIds = existingImages.map((image) => image.id)
    setGalleryItems(imageIds.map((imageId) => ({ kind: "existing", imageId })))
    setInitialGalleryImageIds(imageIds)
    setNewCover(undefined)
    setActionError(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setActionError(null)
    setIsEditing(false)
  }

  const saveChanges = async () => {
    if (!newsItem || !isOwner) return
    const nextTitle = title.trim()
    const nextArticle = article.trim()

    if (!nextTitle || !nextArticle) {
      setActionError(t("required"))
      return
    }
    if (galleryItems.length > 10) {
      setActionError(t("tooManyPhotos"))
      return
    }

    const retainedImageIds: number[] = []
    const newImages: File[] = []
    const newImagePositions: number[] = []
    galleryItems.forEach((item, position) => {
      if (item.kind === "existing") {
        retainedImageIds.push(item.imageId)
      } else {
        newImages.push(item.file)
        newImagePositions.push(position)
      }
    })
    const galleryChanged = galleryItems.length !== initialGalleryImageIds.length
      || galleryItems.some((item, index) => (
        item.kind !== "existing" || item.imageId !== initialGalleryImageIds[index]
      ))

    try {
      setIsSaving(true)
      setActionError(null)
      const response = await api.updateNews(
        newsItem.id,
        {
          title: nextTitle,
          content: nextArticle,
        },
        newCover,
        galleryChanged && newImages.length > 0 ? newImages : undefined,
        galleryChanged ? retainedImageIds : undefined,
        galleryChanged && newImages.length > 0 ? newImagePositions : undefined,
      )

      if (!response.ok) {
        throw new Error(await readResponseError(response, { fallback: t("saveFailed") }))
      }

      const updatedNews = await response.json()
      await Promise.allSettled([
        Promise.resolve(mutateNewsItem(updatedNews, { revalidate: false })),
        mutateCache(
          (key) => Array.isArray(key) && key[0] === "news",
          undefined,
          { revalidate: true },
        ),
      ])
      setIsEditing(false)
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : t("saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteNews = async () => {
    if (!newsItem || !isOwner) return
    try {
      setIsDeleting(true)
      setActionError(null)
      const response = await api.deleteNews(newsItem.id)
      if (!response.ok) {
        throw new Error(await readResponseError(response, { fallback: t("deleteFailed") }))
      }
      await Promise.allSettled([
        Promise.resolve(mutateNewsItem(undefined, { revalidate: false })),
        mutateCache(
          (key) => Array.isArray(key) && key[0] === "news",
          undefined,
          { revalidate: true },
        ),
      ])
      router.replace("/news")
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : t("deleteFailed"))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <p role="status" className="min-h-screen bg-[#F1F1F1] px-8 py-20 text-center text-[#4a4e69]">{t("loading")}</p>
  }

  if (error) {
    return <p role="alert" className="min-h-screen bg-[#F1F1F1] px-8 py-20 text-center text-red-600">{t("loadFailed")}</p>
  }

  if (!newsItem) {
    return <p className="min-h-screen bg-[#F1F1F1] px-8 py-20 text-center text-[#4a4e69]">{t("notFound")}</p>
  }

  const coverUrl = resolveMediaUrl(newsItem.thumbnailUrl?.url)
  const authorName = [newsItem.user?.firstName, newsItem.user?.lastName].filter(Boolean).join(" ") || newsItem.user?.username

  return (
    <main className="min-h-screen bg-[#F1F1F1] px-4 py-10 text-[#0D1321] sm:px-8 lg:py-16">
      <article className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {coverUrl ? (
          <img src={coverUrl} alt={t("coverAlt", { title: newsItem.title })} className="max-h-[560px] w-full bg-[#E8EBF2] object-cover" />
        ) : null}

        <div className="space-y-8 p-6 sm:p-10 lg:p-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Link href="/news" className="inline-flex items-center gap-2 text-sm font-medium text-[#3E5C76] hover:underline">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("back")}
              </Link>
              <h1 className="text-3xl font-bold sm:text-5xl">{newsItem.title}</h1>
              <p className="text-sm text-[#6C7185]">
                {t("by", { name: authorName })} · {new Date(newsItem.timestamp).toLocaleDateString(localeTags[locale])}
              </p>
            </div>

            {isOwner && !isEditing ? (
              <div className="flex gap-3">
                <button type="button" onClick={beginEditing} className="inline-flex items-center gap-2 rounded-lg border border-[#3E5C76] px-4 py-2 font-medium text-[#3E5C76] hover:bg-[#E8EEF4]">
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                  {t("edit")}
                </button>
                <AlertDialog
                  open={isDeleteOpen}
                  onOpenChange={(open) => {
                    if (isDeleting) return
                    setActionError(null)
                    setIsDeleteOpen(open)
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {t("delete")}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md rounded-xl bg-white text-[#0D1321]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">{t("deleteTitle")}</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#4a4e69]">{t("deleteDescription")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    {actionError ? <p role="alert" className="text-sm text-red-600">{actionError}</p> : null}
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting} onClick={() => setActionError(null)} className="border-[#C8CEDA] text-[#4a4e69]">{t("cancel")}</AlertDialogCancel>
                      <button type="button" onClick={deleteNews} disabled={isDeleting} className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60">{isDeleting ? t("deleting") : t("delete")}</button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
          </div>

          {isEditing ? (
            <section className="space-y-6 rounded-xl border border-[#D9DEE8] bg-[#FAFBFD] p-5 sm:p-7">
              <label className="block space-y-2 font-medium text-[#4a4e69]">
                <span>{t("title")}</span>
                <input aria-label={t("title")} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} className="w-full rounded-lg border border-[#C8CEDA] bg-white px-4 py-3 text-[#0D1321] outline-none focus:ring-2 focus:ring-[#748CAB]" />
              </label>
              <label className="block space-y-2 font-medium text-[#4a4e69]">
                <span>{t("article")}</span>
                <textarea aria-label={t("article")} value={article} onChange={(event) => setArticle(event.target.value)} maxLength={1000} rows={8} className="w-full resize-y rounded-lg border border-[#C8CEDA] bg-white px-4 py-3 text-[#0D1321] outline-none focus:ring-2 focus:ring-[#748CAB]" />
              </label>
              <label className="block space-y-2 font-medium text-[#4a4e69]">
                <span>{t("replaceCover")}</span>
                <input aria-label={t("replaceCover")} type="file" accept="image/jpeg,image/png" onChange={(event) => setNewCover(event.target.files?.[0])} className="block w-full text-sm" />
              </label>

              <label className="block space-y-2 font-medium text-[#4a4e69]">
                <span>{t("addPhotos")}</span>
                <input
                  aria-label={t("addPhotos")}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  onChange={(event) => {
                    const addedItems: GalleryItem[] = Array.from(event.target.files ?? []).map((file) => ({
                      kind: "new",
                      key: nextGalleryItemKey++,
                      file,
                    }))
                    setGalleryItems((current) => [...current, ...addedItems])
                  }}
                  className="block w-full text-sm"
                />
              </label>

              {galleryItems.length > 0 ? (
                <div className="space-y-3">
                  <h2 className="font-medium text-[#4a4e69]">{t("currentPhotos")}</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {galleryItems.map((item, galleryIndex) => {
                      const image = item.kind === "existing" ? existingImagesById.get(item.imageId) : undefined
                      const originalIndex = image
                        ? existingImages.findIndex((candidate) => candidate.id === image.id)
                        : -1
                      const newPhotoNumber = item.kind === "new"
                        ? galleryItems.slice(0, galleryIndex + 1).filter((candidate) => candidate.kind === "new").length
                        : 0
                      const itemNumber = item.kind === "existing" ? originalIndex + 1 : newPhotoNumber
                      const moveEarlierLabel = item.kind === "existing"
                        ? t("movePhotoEarlier", { number: itemNumber })
                        : t("moveNewPhotoEarlier", { number: itemNumber })
                      const moveLaterLabel = item.kind === "existing"
                        ? t("movePhotoLater", { number: itemNumber })
                        : t("moveNewPhotoLater", { number: itemNumber })
                      const removeLabel = item.kind === "existing"
                        ? t("removePhoto", { number: itemNumber })
                        : t("removeNewPhoto", { number: itemNumber })
                      return (
                        <div key={item.kind === "existing" ? `existing-${item.imageId}` : `new-${item.key}`} className="relative overflow-hidden rounded-lg border border-[#D9DEE8]">
                          {image ? (
                            <img src={resolveMediaUrl(image.url)} alt={t("photoAlt", { title: newsItem.title, number: originalIndex + 1 })} className="aspect-square w-full object-cover" />
                          ) : item.kind === "new" ? (
                            <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-white p-4 text-center">
                              <span className="text-xs font-semibold uppercase tracking-wide text-[#748CAB]">{t("newPhoto", { number: newPhotoNumber })}</span>
                              <span className="max-w-full truncate text-sm text-[#30364A]" title={item.file.name}>{item.file.name}</span>
                            </div>
                          ) : null}
                          <button type="button" aria-label={removeLabel} onClick={() => setGalleryItems((items) => items.filter((_, index) => index !== galleryIndex))} className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-sm text-white" title={removeLabel}>×</button>
                          <div className="absolute bottom-2 left-2 flex gap-2">
                            <button type="button" aria-label={moveEarlierLabel} title={moveEarlierLabel} disabled={galleryIndex === 0} onClick={() => setGalleryItems((items) => moveItem(items, galleryIndex, galleryIndex - 1))} className="rounded-full bg-black/70 px-2.5 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40">←</button>
                            <button type="button" aria-label={moveLaterLabel} title={moveLaterLabel} disabled={galleryIndex === galleryItems.length - 1} onClick={() => setGalleryItems((items) => moveItem(items, galleryIndex, galleryIndex + 1))} className="rounded-full bg-black/70 px-2.5 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40">→</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {actionError ? <p role="alert" className="text-sm text-red-600">{actionError}</p> : null}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={cancelEditing} disabled={isSaving} className="rounded-lg border border-[#C8CEDA] px-5 py-2.5 font-medium text-[#4a4e69]">{t("cancel")}</button>
                <button type="button" onClick={saveChanges} disabled={isSaving} className="rounded-lg bg-[#3E5C76] px-5 py-2.5 font-medium text-white disabled:opacity-60">{isSaving ? t("saving") : t("save")}</button>
              </div>
            </section>
          ) : (
            <p className="whitespace-pre-wrap text-lg leading-8 text-[#30364A]">{newsItem.content}</p>
          )}

          {!isEditing && existingImages.length > 0 ? (
            <section aria-label={t("currentPhotos")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {existingImages.map((image, index) => (
                <img key={image.id} src={resolveMediaUrl(image.url)} alt={t("photoAlt", { title: newsItem.title, number: index + 1 })} className="aspect-[4/3] w-full rounded-xl bg-[#E8EBF2] object-cover" />
              ))}
            </section>
          ) : null}
        </div>
      </article>

    </main>
  )
}
