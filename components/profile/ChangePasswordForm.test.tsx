/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ChangePasswordForm from "./ChangePasswordForm"
import { api } from "@/lib/api"
import { LocaleProvider } from "@/lib/i18n"

jest.mock("@/lib/api", () => ({ api: { updateUser: jest.fn() } }))
const updateUser = jest.mocked(api.updateUser)

function response(status = 200, message?: string): Response {
  return { ok: status < 400, status, text: async () => message ? JSON.stringify({ message }) : "" } as Response
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: "Change password" }))
}

function fillForm(current = "Current123!", next = "Updated123!", confirm = next) {
  fireEvent.change(screen.getByLabelText("Current password"), { target: { value: current } })
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: next } })
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirm } })
}

function submitForm() {
  fireEvent.submit(screen.getByRole("form", { name: "Change password" }))
}

beforeEach(() => {
  updateUser.mockReset()
  window.localStorage.clear()
})

describe("ChangePasswordForm", () => {
  it("labels password inputs, supports password managers, and restores focus after cancel", () => {
    render(<ChangePasswordForm userId={7} />)
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument()
    openForm()

    expect(screen.getByLabelText("Current password")).toHaveFocus()
    for (const [label, autocomplete] of [["Current password", "current-password"], ["New password", "new-password"], ["Confirm new password", "new-password"]]) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveAttribute("type", "password")
      expect(input).toHaveAttribute("autocomplete", autocomplete)
      expect(input).toHaveAttribute("minlength", "8")
      expect(input).toHaveAttribute("maxlength", "32")
      expect(input).toBeRequired()
    }
    fillForm()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByRole("button", { name: "Change password" })).toHaveFocus()
    expect(updateUser).not.toHaveBeenCalled()
    openForm()
    for (const label of ["Current password", "New password", "Confirm new password"]) {
      expect(screen.getByLabelText(label)).toHaveValue("")
    }
  })

  it.each([8, 32])("sends only the exact untrimmed password pair at the %i-character boundary and clears secrets after success", async (length) => {
    updateUser.mockResolvedValue(response())
    render(<ChangePasswordForm userId={7} />)
    openForm()
    const current = ` ${"a".repeat(length - 2)} `
    const next = ` ${"b".repeat(length - 2)} `
    fillForm(current, next)
    submitForm()

    expect(await screen.findByRole("status")).toHaveTextContent("Password changed successfully.")
    expect(updateUser).toHaveBeenCalledWith(7, { oldPassword: current, newPassword: next })
    expect(updateUser).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Change password" })).toHaveFocus()
    openForm()
    for (const label of ["Current password", "New password", "Confirm new password"]) {
      expect(screen.getByLabelText(label)).toHaveValue("")
    }
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it.each([
    ["", "Newpass123", "Newpass123", "Enter your current password"],
    ["Oldpass123", "", "", "Enter your current password"],
    ["Oldpass123", "Newpass123", "", "Enter your current password"],
    ["a".repeat(7), "Newpass123", "Newpass123", "8–32 characters"],
    ["a".repeat(33), "Newpass123", "Newpass123", "8–32 characters"],
    ["Oldpass123", "b".repeat(7), "b".repeat(7), "8–32 characters"],
    ["Oldpass123", "b".repeat(33), "b".repeat(33), "8–32 characters"],
    ["Oldpass123", " Newpass123 ", "Newpass123", "do not match"],
  ])("rejects invalid password fields (%#) without a request", (current, next, confirm, message) => {
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm(current, next, confirm)
    submitForm()

    expect(screen.getByRole("alert")).toHaveTextContent(message)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it("deduplicates pending submissions while leaving cancellation available", async () => {
    const request = deferred<Response>()
    updateUser.mockReturnValue(request.promise)
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    act(() => { submitForm(); submitForm() })

    expect(updateUser).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled()
    expect(screen.getByLabelText("Current password")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled()
    await act(async () => request.resolve(response()))
    expect(screen.getByRole("status")).toHaveTextContent("Password changed successfully.")
  })

  it.each([
    [400, "Check your current password"],
    [401, "Please sign in again"],
    [403, "You do not have permission"],
    [404, "Unable to change your password"],
    [500, "The server could not save your password"],
  ])("keeps inputs for retry and shows a status-aware %i fallback", async (status, message) => {
    updateUser.mockResolvedValueOnce(response(status)).mockResolvedValueOnce(response())
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(screen.getByLabelText("Current password")).toHaveValue("Current123!")
    expect(screen.getByLabelText("New password")).toHaveValue("Updated123!")
    expect(screen.getByRole("button", { name: "Save password" })).toBeEnabled()
    submitForm()
    expect(await screen.findByRole("status")).toHaveTextContent("Password changed successfully.")
  })

  it.each([
    ["en", "Change password", "Current password", "New password", "Confirm new password", "Save password", "Old password is incorrect"],
    ["ru", "Изменить пароль", "Текущий пароль", "Новый пароль", "Подтвердите новый пароль", "Сохранить пароль", "Текущий пароль неверен."],
    ["kk", "Құпиясөзді өзгерту", "Қазіргі құпиясөз", "Жаңа құпиясөз", "Жаңа құпиясөзді растаңыз", "Құпиясөзді сақтау", "Қазіргі құпиясөз қате."],
  ])("translates the real incorrect-password response into %s", async (locale, title, current, next, confirm, save, message) => {
    window.localStorage.setItem("debetter-locale", locale)
    updateUser.mockResolvedValue(response(400, "Old password is incorrect"))
    render(<ChangePasswordForm userId={7} />, { wrapper: LocaleProvider })
    fireEvent.click(await screen.findByRole("button", { name: title }))
    fireEvent.change(screen.getByLabelText(current), { target: { value: "Current123!" } })
    fireEvent.change(screen.getByLabelText(next), { target: { value: "Updated123!" } })
    fireEvent.change(screen.getByLabelText(confirm), { target: { value: "Updated123!" } })
    fireEvent.click(screen.getByRole("button", { name: save }))

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    if (locale !== "en") expect(screen.queryByText("Old password is incorrect")).not.toBeInTheDocument()
    expect(screen.getByLabelText(current)).toHaveValue("Current123!")
    expect(screen.getByRole("button", { name: save })).toBeEnabled()
  })

  it("preserves an unknown useful backend validation message", async () => {
    updateUser.mockResolvedValue(response(400, "Password change is unavailable for this account"))
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()
    expect(await screen.findByRole("alert")).toHaveTextContent("Password change is unavailable for this account")
  })

  it("does not display internal details from a server error", async () => {
    updateUser.mockResolvedValue(response(500, "SQL connection stack trace"))
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()
    expect(await screen.findByRole("alert")).toHaveTextContent("The server could not save your password")
    expect(screen.queryByText(/SQL/)).not.toBeInTheDocument()
  })

  it("preserves input and permits retry after a network failure", async () => {
    updateUser.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()
    expect(await screen.findByRole("alert")).toHaveTextContent("Check your connection")
    expect(screen.getByLabelText("Current password")).toHaveValue("Current123!")
    expect(screen.getByRole("button", { name: "Save password" })).toBeEnabled()
  })

  it.each(["success", "http error", "network error"])("ignores a late %s after cancel/reopen without unlocking a newer request", async (outcome) => {
    const previous = deferred<Response>()
    const current = deferred<Response>()
    updateUser.mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise)
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    openForm()
    expect(screen.getByLabelText("Current password")).toHaveValue("")
    fillForm("Another123!", "Newest123!")
    submitForm()

    await act(async () => {
      if (outcome === "network error") previous.reject(new TypeError("Failed to fetch"))
      else previous.resolve(response(outcome === "success" ? 200 : 400, "Old password is incorrect"))
    })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Current password")).toHaveValue("Another123!")
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled()
    await act(async () => current.resolve(response()))
    expect(screen.getByRole("status")).toHaveTextContent("Password changed successfully.")
  })

  it("ignores an error body that finishes after cancellation", async () => {
    const body = deferred<string>()
    const text = jest.fn(() => body.promise)
    updateUser.mockResolvedValue({ ok: false, status: 400, text } as unknown as Response)
    render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()
    await waitFor(() => expect(text).toHaveBeenCalled())
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    openForm()
    await act(async () => body.resolve(JSON.stringify({ message: "Old password is incorrect" })))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Current password")).toHaveValue("")
  })

  it.each(["success", "network error"])("clears secrets on a userId prop change and ignores the previous account's late %s", async (outcome) => {
    const request = deferred<Response>()
    updateUser.mockReturnValueOnce(request.promise).mockResolvedValueOnce(response())
    const { rerender } = render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()
    rerender(<ChangePasswordForm userId={8} />)
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument()
    openForm()
    expect(screen.getByLabelText("Current password")).toHaveValue("")

    await act(async () => {
      if (outcome === "network error") request.reject(new TypeError("Failed to fetch"))
      else request.resolve(response())
    })
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    fillForm("Account8Old!", "Account8New!")
    submitForm()
    expect(await screen.findByRole("status")).toHaveTextContent("Password changed successfully.")
    expect(updateUser).toHaveBeenLastCalledWith(8, { oldPassword: "Account8Old!", newPassword: "Account8New!" })
  })

  it("drops drafts and late results on unmount", async () => {
    const request = deferred<Response>()
    updateUser.mockReturnValue(request.promise)
    const { unmount } = render(<ChangePasswordForm userId={7} />)
    openForm()
    fillForm()
    submitForm()
    unmount()
    render(<ChangePasswordForm userId={7} />)
    openForm()
    await act(async () => request.resolve(response()))
    expect(screen.getByLabelText("Current password")).toHaveValue("")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it.each([
    ["ru", "Изменить пароль", "Текущий пароль", "Новый пароль", "Подтвердите новый пароль", "Сохранить пароль", "Введите текущий пароль"],
    ["kk", "Құпиясөзді өзгерту", "Қазіргі құпиясөз", "Жаңа құпиясөз", "Жаңа құпиясөзді растаңыз", "Құпиясөзді сақтау", "Қазіргі құпиясөзді"],
  ])("translates the complete form and validation into %s", async (locale, title, current, next, confirm, save, validation) => {
    window.localStorage.setItem("debetter-locale", locale)
    render(<ChangePasswordForm userId={7} />, { wrapper: LocaleProvider })
    fireEvent.click(await screen.findByRole("button", { name: title }))
    expect(screen.getByLabelText(current)).toBeInTheDocument()
    expect(screen.getByLabelText(next)).toBeInTheDocument()
    expect(screen.getByLabelText(confirm)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: save }))
    expect(screen.getByRole("alert")).toHaveTextContent(validation)
  })
})
