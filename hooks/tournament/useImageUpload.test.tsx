/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { LocaleProvider } from "@/lib/i18n"

import { useImageUpload } from "./useImageUpload"

describe("useImageUpload", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("rejects image formats that the backend does not accept", () => {
    const { result } = renderHook(() => useImageUpload())
    const file = new File(["fake webp"], "photo.webp", { type: "image/webp" })

    act(() => {
      result.current.handleImageUpload([file] as unknown as FileList)
    })

    expect(result.current.uploadErrors).toEqual(["photo.webp: please upload JPG or PNG"])
    expect(result.current.postImages).toEqual([])
  })

  it("rejects files larger than the backend upload limit", () => {
    const { result } = renderHook(() => useImageUpload())
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })

    act(() => {
      result.current.handleImageUpload([file] as unknown as FileList)
    })

    expect(result.current.uploadErrors).toEqual(["large.jpg: exceeds 5.0 MB"])
    expect(result.current.postImages).toEqual([])
  })

  it("removes only the matching preview and file from the upload state", async () => {
    const { result } = renderHook(() => useImageUpload())
    const firstFile = new File(["first"], "human1.png", {
      type: "image/png",
      lastModified: 1,
    })
    const secondFile = new File(["second"], "human2.png", {
      type: "image/png",
      lastModified: 2,
    })

    act(() => {
      result.current.handleImageUpload([firstFile, secondFile] as unknown as FileList)
    })

    await waitFor(() => {
      expect(result.current.imagePreviews).toHaveLength(2)
      expect(result.current.postImages).toHaveLength(2)
    })

    act(() => {
      result.current.removeImageByKey(result.current.imagePreviews[0].key)
    })

    expect(result.current.imagePreviews.map((preview) => preview.name)).toEqual(["human2.png"])
    expect(result.current.postImages).toEqual([secondFile])
  })

  it("removes only one occurrence when the same file is selected more than once", async () => {
    const { result } = renderHook(() => useImageUpload())
    const repeatedFile = new File(["same image"], "repeat.png", {
      type: "image/png",
      lastModified: 3,
    })

    act(() => {
      result.current.handleImageUpload([repeatedFile] as unknown as FileList)
    })
    act(() => {
      result.current.handleImageUpload([repeatedFile] as unknown as FileList)
    })

    await waitFor(() => {
      expect(result.current.imagePreviews).toHaveLength(2)
      expect(result.current.postImages).toHaveLength(2)
    })

    const [firstPreview, secondPreview] = result.current.imagePreviews
    expect(firstPreview.key).not.toBe(secondPreview.key)

    act(() => {
      result.current.removeImageByKey(firstPreview.key)
    })

    expect(result.current.imagePreviews).toHaveLength(1)
    expect(result.current.imagePreviews[0].key).toBe(secondPreview.key)
    expect(result.current.postImages).toEqual([repeatedFile])
  })

  it("translates invalid image validation into Russian", async () => {
    window.localStorage.setItem("debetter-locale", "ru")
    const { result } = renderHook(() => useImageUpload(), {
      wrapper: LocaleProvider,
    })
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "ru")
    })
    const file = new File(["fake webp"], "photo.webp", { type: "image/webp" })

    act(() => {
      result.current.handleImageUpload([file] as unknown as FileList)
    })

    expect(result.current.uploadErrors).toEqual([
      "photo.webp: загрузите изображение в формате JPG или PNG",
    ])
  })

  it("translates size validation into Kazakh and preserves the formatted size", async () => {
    window.localStorage.setItem("debetter-locale", "kk")
    const { result } = renderHook(() => useImageUpload(), {
      wrapper: LocaleProvider,
    })
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "kk")
    })
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })

    act(() => {
      result.current.handleImageUpload([file] as unknown as FileList)
    })

    expect(result.current.uploadErrors).toEqual(["large.jpg: 5.0 MB өлшемінен асады"])
  })

  it("translates preview read failures into Kazakh", async () => {
    window.localStorage.setItem("debetter-locale", "kk")
    const { result } = renderHook(() => useImageUpload(), {
      wrapper: LocaleProvider,
    })
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "kk")
    })

    const originalFileReader = globalThis.FileReader
    class FailingFileReader {
      onprogress: ((event: ProgressEvent<FileReader>) => void) | null = null
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null
      onerror: ((event: ProgressEvent<FileReader>) => void) | null = null
      readAsDataURL() {
        setTimeout(() => this.onerror?.(new ProgressEvent("error")), 0)
      }
    }
    globalThis.FileReader = FailingFileReader as unknown as typeof FileReader

    try {
      const file = new File(["image"], "photo.jpg", { type: "image/jpeg" })
      act(() => {
        result.current.handleImageUpload([file] as unknown as FileList)
      })

      await waitFor(() => {
        expect(result.current.imagePreviews[0]).toEqual(expect.objectContaining({
          status: "error",
          error: "Алдын ала көріністі жүктеу мүмкін болмады",
        }))
      })
    } finally {
      globalThis.FileReader = originalFileReader
    }
  })
})
