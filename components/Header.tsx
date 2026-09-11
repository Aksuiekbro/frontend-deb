"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-api";
import { resolveMediaUrl } from "@/lib/media";
import ThemeToggle from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/join", label: "Join Debates" },
  { href: "/create-tournament", label: "Host Debate" },
  { href: "/rating", label: "Rating" },
  { href: "/news", label: "News" },
];

const LANGUAGE_SELECT_CLASSES =
  "border border-[var(--db-input-border)] rounded-[8px] px-4 py-2 text-[var(--db-fg)] bg-[var(--db-bg-elevated)] text-[14px] font-medium appearance-none bg-no-repeat bg-right bg-[length:16px] pr-10 hover:border-[var(--db-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--db-accent)] focus:ring-opacity-20 transition-all duration-200 cursor-pointer min-w-[100px] shadow-sm";
const LANGUAGE_SELECT_BG =
  'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%233E5C76%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")';

function LanguageSelect() {
  return (
    <select className={LANGUAGE_SELECT_CLASSES} style={{ backgroundImage: LANGUAGE_SELECT_BG }}>
      <option>🇺🇸 English</option>
      <option>🇷🇺 Русский</option>
      <option>🇰🇿 Қазақша</option>
    </select>
  );
}

// --- The Header Component ---
// `pathname` and `hideAuthActions` are supplied by HeaderWrapper (which has
// access to next/navigation's usePathname). Keeping that dependency out of
// this component keeps it renderable in isolation, e.g. in Header.test.tsx.
export default function Header({
  pathname = "",
  hideAuthActions = false,
}: {
  pathname?: string;
  hideAuthActions?: boolean;
}) {
  const { user, isLoading } = useCurrentUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoggedIn = !!user;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  return (
    <>
      <header className="db-site-header">
        <div className="db-site-header__inner">
          <Link href="/" className="db-brand">DeBetter</Link>
          <nav className="db-primary-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="db-header-actions">
            <ThemeToggle />
            <div className="hidden min-[860px]:block">
              <LanguageSelect />
            </div>
            {!hideAuthActions && (
              isLoading ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-[var(--db-border)] rounded-full" />
                  <div className="hidden min-[860px]:block h-4 bg-[var(--db-border)] rounded w-24" />
                </div>
              ) : isLoggedIn ? (
                <Link href="/profile" aria-label="Your profile" className="db-header-user">
                  {user.imageUrl?.url ? (
                    <img
                      src={resolveMediaUrl(user.imageUrl.url)}
                      alt={user.username}
                      className="db-header-user__avatar object-cover"
                    />
                  ) : (
                    <div className="db-header-user__avatar">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <span className="db-header-user__name">{user.username}</span>
                </Link>
              ) : (
                <div className="hidden min-[860px]:flex items-center gap-4">
                  <Link href="/auth?mode=login" prefetch={false} className="db-btn db-btn-secondary">Log In</Link>
                  <Link href="/auth?mode=register" prefetch={false} className="db-btn db-btn-primary">Register</Link>
                </div>
              )
            )}
            <button
              type="button"
              className="db-nav-toggle"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="db-nav-drawer" data-open={drawerOpen}>
        <div className="db-nav-drawer__scrim" onClick={() => setDrawerOpen(false)} />
        <div className="db-nav-drawer__panel" role="dialog" aria-label="Menu">
          <button
            type="button"
            className="db-nav-drawer__close"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)}>
              {link.label}
            </Link>
          ))}
          {!hideAuthActions && (
            isLoggedIn ? (
              <Link href="/profile" onClick={() => setDrawerOpen(false)}>Your Profile</Link>
            ) : (
              <>
                <Link href="/auth?mode=login" prefetch={false} onClick={() => setDrawerOpen(false)}>Log In</Link>
                <Link href="/auth?mode=register" prefetch={false} onClick={() => setDrawerOpen(false)}>Register</Link>
              </>
            )
          )}
          <div className="pt-3">
            <LanguageSelect />
          </div>
        </div>
      </div>
    </>
  );
}
