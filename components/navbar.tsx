"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gamepad2, Library, LogOut, Search, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Главная", icon: Sparkles },
  { href: "/discover", label: "Каталог", icon: Search },
  { href: "/library", label: "Библиотека", icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="mr-2 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-fg">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            press<span className="text-accent">start</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[160px] truncate text-sm text-muted md:block">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="btn-ghost h-9 px-3"
                aria-label="Выйти"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Выйти</span>
              </button>
            </div>
          ) : (
            <Link href="/auth" className="btn-primary h-9">
              Войти
            </Link>
          )}
        </div>
      </div>

      {/* Мобильная нижняя навигация */}
      <nav className="flex items-center justify-around border-t border-border bg-bg px-2 py-1 sm:hidden">
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
