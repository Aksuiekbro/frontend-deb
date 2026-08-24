"use client";

import React from "react";
import { Pencil } from "lucide-react";
import { useTranslations, type TranslationCatalog } from "@/lib/i18n";

interface AvatarWithEditProps {
  src: string;
  sizePx?: number;
  onChangeImage?: (file: File, previewUrl: string) => void;
  onDeleteImage?: () => Promise<void> | void;
}

const FALLBACK_AVATAR_SRC = "/images/avatar-placeholder.png";

const avatarMessages: TranslationCatalog = {
  en: {
    userAvatar: "User avatar",
    editAvatar: "Edit avatar",
    changeAvatar: "Change avatar",
    close: "Close",
    editAvatarPrompt: "Edit avatar prompt",
    changeImage: "Change image",
    uploadNew: "Upload new",
    deleting: "Deleting...",
    deleteImage: "Delete image",
  },
  ru: {
    userAvatar: "Аватар пользователя",
    editAvatar: "Изменить аватар",
    changeAvatar: "Изменить аватар",
    close: "Закрыть",
    editAvatarPrompt: "Окно изменения аватара",
    changeImage: "Изменить изображение",
    uploadNew: "Загрузить новое",
    deleting: "Удаление...",
    deleteImage: "Удалить изображение",
  },
  kk: {
    userAvatar: "Пайдаланушы аватары",
    editAvatar: "Аватарды өзгерту",
    changeAvatar: "Аватарды өзгерту",
    close: "Жабу",
    editAvatarPrompt: "Аватарды өзгерту терезесі",
    changeImage: "Суретті өзгерту",
    uploadNew: "Жаңасын жүктеу",
    deleting: "Жойылуда...",
    deleteImage: "Суретті жою",
  },
};

export default function AvatarWithEdit({ src, sizePx = 72, onChangeImage, onDeleteImage }: AvatarWithEditProps) {
  const t = useTranslations(avatarMessages);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const canEdit = Boolean(onChangeImage || onDeleteImage);

  const dimension = `${sizePx}px`;
  const imageSrc = preview ?? (failedSrc === src ? FALLBACK_AVATAR_SRC : src);

  const onPick = () => {
    if (!canEdit) return;
    setOpen(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFailedSrc(null);
    onChangeImage?.(file, url);
  };

  const handleDelete = async () => {
    if (!onDeleteImage || deleting) return;
    try {
      setDeleting(true);
      await onDeleteImage();
      setPreview(null);
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative" style={{ width: dimension, height: dimension }}>
      {/* Avatar */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={t("userAvatar")}
        className="h-full w-full rounded-full object-cover bg-black/5"
        onError={() => {
          if (!preview && src !== FALLBACK_AVATAR_SRC) setFailedSrc(src);
        }}
      />

      {/* Edit button overlay (from Figma: small rounded white control) */}
      <button
        type="button"
        aria-label={t("editAvatar")}
        disabled={!canEdit}
        onClick={onPick}
        className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center hover:bg-black/5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Pencil className="h-4 w-4 text-[#0D1321]" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {/* Popup modal with Figma asset */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-[min(90vw,420px)] rounded-[12px] bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#0D1321] text-[18px] font-medium">{t("changeAvatar")}</h3>
              <button type="button" aria-label={t("close")} onClick={() => setOpen(false)} className="text-[#0D1321] hover:opacity-80">✕</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FALLBACK_AVATAR_SRC}
              alt={t("editAvatarPrompt")}
              className="w-full rounded-[8px] border border-black/10 object-contain mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-black/10 text-[#0D1321] hover:bg-black/5"
                onClick={() => inputRef.current?.click()}
              >
                {t("changeImage")}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#3E5C76] text-white hover:bg-[#4a6d8f]"
                onClick={() => inputRef.current?.click()}
              >
                {t("uploadNew")}
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                disabled={!onDeleteImage || deleting}
                onClick={handleDelete}
                className="text-[#FF4800] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("deleteImage")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
