"use client";

import React from "react";
import { Facebook, Instagram, Linkedin, Pencil, Plus, Send, Trash2, Twitter, Youtube } from "lucide-react";

export type SocialType = "telegram" | "instagram" | "twitter" | "facebook" | "linkedin" | "youtube";

export interface SocialItem {
  type: SocialType;
  handle: string;
}

interface SocialsManagerProps {
  initialSocials: SocialItem[];
}

const allNetworks: SocialType[] = [
  "telegram",
  "instagram",
  "twitter",
  "facebook",
  "linkedin",
  "youtube",
];

function NetworkIcon({ type, className }: { type: SocialType; className?: string }) {
  switch (type) {
    case "telegram":
      return <Send className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "twitter":
      return <Twitter className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    case "youtube":
      return <Youtube className={className} />;
  }
}

export default function SocialsManager({ initialSocials }: SocialsManagerProps) {
  const [socials, setSocials] = React.useState<SocialItem[]>(initialSocials);

  const savedTypes = new Set(socials.map((s) => s.type));

  const plusRotationMs = 1000;
  const chipDurationMs = 300;
  const chipDelayStepMs = Math.floor((plusRotationMs - chipDurationMs) / Math.max(1, allNetworks.length - 1));

  const handleAdd = (type: SocialType) => {
    if (savedTypes.has(type)) return;
    setSocials((prev) => [...prev, { type, handle: "" }]);
  };

  const handleRemove = (type: SocialType) => {
    setSocials((prev) => prev.filter((s) => s.type !== type));
  };

  const handleChange = (type: SocialType, value: string) => {
    setSocials((prev) => prev.map((s) => (s.type === type ? { ...s, handle: value } : s)));
  };

  return (
    <div className="space-y-4">
      {socials.map((s) => (
        <div key={s.type} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#0D1321] text-white flex items-center justify-center">
            <NetworkIcon type={s.type} className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <input
              value={s.handle}
              onChange={(e) => handleChange(s.type, e.target.value)}
              placeholder={s.type === "telegram" ? "@handle" : "username"}
              className="w-full border-b border-black/20 bg-transparent py-2 outline-none text-[#0D1321]"
            />
          </div>
          <button type="button" aria-label="Edit" className="p-2 rounded hover:bg-black/5">
            <Pencil className="h-5 w-5 text-[#0D1321]" />
          </button>
          <button type="button" aria-label="Delete" className="p-2 rounded hover:bg-black/5" onClick={() => handleRemove(s.type)}>
            <Trash2 className="h-5 w-5 text-[#0D1321]" />
          </button>
        </div>
      ))}

      <div className="inline-flex items-center gap-3">
        <input id="add-social-toggle" type="checkbox" className="peer sr-only" />
        <label htmlFor="add-social-toggle" aria-label="Add social" className="cursor-pointer select-none inline-flex transition-transform duration-1000 peer-checked:rotate-45">
          <span className="h-9 w-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10">
            <Plus className="h-5 w-5" />
          </span>
        </label>
        <div className="flex items-center gap-3 overflow-hidden transition-[max-width] duration-1000 max-w-0 peer-checked:max-w-[1000px] [&>button]:opacity-0 [&>button]:-translate-x-16 [&>button]:transition-all [&>button]:duration-300 peer-checked:[&>button]:opacity-100 peer-checked:[&>button]:translate-x-0 [&>button>.chip-text]:max-w-0 [&>button>.chip-text]:opacity-0 [&>button>.chip-text]:transition-all [&>button>.chip-text]:duration-300 peer-checked:[&>button>.chip-text]:max-w-[160px] peer-checked:[&>button>.chip-text]:opacity-100">
          {allNetworks.map((n, idx) => {
            const isSaved = savedTypes.has(n);
            const delayMs = idx * chipDelayStepMs;
            const label = n.charAt(0).toUpperCase() + n.slice(1);
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleAdd(n)}
                className={`flex items-center gap-3 rounded-full px-3 py-2 border whitespace-nowrap transition-all duration-300 ${
                  isSaved ? "bg-[#0D1321] text-white border-transparent" : "bg-white text-[#0D1321] border-black/10 hover:bg-black/5"
                }`}
                style={{ transitionDelay: `${delayMs}ms` }}
              >
                <span className={`h-8 w-8 rounded-full inline-flex items-center justify-center ${isSaved ? "bg-white/20 text-white" : "bg-[#0D1321] text-white"}`}>
                  <NetworkIcon type={n} className="h-4 w-4" />
                </span>
                <span className={`chip-text inline-block overflow-hidden align-middle ${isSaved ? "text-white" : "text-[#0D1321]"}`} style={{ transitionDelay: `${delayMs + 100}ms` }}>
                  <span className="pl-2">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


