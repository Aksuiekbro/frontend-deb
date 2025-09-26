import Header from "../../../components/Header";
import { Facebook, Instagram, Linkedin, LogOut, Pencil, Plus, Send, Trash2, Twitter, Youtube } from "lucide-react";

type ProfilePageProps = { params: Promise<{ id: string }> };

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id: userId } = await params;

  // Dummy data to mirror the Figma layout
  const user = {
    id: userId,
    shortName: "AbdixZH",
    fullName: "Zheksembek Abdolla",
    email: "abdullazheksembek@gmail.com",
    role: "Organizer",
    joinedAt: "20.09.2025",
    avatarUrl: "/images/avatar-placeholder.png",
    socials: [
      { type: "telegram" as const, handle: "@AbdixZH" },
      { type: "instagram" as const, handle: "abdullazheksembek" },
    ],
  };

  type SocialType = "telegram" | "instagram" | "twitter" | "facebook" | "linkedin" | "youtube";
  const networks: SocialType[] = ["telegram", "instagram", "twitter", "facebook", "linkedin", "youtube"]; 
  const savedTypes = new Set(user.socials.map(s => s.type));
  const plusRotationMs = 1000;
  const chipDurationMs = 300;
  const chipDelayStepMs = Math.floor((plusRotationMs - chipDurationMs) / Math.max(1, networks.length - 1));

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      <main className="px-8 py-8">
        <section className="mx-auto max-w-[1280px] rounded-[10px] bg-white border border-black/10">
          {/* Top profile row */}
          <div className="flex flex-wrap items-center justify-between gap-6 px-6 md:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="h-[72px] w-[72px] rounded-full overflow-hidden bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[24px] font-medium text-[#0D1321]">{user.shortName}</h2>
                  <span className="text-sm text-[#0D1321]/60">{user.joinedAt}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[20px] text-[#0D1321]">{user.fullName}</p>
                </div>
                <a href={`mailto:${user.email}`} className="text-[16px] text-[#748CAB] underline underline-offset-2">
                  {user.email}
                </a>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[18px] text-[#0D1321] underline underline-offset-4">{user.role}</span>
            </div>
          </div>

          <hr className="border-t border-black/10" />

          {/* Social media */}
          <div className="px-6 md:px-8 py-6 space-y-4">
            <h3 className="text-[24px] font-medium text-[#0D1321]">Social media</h3>

            <div className="space-y-4">
              {user.socials.map((s, idx) => (
                <div key={`${s.type}-${idx}`} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0D1321] text-white flex items-center justify-center">
                    {s.type === "telegram" ? <Send className="h-5 w-5" /> : <Instagram className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <input
                      defaultValue={s.handle}
                      readOnly
                      className="w-full border-b border-black/20 bg-transparent py-2 outline-none text-[#0D1321]"
                    />
                  </div>
                  <button type="button" aria-label="Edit" className="p-2 rounded hover:bg-black/5">
                    <Pencil className="h-5 w-5 text-[#0D1321]" />
                  </button>
                  <button type="button" aria-label="Delete" className="p-2 rounded hover:bg-black/5">
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
                  {networks.map((n, idx) => {
                    const isSaved = savedTypes.has(n as any);
                    const label =
                      n === "telegram" ? "Telegram" :
                      n === "instagram" ? "Instagram" :
                      n === "twitter" ? "Twitter" :
                      n === "facebook" ? "Facebook" :
                      n === "linkedin" ? "LinkedIn" :
                      "YouTube";
                    const delayMs = idx * chipDelayStepMs;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`flex items-center gap-3 rounded-full px-3 py-2 border whitespace-nowrap transition-all duration-300 ${
                          isSaved ? "bg-[#0D1321] text-white border-transparent" : "bg-white text-[#0D1321] border-black/10 hover:bg-black/5"
                        }`}
                        style={{ transitionDelay: `${delayMs}ms` }}
                      >
                        <span className={`h-8 w-8 rounded-full inline-flex items-center justify-center ${
                          isSaved ? "bg-white/20 text-white" : "bg-[#0D1321] text-white"
                        }`}>
                          {n === "telegram" ? <Send className="h-4 w-4" /> :
                           n === "instagram" ? <Instagram className="h-4 w-4" /> :
                           n === "twitter" ? <Twitter className="h-4 w-4" /> :
                           n === "facebook" ? <Facebook className="h-4 w-4" /> :
                           n === "linkedin" ? <Linkedin className="h-4 w-4" /> :
                           <Youtube className="h-4 w-4" />}
                        </span>
                        <span
                          className={`chip-text inline-block overflow-hidden align-middle ${
                            isSaved ? "text-white" : "text-[#0D1321]"
                          }`}
                          style={{ transitionDelay: `${delayMs + 100}ms` }}
                        >
                          <span className="pl-2">{label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-t border-black/10" />

          {/* Footer actions */}
          <div className="px-6 md:px-8 py-5 flex items-center justify-between">
            <button type="button" className="flex items-center gap-2 text-[#0D1321] hover:opacity-80">
              <LogOut className="h-5 w-5" />
              <span className="text-[18px]">Log out</span>
            </button>
            <button type="button" className="text-[18px] text-[#FF4800] hover:opacity-90">Delete account</button>
          </div>
        </section>
      </main>
    </div>
  );
}


