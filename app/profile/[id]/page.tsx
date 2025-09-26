import Header from "../../../components/Header";
import { LogOut } from "lucide-react";
import AvatarWithEdit from "../../../components/profile/AvatarWithEdit";
import SocialsManager from "../../../components/profile/SocialsManager";

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

  // Interactive socials UI handled in client component

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      <main className="px-8 py-8">
        <section className="mx-auto max-w-[1280px] rounded-[10px] bg-white border border-black/10">
          {/* Top profile row */}
          <div className="flex flex-wrap items-center justify-between gap-6 px-6 md:px-8 py-6">
            <div className="flex items-center gap-4">
              <AvatarWithEdit src={user.avatarUrl} sizePx={72} />
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

            <SocialsManager initialSocials={user.socials as any} />
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


