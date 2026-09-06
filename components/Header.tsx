"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-api";
import { resolveMediaUrl } from "@/lib/media";
import { Role } from "@/types/user/user";
import {
  localeLabels,
  locales,
  useLocale,
  useTranslations,
  type Locale,
} from "@/lib/i18n";

const headerMessages = {
  en: {
    joinDebates: "Join Debates",
    browseDebates: "Browse Debates",
    hostDebate: "Host Debate",
    rating: "Rating",
    news: "News",
    language: "Language",
    myTournaments: "My Tournaments",
    profile: "Your profile",
    logIn: "Log In",
    register: "Register",
  },
  ru: {
    joinDebates: "Участвовать в дебатах",
    browseDebates: "Смотреть дебаты",
    hostDebate: "Провести дебаты",
    rating: "Рейтинг",
    news: "Новости",
    language: "Язык",
    myTournaments: "Мои турниры",
    profile: "Ваш профиль",
    logIn: "Войти",
    register: "Регистрация",
  },
  kk: {
    joinDebates: "Дебатқа қатысу",
    browseDebates: "Пікірсайыстарды көру",
    hostDebate: "Дебат өткізу",
    rating: "Рейтинг",
    news: "Жаңалықтар",
    language: "Тіл",
    myTournaments: "Менің турнирлерім",
    profile: "Профиліңіз",
    logIn: "Кіру",
    register: "Тіркелу",
  },
} as const;

// --- The Header Component ---
export default function Header() {
  const { user, isLoading, error } = useCurrentUser();
  const { locale, setLocale } = useLocale();
  const t = useTranslations(headerMessages);

  const isLoggedIn = !!user;
  const isOrganizer = user?.role === Role.ORGANIZER;
  const hasResolvedUser = !isLoading && !error;
  const canBrowseDebates = hasResolvedUser;
  const canHostDebates = hasResolvedUser && (isOrganizer || !user);
  const homeHref = hasResolvedUser && user?.role === Role.PARTICIPANT
    ? "/dashboard"
    : hasResolvedUser && isOrganizer
      ? "/organizer"
      : "/";

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-8 lg:px-12">
      {/* ... The rest of your header JSX remains the same ... */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 lg:gap-x-16">
        <Link href={homeHref} className="text-[#0D1321] text-[45px] font-bold font-hikasami">DB</Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-1 lg:gap-x-12">
          {/* Nav Links */}
          {canBrowseDebates && (
            <Link href="/join" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
              {isOrganizer ? t("browseDebates") : t("joinDebates")}
            </Link>
          )}
          {canHostDebates && (
            <Link href="/create-tournament" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
              {t("hostDebate")}
            </Link>
          )}
          <Link href="/rating" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">{t("rating")}</Link>
          <Link href="/news" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">{t("news")}</Link>
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Language Selector */}
        <div className="relative">
          <select
            aria-label={t("language")}
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            className="border border-[#3E5C76] rounded-[8px] px-4 py-2 text-[#0D1321] bg-white text-[14px] font-medium appearance-none bg-no-repeat bg-right bg-[length:16px] pr-10 hover:border-[#748CAB] focus:outline-none focus:ring-2 focus:ring-[#3E5C76] focus:ring-opacity-20 transition-all duration-200 cursor-pointer min-w-[100px] shadow-sm"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%233E5C76%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")' }}
          >
            {locales.map((optionLocale) => (
              <option key={optionLocale} value={optionLocale}>
                {localeLabels[optionLocale]}
              </option>
            ))}
          </select>
        </div>
        {/* User Info / Auth Buttons */}
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <div className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
          ) : isLoggedIn ? (
            <>
              <Link
                href="/my-tournaments"
                className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-medium"
              >
                {t("myTournaments")}
              </Link>
              <Link
                href="/profile"
                aria-label={t("profile")}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                {user.imageUrl?.url ? (
                  // If image URL exists, render the img tag
                  <img
                    src={resolveMediaUrl(user.imageUrl.url)}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover bg-[#9a8c98]"
                  />
                ) : (
                  // Otherwise, render the fallback div with initials
                  <div className="w-10 h-10 bg-[#9a8c98] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                <span className="text-[#0D1321] text-[16px] font-normal">{user.username}</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth?mode=login" prefetch={false} className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-medium">{t("logIn")}</Link>
              <Link href="/auth?mode=register" prefetch={false} className="bg-[#3E5C76] text-white px-4 py-2 rounded-[8px] hover:bg-[#748CAB] transition-colors duration-200 text-[16px] font-medium shadow-sm">{t("register")}</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
