"use client"

import type { ImagePreview } from "@/hooks/tournament/useImageUpload"
import { useId } from "react"

const CHECK_ICON_URL = "http://localhost:3845/assets/34c9396e092463c20579b8768a873faee7143b0b.svg"

type NewsCategory = "Important" | "Update" | "Info"

type ModalContext = "announcements" | "schedule" | "map" | "news" | ""

interface AddPostModalProps {
  isOpen: boolean
  modalContext: ModalContext
  postTitle: string
  postDescription: string
  selectedNewsCategory: NewsCategory
  imagePreviews: ImagePreview[]
  uploadErrors: string[]
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

const MODAL_TITLES: Record<ModalContext, string> = {
  announcements: "Add Announcement",
  schedule: "Add Schedule Item",
  map: "Add Map Item",
  news: "Add News",
  "": "Add Content",
}

export function AddPostModal({
  isOpen,
  modalContext,
  postTitle,
  postDescription,
  selectedNewsCategory,
  imagePreviews,
  uploadErrors,
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
  const inputId = useId()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#0D1321] text-[32px] font-bold">{MODAL_TITLES[modalContext]}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
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
            <label className="block text-[#9a8c98] text-[18px] font-medium mb-4">Attach Images</label>
            <div className="md:flex md:items-start md:gap-6">
              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`relative border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#3E5C76] transition-colors cursor-pointer w-full md:flex-1 md:min-h-[360px] ${dzAnimate ? "dz-animate" : ""}`}
                onClick={() => document.getElementById(inputId)?.click()}
              >
                <div className="flex flex-col items-center space-y-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-[#4a4e69]">
                    <p className="text-[18px] font-medium mb-2">Drag and Drop here</p>
                    <p className="text-[16px] mb-2">or</p>
                    <p className="text-[#3E5C76] text-[16px] font-medium hover:underline">Browse files</p>
                  </div>
                </div>
                <input
                  id={inputId}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => onImageUpload(event.target.files)}
                  className="hidden"
                />
              </div>

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
                            onClick={() => (img.status === "done" ? undefined : onRemoveImage(img.key))}
                            className={`ml-auto w-6 h-6 aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center ${img.status === "done" ? "" : "bg-black/60 text-white"}`}
                            aria-label={img.status === "done" ? "Uploaded" : "Remove"}
                            title={img.status === "done" ? "Uploaded" : "Remove"}
                          >
                            {img.status === "done" ? (
                              <img src={CHECK_ICON_URL} alt="Uploaded" className="w-full h-full object-contain" />
                            ) : (
                              <span>×</span>
                            )}
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

          {(modalContext === "announcements" || modalContext === "news") && (
            <div className="space-y-6">
              <div>
                <label className="block text-[#4a4e69] text-[16px] font-medium mb-3">Title</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                  placeholder="Enter post title"
                  required
                />
              </div>
              <div>
                <label className="block text-[#4a4e69] text-[16px] font-medium mb-3">Description</label>
                <textarea
                  value={postDescription}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69] resize-vertical"
                  placeholder="Enter post description"
                  required
                />
              </div>
              {modalContext === "news" && (
                <div>
                  <label className="block text-[#4a4e69] text-[16px] font-medium mb-3">Category</label>
                  <select
                    value={selectedNewsCategory}
                    onChange={(event) => onCategoryChange(event.target.value as NewsCategory)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                  >
                    <option value="Important">Important</option>
                    <option value="Update">Update</option>
                    <option value="Info">Info</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="w-full px-8 py-4 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[18px] font-medium transition-colors">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
