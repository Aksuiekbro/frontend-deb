"use client";

import React from "react";
import { Facebook, Instagram, Linkedin, Pencil, Plus, Send, Trash2, Twitter, Youtube } from "lucide-react";

import { SocialPlatform, type SocialProfileRequest } from "@/types/util/socials/social-profile";

interface SocialsManagerProps {
  initialSocials: SocialProfileRequest[];
  editable?: boolean;
  onSave?: (socials: SocialProfileRequest[]) => Promise<void> | void;
}

const allNetworks: SocialPlatform[] = [
  SocialPlatform.TELEGRAM,
  SocialPlatform.INSTAGRAM,
  SocialPlatform.TWITTER,
  SocialPlatform.FACEBOOK,
  SocialPlatform.LINKEDIN,
  SocialPlatform.YOUTUBE,
];

const PLUS_ROTATION_MS = 1000;
const CHIP_DURATION_MS = 300;
const CHIP_DELAY_STEP_MS = Math.floor((PLUS_ROTATION_MS - CHIP_DURATION_MS) / Math.max(1, allNetworks.length - 1));

function NetworkIcon({ type, className }: { type: SocialPlatform; className?: string }) {
  switch (type) {
    case SocialPlatform.TELEGRAM:
      return <Send className={className} />;
    case SocialPlatform.INSTAGRAM:
      return <Instagram className={className} />;
    case SocialPlatform.TWITTER:
      return <Twitter className={className} />;
    case SocialPlatform.FACEBOOK:
      return <Facebook className={className} />;
    case SocialPlatform.LINKEDIN:
      return <Linkedin className={className} />;
    case SocialPlatform.YOUTUBE:
      return <Youtube className={className} />;
    default:
      return <Send className={className} />;
  }
}

function networkLabel(type: SocialPlatform): string {
  switch (type) {
    case SocialPlatform.LINKEDIN:
      return "LinkedIn";
    case SocialPlatform.YOUTUBE:
      return "YouTube";
    default:
      return type.charAt(0) + type.slice(1).toLowerCase();
  }
}

export default function SocialsManager({ initialSocials, editable = false, onSave }: SocialsManagerProps) {
  const [socials, setSocials] = React.useState<SocialProfileRequest[]>(initialSocials);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const savedTypes = new Set(socials.map((s) => s.platform));

  const handleAdd = (type: SocialPlatform) => {
    if (!editable) return;
    if (savedTypes.has(type)) return;
    setDirty(true);
    setSocials((prev) => [...prev, { platform: type, handle: "" }]);
    setPickerOpen(false);
  };

  const handleRemove = (type: SocialPlatform) => {
    if (!editable) return;
    setDirty(true);
    setSocials((prev) => prev.filter((s) => s.platform !== type));
  };

  const handleChange = (type: SocialPlatform, value: string) => {
    if (!editable) return;
    setDirty(true);
    setSocials((prev) => prev.map((s) => (s.platform === type ? { ...s, handle: value } : s)));
  };

  const handleSave = async () => {
    if (!onSave || saving) return;

    try {
      setSaving(true);
      setError(null);
      await onSave(socials);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save social profiles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {socials.map((s) => (
        <div key={s.platform} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#0D1321] text-white flex items-center justify-center">
            <NetworkIcon type={s.platform} className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <input
              value={s.handle}
              onChange={(e) => handleChange(s.platform, e.target.value)}
              readOnly={!editable}
              placeholder={s.platform === SocialPlatform.TELEGRAM ? "@handle" : "username"}
              className="w-full border-b border-black/20 bg-transparent py-2 outline-none text-[#0D1321] read-only:cursor-default"
            />
          </div>
          {editable && (
            <>
              <button type="button" aria-label="Edit" className="p-2 rounded hover:bg-black/5">
                <Pencil className="h-5 w-5 text-[#0D1321]" />
              </button>
              <button type="button" aria-label="Delete" className="p-2 rounded hover:bg-black/5" onClick={() => handleRemove(s.platform)}>
                <Trash2 className="h-5 w-5 text-[#0D1321]" />
              </button>
            </>
          )}
        </div>
      ))}

      {editable && (
      <div className="inline-flex max-w-full items-center gap-3">
        <button
          type="button"
          aria-label="Add social"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
          className="h-9 w-9 shrink-0 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-transform duration-1000 aria-expanded:rotate-45"
        >
          <Plus className="h-5 w-5" />
        </button>
        <div
          aria-hidden={!pickerOpen}
          className={`flex items-center gap-3 overflow-hidden transition-[max-width] duration-1000 ${
            pickerOpen ? "max-w-[1000px]" : "max-w-0"
          }`}
        >
          {allNetworks.map((n, index) => {
            const isSaved = savedTypes.has(n);
            const label = networkLabel(n);
            const delayMs = index * CHIP_DELAY_STEP_MS;
            return (
              <button
                key={n}
                type="button"
                aria-label={label}
                onClick={() => handleAdd(n)}
                disabled={!pickerOpen || isSaved}
                tabIndex={pickerOpen ? 0 : -1}
                className={`flex items-center gap-3 rounded-full px-3 py-2 border whitespace-nowrap transition-all duration-300 ${
                  isSaved ? "bg-[#0D1321] text-white border-transparent opacity-70" : "bg-white text-[#0D1321] border-black/10 hover:bg-black/5"
                } ${pickerOpen ? "translate-x-0 opacity-100" : "-translate-x-16 opacity-0"}`}
                style={{ transitionDelay: `${delayMs}ms` }}
              >
                <span className={`h-8 w-8 rounded-full inline-flex items-center justify-center ${isSaved ? "bg-white/20 text-white" : "bg-[#0D1321] text-white"}`}>
                  <NetworkIcon type={n} className="h-4 w-4" />
                </span>
                <span
                  className={`chip-text inline-block overflow-hidden align-middle transition-all duration-300 ${
                    pickerOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                  } ${isSaved ? "text-white" : "text-[#0D1321]"}`}
                  style={{ transitionDelay: `${delayMs + 100}ms` }}
                >
                  <span className="pl-2">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}
      {editable && onSave && (
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Save social profiles"
            disabled={!dirty || saving}
            onClick={handleSave}
            className="rounded-md bg-[#3E5C76] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D3748] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
