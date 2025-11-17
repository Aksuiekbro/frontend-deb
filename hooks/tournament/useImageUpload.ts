"use client"

import { useCallback, useState } from "react"

export type ImagePreview = {
  key: string
  name: string
  sizeBytes: number
  src: string
  progress: number
  status: "loading" | "done" | "error"
  error?: string
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function useImageUpload(maxSize = DEFAULT_MAX_SIZE) {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [postImages, setPostImages] = useState<File[]>([])
  const [dzAnimate, setDzAnimate] = useState(false)

  const formatBytes = useCallback((bytes: number) => {
    return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
  }, [])

  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files) return

    const nextErrors: string[] = []
    const validFiles: File[] = []
    const nextPreviews: ImagePreview[] = []

    Array.from(files).forEach((file) => {
      const key = `${file.name}-${file.lastModified}-${file.size}`

      if (!file.type.startsWith("image/")) {
        nextErrors.push(`${file.name}: not an image`)
        return
      }

      if (file.size > maxSize) {
        nextErrors.push(`${file.name}: exceeds 10MB`)
        return
      }

      validFiles.push(file)
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
        setImagePreviews((prev) => prev.map((preview) => (preview.key === key ? { ...preview, status: "error", error: "Failed to load preview" } : preview)))
      }
      reader.readAsDataURL(file)
    })

    setUploadErrors(nextErrors)
    if (nextPreviews.length) {
      setImagePreviews((prev) => [...prev, ...nextPreviews])
    }
    if (validFiles.length) {
      setPostImages((prev) => [...prev, ...validFiles])
    }
  }, [maxSize])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const { files } = event.dataTransfer
    handleImageUpload(files)
  }, [handleImageUpload])

  const removeImageByKey = useCallback((key: string) => {
    setImagePreviews((prev) => prev.filter((preview) => preview.key !== key))
    setPostImages((prev) => prev.filter((file) => `${file.name}-${file.lastModified}-${file.size}` !== key))
  }, [])

  const resetUploads = useCallback(() => {
    setImagePreviews([])
    setUploadErrors([])
    setPostImages([])
    setDzAnimate(false)
  }, [])

  return {
    imagePreviews,
    uploadErrors,
    postImages,
    dzAnimate,
    formatBytes,
    handleImageUpload,
    handleDragOver,
    handleDrop,
    removeImageByKey,
    resetUploads,
  }
}
