"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Library,
  LogOut,
  Search,
  Sparkles,
  Users,
  Settings,
  UserIcon,
  Trophy,
  Fingerprint,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { Avatar } from "./avatar";
import { useUser } from "@/lib/use-user";
import { useProfile } from "@/lib/use-profile";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Главная", icon: Sparkles },
  { href: "/discover", label: "Каталог", icon: Search },
  { href: "/library", label: "Библиотека", icon: Library },
  { href: "/users", label: "Люди", icon: Users },
  { href: "/leaderboard", label: "Топ", icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName = profile?.display_name || profile?.username || "Профиль";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="mr-2 transition hover:opacity-90">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "text-accent" : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full accent-gradient shadow-[0_0_10px_rgb(var(--accent)/0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 py-1 pl-1 pr-2.5 transition hover:border-accent/60"
              >
                <Avatar
                  src={profile?.avatar_url}
                  name={displayName}
                  size={28}
                />
                <span className="hidden max-w-[120px] truncate text-sm font-medium md:block">
                  {displayName}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl glass-strong py-1 shadow-xl">
                    {profile && (
                      <Link
                        href={`/u/${profile.username}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-surface-2"
                      >
                        <UserIcon className="h-4 w-4 text-muted" /> Мой профиль
                      </Link>
                    )}
                    <Link
                      href="/taste"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-surface-2"
                    >
                      <Fingerprint className="h-4 w-4 text-muted" /> Игровой вкус
                    </Link>
                    <Link
                      href="/lists"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-surface-2"
                    >
                      <Library className="h-4 w-4 text-muted" /> Мои списки
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-surface-2"
                    >
                      <Settings className="h-4 w-4 text-muted" /> Настройки
                    </Link>
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-surface-2"
                    >
                      <LogOut className="h-4 w-4" /> Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth" className="btn-primary h-9">
              Войти
            </Link>
          )}
        </div>
      </div>

      {/* Мобильная нижняя навигация */}
      <nav className="flex items-center justify-around border-t border-border/60 px-2 py-1 sm:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
