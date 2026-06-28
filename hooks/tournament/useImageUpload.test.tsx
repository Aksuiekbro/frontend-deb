/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"

import { useImageUpload } from "./useImageUpload"

describe("useImageUpload", () => {
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
})
