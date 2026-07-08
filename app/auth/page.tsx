"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Gamepad2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LogoMark } from "@/components/logo";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase не настроен. Добавь ключи в .env.local (см. README).");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const nick = username.trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: nick } },
        });
        if (error) throw error;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Сохраняем ник в профиль (профиль уже создан триггером).
          if (nick && data.session.user) {
            await supabase
              .from("profiles")
              .update({ display_name: nick })
              .eq("id", data.session.user.id);
          }
          router.push("/library");
          router.refresh();
        } else {
          setNotice("Проверь почту — мы отправили ссылку для подтверждения.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/library");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card animate-fade-up p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex justify-center">
            <LogoMark size={52} />
          </span>
          <h1 className="font-display text-2xl font-bold">
            {mode === "login" ? "С возвращением" : "Создать аккаунт"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login"
              ? "Войди, чтобы открыть свою библиотеку"
              : "Зарегистрируйся и начни собирать игры"}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted">
            Демо‑режим: вход отключён, пока не добавлены ключи Supabase. Каталог
            игр при этом полностью доступен.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <Gamepad2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                required
                maxLength={24}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Твой ник"
                className="input pl-10"
                autoComplete="username"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="input pl-10"
              autoComplete="email"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мин. 6 символов)"
              className="input pl-10"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setNotice(null);
            }}
            className="font-medium text-accent hover:underline"
          >
            {mode === "login" ? "Создать" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
}
