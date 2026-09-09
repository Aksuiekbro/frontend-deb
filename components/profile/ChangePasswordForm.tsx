"use client"

import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { useTranslations, type TranslationCatalog } from "@/lib/i18n"

const passwordMessages: TranslationCatalog = {
  en: {
    changePassword: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordHint: "Use 8–32 characters. Spaces count as part of your password.",
    required: "Enter your current password, a new password, and its confirmation.",
    invalidLength: "Passwords must be 8–32 characters.",
    mismatch: "The new passwords do not match.",
    save: "Save password",
    saving: "Saving...",
    cancel: "Cancel",
    success: "Password changed successfully.",
    failed: "Unable to change your password. Please try again.",
    badRequest: "Check your current password and use 8–32 characters for the new password.",
    invalidCurrentPassword: "Old password is incorrect",
    signInAgain: "Please sign in again to change your password.",
    forbidden: "You do not have permission to change this password.",
    serverError: "The server could not save your password. Please try again later.",
    networkError: "Could not connect. Check your connection and try again.",
  },
  ru: {
    changePassword: "Изменить пароль",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmPassword: "Подтвердите новый пароль",
    passwordHint: "Используйте 8–32 символа. Пробелы считаются частью пароля.",
    required: "Введите текущий пароль, новый пароль и его подтверждение.",
    invalidLength: "Пароли должны содержать 8–32 символа.",
    mismatch: "Новые пароли не совпадают.",
    save: "Сохранить пароль",
    saving: "Сохранение...",
    cancel: "Отмена",
    success: "Пароль успешно изменён.",
    failed: "Не удалось изменить пароль. Попробуйте ещё раз.",
    badRequest: "Проверьте текущий пароль и используйте 8–32 символа для нового пароля.",
    invalidCurrentPassword: "Текущий пароль неверен.",
    signInAgain: "Войдите снова, чтобы изменить пароль.",
    forbidden: "У вас нет разрешения изменять этот пароль.",
    serverError: "Сервер не смог сохранить пароль. Попробуйте позже.",
    networkError: "Не удалось подключиться. Проверьте соединение и попробуйте ещё раз.",
  },
  kk: {
    changePassword: "Құпиясөзді өзгерту",
    currentPassword: "Қазіргі құпиясөз",
    newPassword: "Жаңа құпиясөз",
    confirmPassword: "Жаңа құпиясөзді растаңыз",
    passwordHint: "8–32 таңба пайдаланыңыз. Бос орындар құпиясөздің бөлігі болып саналады.",
    required: "Қазіргі құпиясөзді, жаңа құпиясөзді және оның растауын енгізіңіз.",
    invalidLength: "Құпиясөздер 8–32 таңбадан тұруы керек.",
    mismatch: "Жаңа құпиясөздер сәйкес келмейді.",
    save: "Құпиясөзді сақтау",
    saving: "Сақталуда...",
    cancel: "Бас тарту",
    success: "Құпиясөз сәтті өзгертілді.",
    failed: "Құпиясөзді өзгерту мүмкін болмады. Қайталап көріңіз.",
    badRequest: "Қазіргі құпиясөзді тексеріп, жаңа құпиясөз үшін 8–32 таңба пайдаланыңыз.",
    invalidCurrentPassword: "Қазіргі құпиясөз қате.",
    signInAgain: "Құпиясөзді өзгерту үшін қайта кіріңіз.",
    forbidden: "Бұл құпиясөзді өзгертуге рұқсатыңыз жоқ.",
    serverError: "Сервер құпиясөзді сақтай алмады. Кейінірек қайталап көріңіз.",
    networkError: "Қосылу мүмкін болмады. Байланысты тексеріп, қайталап көріңіз.",
  },
}

export default function ChangePasswordForm({ userId }: { userId: number }) {
  // A new account gets new state even when the caller does not key this component.
  return <PasswordEditor key={userId} userId={userId} />
}

function PasswordEditor({ userId }: { userId: number }) {
  const t = useTranslations(passwordMessages)
  const id = useId()
  const [open, setOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const generation = useRef(0)
  const submitting = useRef(false)
  const currentInput = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => () => {
    generation.current += 1
  }, [])

  useEffect(() => {
    if (open) currentInput.current?.focus()
    else if (wasOpen.current) trigger.current?.focus()
    wasOpen.current = open
  }, [open])

  function clearPasswords() {
    setOldPassword("")
    setNewPassword("")
    setConfirmation("")
  }

  function reset(nextOpen: boolean) {
    generation.current += 1
    submitting.current = false
    clearPasswords()
    setPending(false)
    setError(null)
    setSuccess(false)
    setOpen(nextOpen)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return

    setError(null)
    setSuccess(false)
    if (!oldPassword || !newPassword || !confirmation) {
      setError(t("required"))
      return
    }
    if ([oldPassword, newPassword].some((password) => password.length < 8 || password.length > 32)) {
      setError(t("invalidLength"))
      return
    }
    if (newPassword !== confirmation) {
      setError(t("mismatch"))
      return
    }

    const requestGeneration = ++generation.current
    submitting.current = true
    setPending(true)
    try {
      const response = await api.updateUser(userId, { oldPassword, newPassword })
      if (generation.current !== requestGeneration) return
      if (!response.ok) {
        const message = response.status >= 500 ? t("serverError") : await readResponseError(response, {
          fallback: t("failed"),
          badRequest: t("badRequest"),
          unauthorized: t(response.status === 401 ? "signInAgain" : "forbidden"),
        })
        const localizedMessage = response.status === 400 && message === "Old password is incorrect"
          ? t("invalidCurrentPassword")
          : message
        if (generation.current === requestGeneration) setError(localizedMessage)
        return
      }
      clearPasswords()
      setOpen(false)
      setSuccess(true)
    } catch {
      if (generation.current === requestGeneration) setError(t("networkError"))
    } finally {
      if (generation.current === requestGeneration) {
        submitting.current = false
        setPending(false)
      }
    }
  }

  const inputClass = "w-full rounded-lg border border-[#0D1321]/25 bg-white px-3 py-2 text-[#0D1321] focus:outline-none focus:ring-2 focus:ring-[#3E5C76] disabled:opacity-60"

  return (
    <div className="w-full space-y-3 text-[#0D1321]">
      {open ? (
        <form id={`${id}-form`} onSubmit={handleSubmit} noValidate aria-labelledby={`${id}-title`} aria-describedby={error ? `${id}-error` : undefined} aria-busy={pending} className="space-y-4">
          <h2 id={`${id}-title`} className="text-lg font-semibold">{t("changePassword")}</h2>
          <p id={`${id}-hint`} className="text-sm text-[#0D1321]/70">{t("passwordHint")}</p>
          <div className="space-y-1">
            <label htmlFor={`${id}-current`} className="block text-sm font-medium">{t("currentPassword")}</label>
            <input ref={currentInput} id={`${id}-current`} name="current-password" type="password" autoComplete="current-password" required minLength={8} maxLength={32} value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} disabled={pending} aria-describedby={`${id}-hint`} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-new`} className="block text-sm font-medium">{t("newPassword")}</label>
            <input id={`${id}-new`} name="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={32} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={pending} aria-describedby={`${id}-hint`} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-confirm`} className="block text-sm font-medium">{t("confirmPassword")}</label>
            <input id={`${id}-confirm`} name="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={32} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} className={inputClass} />
          </div>
          {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="rounded-lg bg-[#3E5C76] px-4 py-2 font-medium text-white hover:bg-[#2D3748] disabled:opacity-50">{t(pending ? "saving" : "save")}</button>
            <button type="button" onClick={() => reset(false)} className="rounded-lg border border-[#0D1321]/25 px-4 py-2 hover:bg-black/5">{t("cancel")}</button>
          </div>
        </form>
      ) : (
        <button ref={trigger} type="button" aria-expanded={false} onClick={() => reset(true)} className="rounded-lg border border-[#0D1321]/25 px-4 py-2 font-medium hover:bg-black/5">{t("changePassword")}</button>
      )}
      {success && <p role="status" className="text-sm text-green-800">{t("success")}</p>}
    </div>
  )
}
