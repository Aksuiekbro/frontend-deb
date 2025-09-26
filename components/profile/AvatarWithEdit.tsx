"use client";

import React from "react";
import { Pencil } from "lucide-react";

interface AvatarWithEditProps {
  src: string;
  sizePx?: number;
  onChangeImage?: (file: File, previewUrl: string) => void;
}

export default function AvatarWithEdit({ src, sizePx = 72, onChangeImage }: AvatarWithEditProps) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);

  const dimension = `${sizePx}px`;

  const onPick = () => setOpen(true);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChangeImage?.(file, url);
  };

  return (
    <div className="relative" style={{ width: dimension, height: dimension }}>
      {/* Avatar */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview ?? src}
        alt="User avatar"
        className="h-full w-full rounded-full object-cover bg-black/5"
      />

      {/* Edit button overlay (from Figma: small rounded white control) */}
      <button
        type="button"
        aria-label="Edit avatar"
        onClick={onPick}
        className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center hover:bg-black/5 transition-colors"
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
              <h3 className="text-[#0D1321] text-[18px] font-medium">Change avatar</h3>
              <button onClick={() => setOpen(false)} className="text-[#0D1321] hover:opacity-80">✕</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/avatar-placeholder.png"
              alt="Edit avatar prompt"
              className="w-full rounded-[8px] border border-black/10 object-contain mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-black/10 text-[#0D1321] hover:bg-black/5"
                onClick={() => inputRef.current?.click()}
              >
                Change image
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#3E5C76] text-white hover:bg-[#4a6d8f]"
                onClick={() => inputRef.current?.click()}
              >
                Upload new
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <button type="button" className="text-[#FF4800] hover:opacity-90">Delete image</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


