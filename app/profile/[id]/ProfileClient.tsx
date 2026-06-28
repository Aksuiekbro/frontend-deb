"use client";

import AvatarWithEdit from "../../../components/profile/AvatarWithEdit";
import SocialsManager from "../../../components/profile/SocialsManager";
import LogoutButton from "@/components/profile/LogoutButton";
import { useCurrentUser, useUser } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { readResponseError } from "@/lib/http-error";
import { resolveMediaUrl } from "@/lib/media";
import type { SocialProfileRequest } from "@/types/util/socials/social-profile";

type ProfileClientProps = {
  userId: number;
};

function formatJoinedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}

export default function ProfileClient({ userId }: ProfileClientProps) {
  const { user, isLoading, error, mutate } = useUser(userId);
  const { user: currentUser, mutate: mutateCurrentUser } = useCurrentUser();

  const isOwnProfile = Boolean(currentUser && user && currentUser.id === user.id);

  const saveAvatar = async (file: File) => {
    const res = await api.updateMyProfilePicture(file);
    if (!res.ok) {
      throw new Error(await readResponseError(res, { fallback: "Failed to update profile picture." }));
    }
    await Promise.all([mutate(), mutateCurrentUser()]);
  };

  const deleteAvatar = async () => {
    const res = await api.deleteMyProfilePicture();
    if (!res.ok) {
      throw new Error(await readResponseError(res, { fallback: "Failed to delete profile picture." }));
    }
    await Promise.all([mutate(), mutateCurrentUser()]);
  };

  const saveSocials = async (socials: SocialProfileRequest[]) => {
    const res = await api.updateMySocialProfiles(socials);
    if (!res.ok) {
      throw new Error(await readResponseError(res, { fallback: "Failed to save social profiles." }));
    }
    await Promise.all([mutate(), mutateCurrentUser()]);
  };

  let content;

  if (isLoading) {
    content = (
      <section className="mx-auto max-w-[1280px] rounded-[10px] bg-white border border-black/10 px-6 py-8">
        <p className="text-[18px] text-[#0D1321]/70">Loading profile...</p>
      </section>
    );
  } else if (error || !user) {
    content = (
      <section className="mx-auto max-w-[1280px] rounded-[10px] bg-white border border-black/10 px-6 py-8">
        <h2 className="text-[24px] font-medium text-[#0D1321]">Profile unavailable</h2>
        <p className="mt-2 text-[16px] text-[#0D1321]/70">Please sign in again or try another profile.</p>
      </section>
    );
  } else {
    const socials: SocialProfileRequest[] = user.socialProfiles.map((sp) => ({
      platform: sp.socialPlatform,
      handle: sp.handle,
      isPublic: sp.isPublic,
    }));

    const view = {
      shortName: user.username,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: titleCase(user.role),
      joinedAt: formatJoinedDate(user.createdAt),
      avatarUrl: resolveMediaUrl(user.imageUrl?.url) ?? "/images/avatar-placeholder.png",
    };

    content = (
      <section className="mx-auto max-w-[1280px] rounded-[10px] bg-white border border-black/10">
        <div className="flex flex-wrap items-center justify-between gap-6 px-6 md:px-8 py-6">
          <div className="flex items-center gap-4">
            <AvatarWithEdit
              src={view.avatarUrl}
              sizePx={72}
              onChangeImage={isOwnProfile ? saveAvatar : undefined}
              onDeleteImage={isOwnProfile ? deleteAvatar : undefined}
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[24px] font-medium text-[#0D1321]">{view.shortName}</h2>
                {view.joinedAt && <span className="text-sm text-[#0D1321]/60">{view.joinedAt}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[20px] text-[#0D1321]">{view.fullName}</p>
              </div>
              <a href={`mailto:${view.email}`} className="text-[16px] text-[#748CAB] underline underline-offset-2">
                {view.email}
              </a>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[18px] text-[#0D1321] underline underline-offset-4">{view.role}</span>
          </div>
        </div>

        <hr className="border-t border-black/10" />

        <div className="px-6 md:px-8 py-6 space-y-4">
          <h3 className="text-[24px] font-medium text-[#0D1321]">Social media</h3>

          <SocialsManager initialSocials={socials} editable={isOwnProfile} onSave={isOwnProfile ? saveSocials : undefined} />
        </div>

        <hr className="border-t border-black/10" />

        <div className="px-6 md:px-8 py-5 flex items-center justify-between">
          <LogoutButton />
          <button
            type="button"
            disabled
            title="Account deletion is not available yet."
            className="text-[18px] text-[#FF4800] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete account
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">

      <main className="px-8 py-8">{content}</main>
    </div>
  );
}
