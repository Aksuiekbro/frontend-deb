/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import AvatarWithEdit from "./AvatarWithEdit"

describe("AvatarWithEdit", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(),
    })
    jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:avatar-preview")
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("keeps avatar editing disabled until an image-change handler is wired", () => {
    render(<AvatarWithEdit src="/avatar.png" />)

    expect(screen.getByRole("button", { name: "Edit avatar" })).toBeDisabled()
  })

  it("passes the selected avatar file to the wired image-change handler", () => {
    const onChangeImage = jest.fn()
    const { container } = render(<AvatarWithEdit src="/avatar.png" onChangeImage={onChangeImage} />)
    const image = screen.getByAltText("User avatar")
    const file = new File(["avatar"], "avatar.png", { type: "image/png" })

    fireEvent.click(screen.getByRole("button", { name: "Edit avatar" }))
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })

    expect(onChangeImage).toHaveBeenCalledWith(file, "blob:avatar-preview")
    expect(image).toHaveAttribute("src", "blob:avatar-preview")
  })

  it("runs the wired avatar delete handler from the edit modal", async () => {
    const onDeleteImage = jest.fn().mockResolvedValue(undefined)
    render(<AvatarWithEdit src="/avatar.png" onChangeImage={jest.fn()} onDeleteImage={onDeleteImage} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit avatar" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete image" }))

    await waitFor(() => expect(onDeleteImage).toHaveBeenCalled())
  })
})
