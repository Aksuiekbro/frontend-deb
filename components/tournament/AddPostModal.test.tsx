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

function NewsModalHarness({
  onImageUpload = () => undefined,
}: {
  onImageUpload?: (files: FileList | null) => void
}) {
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
      onImageUpload={onImageUpload}
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

  it("clears the native file input so a removed file can be selected again", () => {
    const onImageUpload = jest.fn()
    const { container } = render(<NewsModalHarness onImageUpload={onImageUpload} />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    const file = new File(["image"], "human1.png", { type: "image/png" })
    let inputValue = "C:\\fakepath\\human1.png"

    expect(input).not.toBeNull()
    Object.defineProperty(input, "value", {
      configurable: true,
      get: () => inputValue,
      set: (value: string) => {
        inputValue = value
      },
    })

    fireEvent.change(input!, { target: { files: [file] } })

    expect(onImageUpload).toHaveBeenCalledWith(expect.objectContaining({ 0: file }))
    expect(inputValue).toBe("")
  })

  it("collects map metadata and only accepts one map image", () => {
    const onClose = jest.fn()
    const { container } = render(
      <AddPostModal
        isOpen
        modalContext="map"
        postTitle="Venue map"
        postDescription="Use the east entrance."
        selectedNewsCategory="Info"
        imagePreviews={[]}
        uploadErrors={[]}
        dzAnimate={false}
        formatBytes={(bytes) => `${bytes} bytes`}
        onClose={onClose}
        onSubmit={() => undefined}
        onTitleChange={() => undefined}
        onDescriptionChange={() => undefined}
        onCategoryChange={() => undefined}
        onImageUpload={() => undefined}
        onDragOver={() => undefined}
        onDrop={() => undefined}
        onRemoveImage={() => undefined}
      />,
    )

    const dialog = screen.getByRole("dialog", { name: "Add Map" })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus()
    expect(screen.getByRole("button", { name: "Attach Images" })).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toHaveValue("Venue map")
    expect(screen.getByLabelText("Description")).toHaveValue("Use the east entrance.")
    expect(container.querySelector<HTMLInputElement>('input[type="file"]')).not.toHaveAttribute("multiple")

    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("shows edit copy and the current image when editing a map", () => {
    render(
      <AddPostModal
        isOpen
        modalContext="map"
        mode="edit"
        postTitle="Venue map"
        postDescription="Use the east entrance."
        selectedNewsCategory="Info"
        currentImageUrl="https://cdn.example.test/maps/venue.png"
        imagePreviews={[]}
        uploadErrors={[]}
        dzAnimate={false}
        formatBytes={(bytes) => `${bytes} bytes`}
        onClose={() => undefined}
        onSubmit={() => undefined}
        onTitleChange={() => undefined}
        onDescriptionChange={() => undefined}
        onCategoryChange={() => undefined}
        onImageUpload={() => undefined}
        onDragOver={() => undefined}
        onDrop={() => undefined}
        onRemoveImage={() => undefined}
      />,
    )

    expect(screen.getByRole("heading", { name: "Edit Map" })).toBeInTheDocument()
    expect(screen.getByAltText("Current map")).toHaveAttribute(
      "src",
      "https://cdn.example.test/maps/venue.png",
    )
  })
})
