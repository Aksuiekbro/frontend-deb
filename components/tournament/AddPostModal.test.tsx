/**
 * @jest-environment jsdom
 */
import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import type { ImagePreview } from "@/hooks/tournament/useImageUpload"
import { AddPostModal } from "./AddPostModal"

const completedImages: ImagePreview[] = [
  {
    key: "human1.png-1-1024",
    name: "human1.png",
    sizeBytes: 1024,
    src: "data:image/png;base64,first",
    progress: 100,
    status: "done",
  },
  {
    key: "human2.png-2-2048",
    name: "human2.png",
    sizeBytes: 2048,
    src: "data:image/png;base64,second",
    progress: 100,
    status: "done",
  },
]

function NewsModalHarness() {
  const [postTitle, setPostTitle] = useState("Tournament final recap")
  const [postDescription, setPostDescription] = useState("A memorable final round.")
  const [imagePreviews, setImagePreviews] = useState(completedImages)

  return (
    <AddPostModal
      isOpen
      modalContext="news"
      postTitle={postTitle}
      postDescription={postDescription}
      selectedNewsCategory="Info"
      imagePreviews={imagePreviews}
      uploadErrors={[]}
      dzAnimate={false}
      formatBytes={(bytes) => `${bytes} bytes`}
      onClose={() => undefined}
      onSubmit={() => undefined}
      onTitleChange={setPostTitle}
      onDescriptionChange={setPostDescription}
      onCategoryChange={() => undefined}
      onImageUpload={() => undefined}
      onDragOver={() => undefined}
      onDrop={() => undefined}
      onRemoveImage={(key) => {
        setImagePreviews((current) => current.filter((image) => image.key !== key))
      }}
    />
  )
}

describe("AddPostModal", () => {
  it("removes one completed image without clearing the other images or form fields", () => {
    render(<NewsModalHarness />)

    fireEvent.click(screen.getByRole("button", { name: "Remove human1.png" }))

    expect(screen.queryByAltText("human1.png")).not.toBeInTheDocument()
    expect(screen.getByAltText("human2.png")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove human2.png" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Enter post title")).toHaveValue("Tournament final recap")
    expect(screen.getByPlaceholderText("Enter post description")).toHaveValue(
      "A memorable final round.",
    )
  })
})
