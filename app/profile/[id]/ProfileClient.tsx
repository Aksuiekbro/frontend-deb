"use client";

import AvatarWithEdit from "../../../components/profile/AvatarWithEdit";
import SocialsManager from "../../../components/profile/SocialsManager";
import LogoutButton from "@/components/profile/LogoutButton";
import { useCurrentUser, useUser } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { readResponseError } from "@/lib/http-error";
import { localeTags, useLocale, useTranslations, type TranslationCatalog } from "@/lib/i18n";
import { resolveMediaUrl } from "@/lib/media";
import type { SocialProfileRequest } from "@/types/util/socials/social-profile";

type ProfileClientProps = {
  userId: number;
};

const profileMessages: TranslationCatalog = {
  en: {
    loadingProfile: "Loading profile...",
    profileUnavailable: "Profile unavailable",
    profileUnavailableDescription: "Please sign in again or try another profile.",
    socialMedia: "Social media",
    deleteAccountUnavailable: "Account deletion is not available yet.",
    deleteAccount: "Delete account",
    failedUpdateProfilePicture: "Failed to update profile picture.",
    failedDeleteProfilePicture: "Failed to delete profile picture.",
    failedSaveSocialProfiles: "Failed to save social profiles.",
    organizer: "Organizer",
    participant: "Participant",
  },
  ru: {
    loadingProfile: "Загрузка профиля...",
    profileUnavailable: "Профиль недоступен",
    profileUnavailableDescription: "Войдите снова или попробуйте открыть другой профиль.",
    socialMedia: "Социальные сети",
    deleteAccountUnavailable: "Удаление аккаунта пока недоступно.",
    deleteAccount: "Удалить аккаунт",
    failedUpdateProfilePicture: "Не удалось обновить фото профиля.",
    failedDeleteProfilePicture: "Не удалось удалить фото профиля.",
    failedSaveSocialProfiles: "Не удалось сохранить профили в социальных сетях.",
    organizer: "Организатор",
    participant: "Участник",
  },
  kk: {
    loadingProfile: "Профиль жүктелуде...",
    profileUnavailable: "Профиль қолжетімсіз",
    profileUnavailableDescription: "Қайта кіріңіз немесе басқа профильді ашып көріңіз.",
    socialMedia: "Әлеуметтік желілер",
    deleteAccountUnavailable: "Аккаунтты жою әзірге қолжетімді емес.",
    deleteAccount: "Аккаунтты жою",
    failedUpdateProfilePicture: "Профиль суретін жаңарту мүмкін болмады.",
    failedDeleteProfilePicture: "Профиль суретін жою мүмкін болмады.",
    failedSaveSocialProfiles: "Әлеуметтік желі профильдерін сақтау мүмкін болмады.",
    organizer: "Ұйымдастырушы",
    participant: "Қатысушы",
  },
};

function formatJoinedDate(iso: string, localeTag: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(localeTag, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}

export default function ProfileClient({ userId }: ProfileClientProps) {
  const { locale } = useLocale();
  const t = useTranslations(profileMessages);
  const { user, isLoading, error, mutate } = useUser(userId);
  const { user: currentUser, mutate: mutateCurrentUser } = useCurrentUser();

  const isOwnProfile = Boolean(currentUser && user && currentUser.id === user.id);

  const saveAvatar = async (file: File) => {
    const res = await api.updateMyProfilePicture(file);
    if (!res.ok) {
      throw new Error(await readResponseError(res, { fallback: t("failedUpdateProfilePicture") }));
    }
    await Promise.all([mutate(), mutateCurrentUser()]);
  };

  const deleteAvatar = async () => {
    const res = await api.deleteMyProfilePicture();
    if (!res.ok) {
      throw new Error(await readResponseError(res, { fallback: t("failedDeleteProfilePicture") }));
    }
    await Promise.all([mutate(), mutateCurrentUser()]);
  };

  const saveSocials = async (socials: SocialProfileRequest[]) => {
    const res = await api.updateMySocialProfiles(socials);
    if (!res.ok) {
      throw new Error(await readResponseError(res, { fallback: t("failedSaveSocialProfiles") }));
    }
    await Promise.all([mutate(), mutateCurrentUser()]);
  };

  let content;

  if (isLoading) {
    content = (
      <section className="mx-auto max-w-[1280px] rounded-[10px] bg-white border border-black/10 px-6 py-8">
        <p className="text-[18px] text-[#0D1321]/70">{t("loadingProfile")}</p>
      </section>
    );
  } else if (error || !user) {
    content = (
      <section className="mx-auto max-w-[1280px] rounded-[10px] bg-white border border-black/10 px-6 py-8">
        <h2 className="text-[24px] font-medium text-[#0D1321]">{t("profileUnavailable")}</h2>
        <p className="mt-2 text-[16px] text-[#0D1321]/70">{t("profileUnavailableDescription")}</p>
      </section>
    );
  } else {
    const socials: SocialProfileRequest[] = user.socialProfiles.map((sp) => ({
      platform: sp.socialPlatform,
      handle: sp.handle,
    }));

    const view = {
      shortName: user.username,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role === "ORGANIZER" ? t("organizer") : user.role === "PARTICIPANT" ? t("participant") : titleCase(user.role),
      joinedAt: formatJoinedDate(user.createdAt, localeTags[locale]),
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
          <h3 className="text-[24px] font-medium text-[#0D1321]">{t("socialMedia")}</h3>

          <SocialsManager initialSocials={socials} editable={isOwnProfile} onSave={isOwnProfile ? saveSocials : undefined} />
        </div>

        <hr className="border-t border-black/10" />

        <div className="px-6 md:px-8 py-5 flex items-center justify-between">
          <LogoutButton />
          <button
            type="button"
            disabled
            title={t("deleteAccountUnavailable")}
            className="text-[18px] text-[#FF4800] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("deleteAccount")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div lang={localeTags[locale]} className="min-h-screen bg-[#F1F1F1] font-hikasami">

      <main className="px-8 py-8">{content}</main>
    </div>
  );
}
