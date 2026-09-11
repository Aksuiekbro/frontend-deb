"use client";

import AvatarWithEdit from "../../../components/profile/AvatarWithEdit";
import SocialsManager from "../../../components/profile/SocialsManager";
import LogoutButton from "@/components/profile/LogoutButton";
import Footer from "@/components/Footer";
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
      <div className="db-panel profile-card px-6 py-8">
        <p className="text-[18px] text-[var(--db-muted)]">Loading profile...</p>
      </div>
    );
  } else if (error || !user) {
    content = (
      <div className="db-panel profile-card px-6 py-8">
        <h2 className="text-[24px] font-medium text-[var(--db-fg)] font-[var(--db-font-display)]">Profile unavailable</h2>
        <p className="mt-2 text-[16px] text-[var(--db-muted)]">Please sign in again or try another profile.</p>
      </div>
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
      <div className="db-panel profile-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-7">
          <div className="flex items-center gap-[18px]">
            <AvatarWithEdit
              src={view.avatarUrl}
              sizePx={84}
              onChangeImage={isOwnProfile ? saveAvatar : undefined}
              onDeleteImage={isOwnProfile ? deleteAvatar : undefined}
            />
            <div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="font-[var(--db-font-display)] text-[24px] text-[var(--db-fg)]">{view.shortName}</span>
                {view.joinedAt && <span className="text-[13px] text-[var(--db-muted)]">Joined {view.joinedAt}</span>}
              </div>
              <p className="text-[18px] text-[var(--db-fg)] mt-0.5">{view.fullName}</p>
              <a href={`mailto:${view.email}`} className="text-[15px] text-[var(--db-link)] hover:text-[var(--db-link-hover)] underline">
                {view.email}
              </a>
            </div>
          </div>

          <span className="text-[14px] px-3.5 py-1.5 border border-[var(--db-border)] rounded-[var(--db-radius-pill)] text-[var(--db-fg)]">
            {view.role}
          </span>
        </div>

        <div className="px-7 py-6 border-t border-[var(--db-border)]">
          <h3 className="font-[var(--db-font-display)] text-[20px] text-[var(--db-fg)] mb-3.5">Social media</h3>
          <SocialsManager initialSocials={socials} editable={isOwnProfile} onSave={isOwnProfile ? saveSocials : undefined} />
        </div>

        <div className="px-7 py-[22px] border-t border-[var(--db-border)] flex items-center justify-between">
          <LogoutButton />
          <button
            type="button"
            disabled
            title="Account deletion is not available yet."
            className="text-[15px] text-[var(--db-status)] bg-none border-none cursor-not-allowed opacity-55"
          >
            Delete account
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '60% 55%' }}>
        <img src="/images/senate/aqueduct.png" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
        <section className="db-hero" style={{ height: 220 }} />
        <div className="max-w-[880px] mx-auto -mt-16 mb-16 px-5 relative z-[3]">{content}</div>
      </main>

      <Footer />
    </>
  );
}
