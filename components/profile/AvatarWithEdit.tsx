"use client";

import React from "react";
import { Pencil } from "lucide-react";

interface AvatarWithEditProps {
  src: string;
  sizePx?: number;
  onChangeImage?: (file: File, previewUrl: string) => void;
  onDeleteImage?: () => Promise<void> | void;
}

const FALLBACK_AVATAR_SRC = "/images/avatar-placeholder.png";

export default function AvatarWithEdit({ src, sizePx = 72, onChangeImage, onDeleteImage }: AvatarWithEditProps) {
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
        alt="User avatar"
        className="h-full w-full rounded-full object-cover bg-[var(--db-surface)] border-[3px] border-[var(--db-accent)]"
        onError={() => {
          if (!preview && src !== FALLBACK_AVATAR_SRC) setFailedSrc(src);
        }}
      />

      {/* Edit button overlay (from Figma: small rounded white control) */}
      <button
        type="button"
        aria-label="Edit avatar"
        disabled={!canEdit}
        onClick={onPick}
        className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[var(--db-bg-elevated)] border border-[var(--db-border)] shadow-sm flex items-center justify-center hover:bg-[var(--db-surface)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Pencil className="h-4 w-4 text-[var(--db-fg)]" />
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
          <div className="db-panel relative z-10 w-[min(90vw,420px)] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[var(--db-fg)] text-[18px] font-medium font-[var(--db-font-display)]">Change avatar</h3>
              <button onClick={() => setOpen(false)} className="text-[var(--db-fg)] hover:opacity-80">✕</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FALLBACK_AVATAR_SRC}
              alt="Edit avatar prompt"
              className="w-full rounded-[8px] border border-[var(--db-border)] object-contain mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="db-btn db-btn-secondary"
                onClick={() => inputRef.current?.click()}
              >
                Change image
              </button>
              <button
                type="button"
                className="db-btn db-btn-primary"
                onClick={() => inputRef.current?.click()}
              >
                Upload new
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                disabled={!onDeleteImage || deleting}
                onClick={handleDelete}
                className="text-[var(--db-status)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete image"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
