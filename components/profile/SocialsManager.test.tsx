/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import SocialsManager from "./SocialsManager"
import { SocialPlatform } from "@/types/util/socials/social-profile"

describe("SocialsManager", () => {
  it("renders social profiles as read-only until a save flow is wired", () => {
    render(<SocialsManager initialSocials={[{ platform: SocialPlatform.TELEGRAM, handle: "@debetter" }]} />)

    expect(screen.getByDisplayValue("@debetter")).toHaveAttribute("readOnly")
    expect(screen.queryByLabelText("Edit")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Delete")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Add social")).not.toBeInTheDocument()
  })

  it("saves edited social profiles through the wired save handler", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    render(
      <SocialsManager
        editable
        initialSocials={[{ platform: SocialPlatform.TELEGRAM, handle: "@debetter" }]}
        onSave={onSave}
      />,
    )

    fireEvent.change(screen.getByDisplayValue("@debetter"), { target: { value: "@debetter_live" } })
    fireEvent.click(screen.getByRole("button", { name: "Save social profiles" }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([
        { platform: SocialPlatform.TELEGRAM, handle: "@debetter_live" },
      ])
    })
  })

  it("lets a user add a new social profile from the picker", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    render(<SocialsManager editable initialSocials={[]} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Add social" }))
    fireEvent.click(screen.getByRole("button", { name: "Telegram" }))
    fireEvent.change(screen.getByPlaceholderText("@handle"), { target: { value: "@flow_user" } })
    fireEvent.click(screen.getByRole("button", { name: "Save social profiles" }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([
        { platform: SocialPlatform.TELEGRAM, handle: "@flow_user" },
      ])
    })
  })

  it("reveals social chips with the restored plus animation state", () => {
    render(<SocialsManager editable initialSocials={[]} onSave={jest.fn()} />)

    const addButton = screen.getByRole("button", { name: "Add social" })

    expect(addButton).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(addButton)

    expect(addButton).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button", { name: "Telegram" })).toHaveClass("translate-x-0", "opacity-100")
  })
})
