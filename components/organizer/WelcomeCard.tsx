"use client";

import Link from "next/link";
import { useTranslations, type TranslationCatalog } from "@/lib/i18n";

export interface WelcomeCardProps {
  username?: string;
  userId?: number | string;
  profileHref?: string;
  tournaments?: number;
  activeTournaments?: number;
  className?: string;
}

const messages: TranslationCatalog = {
  en: {
    user: "User",
    welcomeBack: "Welcome back, {username}!",
    gladToSeeYou: "Glad to see you again.",
    userActions: "User actions",
    myProfile: "My Profile",
    myTournaments: "My Tournaments",
    yourStats: "Your Stats",
    tournaments: "Tournaments",
    activeTournaments: "Active Tournaments",
  },
  ru: {
    user: "Пользователь",
    welcomeBack: "С возвращением, {username}!",
    gladToSeeYou: "Рады снова вас видеть.",
    userActions: "Действия пользователя",
    myProfile: "Мой профиль",
    myTournaments: "Мои турниры",
    yourStats: "Ваша статистика",
    tournaments: "Турниры",
    activeTournaments: "Активные турниры",
  },
  kk: {
    user: "Пайдаланушы",
    welcomeBack: "Қайта қош келдіңіз, {username}!",
    gladToSeeYou: "Сізді қайта көргенімізге қуаныштымыз.",
    userActions: "Пайдаланушы әрекеттері",
    myProfile: "Менің профилім",
    myTournaments: "Менің турнирлерім",
    yourStats: "Статистикаңыз",
    tournaments: "Турнирлер",
    activeTournaments: "Белсенді турнирлер",
  },
};

export default function WelcomeCard({
  username,
  userId,
  profileHref,
  tournaments = 0,
  activeTournaments = 0,
  className,
}: WelcomeCardProps) {
  const t = useTranslations(messages);
  const displayName = username || t("user");
  const myProfileHref =
    profileHref ?? (userId != null ? `/profile/${userId}` : "/profile");
  const initial = displayName[0]?.toUpperCase() || t("user")[0].toUpperCase();

  return (
    <section
      aria-labelledby="welcome-heading"
      className={`rounded-[10px] bg-[#0D1321] px-6 md:px-10 py-8 md:py-10 text-white ${className || ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-white/10 flex items-center justify-center text-lg md:text-xl font-semibold"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div>
            <h2
              id="welcome-heading"
              className="text-xl md:text-2xl font-semibold"
            >
              {t("welcomeBack", { username: displayName })}
            </h2>
            <p className="text-sm text-white/70">{t("gladToSeeYou")}</p>
          </div>
        </div>
        <nav aria-label={t("userActions")} className="flex gap-3">
          <Link
            href={myProfileHref}
            className="px-4 py-2 rounded-md bg-white text-[#0D1321] text-sm md:text-base font-medium hover:bg-white/90 transition-colors"
          >
            {t("myProfile")}
          </Link>
          <Link
            href="/my-tournaments"
            className="px-4 py-2 rounded-md border border-white/30 text-white text-sm md:text-base font-medium hover:bg-white/10 transition-colors"
          >
            {t("myTournaments")}
          </Link>
        </nav>
      </div>
      <div className="mt-8">
        <h3 className="text-sm uppercase tracking-wide text-white/70">
          {t("yourStats")}
        </h3>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white/5 p-4">
            <dt className="text-white/70 text-sm">{t("tournaments")}</dt>
            <dd className="text-2xl md:text-3xl font-bold">{tournaments}</dd>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <dt className="text-white/70 text-sm">{t("activeTournaments")}</dt>
            <dd className="text-2xl md:text-3xl font-bold">
              {activeTournaments}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
