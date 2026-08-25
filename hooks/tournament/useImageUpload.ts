"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

export type ImagePreview = {
  key: string
  name: string
  sizeBytes: number
  src: string
  progress: number
  status: "loading" | "done" | "error"
  error?: string
}

type ImageSelection = {
  key: string
  file: File
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // backend max: 5MB
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png"])

const messages: TranslationCatalog = {
  en: {
    invalidImage: "please upload JPG or PNG",
    imageTooLarge: "exceeds {size}",
    previewLoadFailed: "Failed to load preview",
  },
  ru: {
    invalidImage: "загрузите изображение в формате JPG или PNG",
    imageTooLarge: "превышает {size}",
    previewLoadFailed: "Не удалось загрузить предварительный просмотр",
  },
  kk: {
    invalidImage: "JPG немесе PNG форматындағы суретті жүктеңіз",
    imageTooLarge: "{size} өлшемінен асады",
    previewLoadFailed: "Алдын ала көріністі жүктеу мүмкін болмады",
  },
}

export function useImageUpload(maxSize = DEFAULT_MAX_SIZE) {
  const t = useTranslations(messages)
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [imageSelections, setImageSelections] = useState<ImageSelection[]>([])
  const [dzAnimate, setDzAnimate] = useState(false)
  const nextSelectionId = useRef(0)

  const formatBytes = useCallback((bytes: number) => {
    return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
  }, [])

  const processImageUpload = useCallback((files: FileList | null, replaceWithSingleImage: boolean) => {
    if (!files) return

    const nextErrors: string[] = []
    const validSelections: ImageSelection[] = []
    const nextPreviews: ImagePreview[] = []
    const selectedFiles = replaceWithSingleImage ? Array.from(files).slice(0, 1) : Array.from(files)

    selectedFiles.forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? ""

      if (!file.type.startsWith("image/") || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
        nextErrors.push(`${file.name}: ${t("invalidImage")}`)
        return
      }

      if (file.size > maxSize) {
        nextErrors.push(`${file.name}: ${t("imageTooLarge", { size: formatBytes(maxSize) })}`)
        return
      }

      const key = `${file.name}-${file.lastModified}-${file.size}-${nextSelectionId.current}`
      nextSelectionId.current += 1
      validSelections.push({ key, file })
      nextPreviews.push({ key, name: file.name, sizeBytes: file.size, src: "", progress: 0, status: "loading" })

      const reader = new FileReader()
      reader.onprogress = (event) => {
        if (!event.lengthComputable) return
        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
        setImagePreviews((prev) => prev.map((preview) => (preview.key === key ? { ...preview, progress: percent } : preview)))
      }
      reader.onload = () => {
        const src = typeof reader.result === "string" ? reader.result : ""
        setImagePreviews((prev) => prev.map((preview) => (preview.key === key ? { ...preview, src, progress: 100, status: "done" } : preview)))
        setDzAnimate(true)
        setTimeout(() => setDzAnimate(false), 800)
      }
      reader.onerror = () => {
        setImagePreviews((prev) => prev.map((preview) => (preview.key === key ? { ...preview, status: "error", error: t("previewLoadFailed") } : preview)))
      }
      reader.readAsDataURL(file)
    })

    setUploadErrors(nextErrors)
    if (nextPreviews.length) {
      setImagePreviews((prev) => replaceWithSingleImage ? nextPreviews : [...prev, ...nextPreviews])
    }
    if (validSelections.length) {
      setImageSelections((prev) => replaceWithSingleImage ? validSelections : [...prev, ...validSelections])
    }
  }, [formatBytes, maxSize, t])

  const handleImageUpload = useCallback((files: FileList | null) => {
    processImageUpload(files, false)
  }, [processImageUpload])

  const handleSingleImageUpload = useCallback((files: FileList | null) => {
    processImageUpload(files, true)
  }, [processImageUpload])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const { files } = event.dataTransfer
    handleImageUpload(files)
  }, [handleImageUpload])

  const handleSingleImageDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    handleSingleImageUpload(event.dataTransfer.files)
  }, [handleSingleImageUpload])

  const removeImageByKey = useCallback((key: string) => {
    setImagePreviews((prev) => prev.filter((preview) => preview.key !== key))
    setImageSelections((prev) => prev.filter((selection) => selection.key !== key))
  }, [])

  const resetUploads = useCallback(() => {
    setImagePreviews([])
    setUploadErrors([])
    setImageSelections([])
    setDzAnimate(false)
  }, [])

  const postImages = imageSelections.map((selection) => selection.file)

  return {
    imagePreviews,
    uploadErrors,
    postImages,
    dzAnimate,
    formatBytes,
    handleImageUpload,
    handleSingleImageUpload,
    handleDragOver,
    handleDrop,
    handleSingleImageDrop,
    removeImageByKey,
    resetUploads,
  }
}
