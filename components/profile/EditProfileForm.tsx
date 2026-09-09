"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { useTranslations, type TranslationCatalog } from "@/lib/i18n";
import type { UserResponse, UserUpdateRequest } from "@/types/user/user";

type EditProfileFormProps = {
  user: UserResponse;
  onSave: (patch: UserUpdateRequest, signal: AbortSignal) => Promise<void>;
};

const fields = ["username", "firstName", "lastName", "email"] as const;
type ProfileFields = Pick<UserResponse, (typeof fields)[number]>;

const messages: TranslationCatalog = {
  en: {
    editProfile: "Edit profile",
    username: "Nickname",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    save: "Save changes",
    saving: "Saving...",
    cancel: "Cancel",
    saved: "Profile updated.",
    unchanged: "No changes to save.",
    invalidUsername: "Use 3–20 letters (A–Z) or numbers for your nickname.",
    invalidName: "Enter a first and last name, each up to 50 characters.",
    invalidEmail: "Enter a valid email address of up to 50 characters.",
    failedSave: "Could not update your profile. Please try again.",
  },
  ru: {
    editProfile: "Редактировать профиль",
    username: "Никнейм",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Электронная почта",
    save: "Сохранить изменения",
    saving: "Сохранение...",
    cancel: "Отмена",
    saved: "Профиль обновлён.",
    unchanged: "Нет изменений для сохранения.",
    invalidUsername: "Никнейм должен содержать от 3 до 20 латинских букв или цифр.",
    invalidName: "Введите имя и фамилию, не более 50 символов в каждом поле.",
    invalidEmail: "Введите корректный адрес электронной почты длиной не более 50 символов.",
    failedSave: "Не удалось обновить профиль. Попробуйте ещё раз.",
  },
  kk: {
    editProfile: "Профильді өңдеу",
    username: "Лақап ат",
    firstName: "Аты",
    lastName: "Тегі",
    email: "Электрондық пошта",
    save: "Өзгерістерді сақтау",
    saving: "Сақталуда...",
    cancel: "Бас тарту",
    saved: "Профиль жаңартылды.",
    unchanged: "Сақтайтын өзгерістер жоқ.",
    invalidUsername: "Лақап ат 3–20 латын әрпінен немесе цифрдан тұруы керек.",
    invalidName: "Аты мен тегін енгізіңіз, әрқайсысы 50 таңбадан аспауы керек.",
    invalidEmail: "50 таңбадан аспайтын жарамды электрондық пошта мекенжайын енгізіңіз.",
    failedSave: "Профильді жаңарту мүмкін болмады. Қайталап көріңіз.",
  },
};

function profileFields(user: UserResponse): ProfileFields {
  return { username: user.username, firstName: user.firstName, lastName: user.lastName, email: user.email };
}

function ProfileEditor({ user, onSave }: EditProfileFormProps) {
  const t = useTranslations(messages);
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => profileFields(user));
  const [savedValues, setSavedValues] = useState(() => profileFields(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => () => request.current?.abort(), []);

  const open = () => {
    setValues(profileFields(user));
    setSavedValues(profileFields(user));
    setError(null);
    setStatus(null);
    setEditing(true);
  };

  const cancel = () => {
    request.current?.abort();
    request.current = null;
    setValues(profileFields(user));
    setSavedValues(profileFields(user));
    setSaving(false);
    setError(null);
    setStatus(null);
    setEditing(false);
    trigger.current?.focus();
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (request.current) return;
    setError(null);
    setStatus(null);

    const normalized: ProfileFields = {
      username: values.username.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
    };
    if (!/^[a-zA-Z0-9]{3,20}$/.test(normalized.username)) {
      setError(t("invalidUsername"));
      return;
    }
    if ([normalized.firstName, normalized.lastName].some((name) => !name || name.length > 50)) {
      setError(t("invalidName"));
      return;
    }
    if (normalized.email.length > 50 || !/^[^\s@]+@[^\s@]+$/.test(normalized.email)) {
      setError(t("invalidEmail"));
      return;
    }

    const patch: UserUpdateRequest = {};
    for (const field of fields) {
      if (normalized[field] !== savedValues[field]) patch[field] = normalized[field];
    }
    if (Object.keys(patch).length === 0) {
      setValues(normalized);
      setStatus(t("unchanged"));
      return;
    }

    const pending = new AbortController();
    request.current = pending;
    setSaving(true);
    try {
      await onSave(patch, pending.signal);
      if (pending.signal.aborted) return;
      setValues(normalized);
      setSavedValues(normalized);
      setStatus(t("saved"));
    } catch (cause) {
      if (pending.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : t("failedSave"));
    } finally {
      if (!pending.signal.aborted) {
        request.current = null;
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <button
        ref={trigger}
        type="button"
        aria-expanded={editing}
        aria-controls={`${id}-form`}
        onClick={editing ? cancel : open}
        className="rounded-md border border-[#3E5C76] px-4 py-2 text-[#3E5C76] hover:bg-[#3E5C76]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C76]"
      >
        {t("editProfile")}
      </button>
      {editing && (
        <form id={`${id}-form`} aria-label={t("editProfile")} aria-busy={saving} noValidate onSubmit={save} className="space-y-4">
          <fieldset disabled={saving} className="grid min-w-0 gap-4 sm:grid-cols-2 disabled:opacity-70">
            {fields.map((field) => (
              <div key={field} className="min-w-0 space-y-1">
                <label htmlFor={`${id}-${field}`} className="block text-sm font-medium text-[#0D1321]">{t(field)}</label>
                <input
                  id={`${id}-${field}`}
                  name={field}
                  type={field === "email" ? "email" : "text"}
                  autoComplete={{ username: "username", firstName: "given-name", lastName: "family-name", email: "email" }[field]}
                  autoFocus={field === "username"}
                  required
                  minLength={field === "username" ? 3 : undefined}
                  maxLength={field === "username" ? 20 : 50}
                  value={values[field]}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(event) => {
                    setValues((previous) => ({ ...previous, [field]: event.target.value }));
                    setError(null);
                    setStatus(null);
                  }}
                  className="w-full min-w-0 rounded-md border border-black/20 bg-white px-3 py-2 text-[#0D1321] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C76]"
                />
              </div>
            ))}
          </fieldset>
          {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
          {status && <p role="status" className="text-sm text-[#3E5C76]">{status}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded-md bg-[#3E5C76] px-4 py-2 text-white hover:bg-[#2D3748] disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? t("saving") : t("save")}
            </button>
            <button type="button" onClick={cancel} className="rounded-md border border-black/20 px-4 py-2 text-[#0D1321] hover:bg-black/5">{t("cancel")}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function EditProfileForm(props: EditProfileFormProps) {
  return <ProfileEditor key={props.user.id} {...props} />;
}
