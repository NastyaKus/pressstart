"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogIn,
  Camera,
  Check,
  AtSign,
  ImagePlus,
  Globe,
  Lock,
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { Avatar } from "@/components/avatar";
import {
  fetchMyProfile,
  updateProfile,
  uploadAvatar,
  uploadProfileImage,
  isUsernameAvailable,
  isValidUsername,
  type Profile,
} from "@/lib/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useToast } from "@/components/toast";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [nameStatus, setNameStatus] = useState<
    "idle" | "checking" | "free" | "taken" | "invalid"
  >("idle");

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    fetchMyProfile()
      .then((p) => {
        if (p) {
          setProfile(p);
          setDisplayName(p.display_name ?? "");
          setUsername(p.username);
          setBio(p.bio ?? "");
          setAvatarUrl(p.avatar_url);
          setBannerUrl(p.banner_url);
          setIsPublic(p.is_public);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [user]);

  // Живая проверка @юзернейма.
  useEffect(() => {
    if (!profile) return;
    const handle = username.trim().toLowerCase();
    if (handle === profile.username) {
      setNameStatus("idle");
      return;
    }
    if (!isValidUsername(handle)) {
      setNameStatus("invalid");
      return;
    }
    setNameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const free = await isUsernameAvailable(handle, profile.id);
        setNameStatus(free ? "free" : "taken");
      } catch {
        setNameStatus("idle");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, profile]);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Файл больше 3 МБ — выбери поменьше.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить");
    } finally {
      setUploading(false);
    }
  }

  async function onPickBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Баннер больше 5 МБ — выбери поменьше.");
      return;
    }
    setUploadingBanner(true);
    setError(null);
    try {
      const url = await uploadProfileImage(file, "banner");
      setBannerUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleSave() {
    const handle = username.trim().toLowerCase();
    if (!isValidUsername(handle)) {
      setError("@юзернейм: 3–20 символов, латиница, цифры, _");
      return;
    }
    if (nameStatus === "taken") {
      setError("Этот @юзернейм уже занят");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        display_name: displayName.trim() || handle,
        username: handle,
        bio: bio.trim(),
        avatar_url: avatarUrl ?? undefined,
        banner_url: bannerUrl ?? undefined,
        is_public: isPublic,
      });
      // Локально фиксируем новые значения (чтобы ссылки вели на новый @хэндл).
      setProfile((p) =>
        p
          ? {
              ...p,
              username: handle,
              display_name: displayName.trim() || handle,
              bio: bio.trim(),
              avatar_url: avatarUrl,
              banner_url: bannerUrl,
            }
          : p
      );
      // Навбар мгновенно перечитывает профиль.
      window.dispatchEvent(new Event("pressstart:profile"));
      toast("Профиль сохранён");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось сохранить";
      setError(msg);
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!userLoading && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Настройки профиля</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {isSupabaseConfigured
            ? "Войди в аккаунт, чтобы редактировать профиль."
            : "Демо‑режим: подключи Supabase (см. README)."}
        </p>
        <Link href="/auth" className="btn-primary mt-6">
          <LogIn className="h-4 w-4" /> Войти
        </Link>
      </div>
    );
  }

  if (userLoading || !loaded) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  const nameHint = {
    idle: "",
    checking: "Проверяю…",
    free: "Свободно ✓",
    taken: "Занято",
    invalid: "3–20 символов: a–z, 0–9, _",
  }[nameStatus];

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Профиль
        </h1>
        {profile && (
          <Link
            href={`/u/${profile.username}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            Открыть профиль →
          </Link>
        )}
      </div>

      <div className="card space-y-6 p-6">
        {/* Баннер */}
        <div>
          <label className="mb-2 block text-sm font-medium">Баннер профиля</label>
          <div className="relative h-28 overflow-hidden rounded-xl border border-border/70">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt="Баннер"
                className="h-full w-full scale-105 object-cover blur-[1px]"
              />
            ) : (
              <div className="h-full w-full accent-gradient" />
            )}
            <label className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-lg glass-strong px-3 py-1.5 text-xs font-medium">
              {uploadingBanner ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              Сменить фон
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickBanner}
                disabled={uploadingBanner}
              />
            </label>
          </div>
        </div>

        {/* Аватарка */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={avatarUrl} name={displayName || username} size={80} />
            <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full accent-gradient text-accent-fg shadow-[0_0_14px_-2px_rgb(var(--accent)/0.8)]">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <p className="font-medium">Аватарка</p>
            <p className="text-sm text-muted">PNG, JPG или GIF, до 3 МБ</p>
          </div>
        </div>

        {/* Ник */}
        <div>
          <label className="mb-2 block text-sm font-medium">Ник</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={32}
            placeholder="Как тебя показывать"
            className="input"
          />
        </div>

        {/* @юзернейм */}
        <div>
          <label className="mb-2 block text-sm font-medium">@юзернейм</label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={20}
              placeholder="nickname"
              className="input pl-10"
            />
          </div>
          {nameHint && (
            <p
              className={`mt-1.5 text-xs ${
                nameStatus === "free"
                  ? "text-green-500"
                  : nameStatus === "taken" || nameStatus === "invalid"
                    ? "text-red-500"
                    : "text-muted"
              }`}
            >
              {nameHint}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="mb-2 block text-sm font-medium">О себе</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Пару слов о себе и любимых играх"
            className="input resize-none"
          />
        </div>

        {/* Приватность */}
        <button
          type="button"
          onClick={() => setIsPublic((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface/60 p-4 text-left transition hover:border-accent/50"
        >
          <span className="flex items-center gap-3">
            {isPublic ? (
              <Globe className="h-5 w-5 text-accent" />
            ) : (
              <Lock className="h-5 w-5 text-muted" />
            )}
            <span>
              <span className="block text-sm font-medium">
                {isPublic ? "Публичный профиль" : "Приватный профиль"}
              </span>
              <span className="block text-xs text-muted">
                {isPublic
                  ? "Профиль и библиотека видны всем, попадают в поиск и топ"
                  : "Профиль скрыт от других — виден только тебе"}
              </span>
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              isPublic ? "bg-accent" : "bg-surface-2"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                isPublic ? "left-[22px]" : "left-0.5"
              }`}
            />
          </span>
        </button>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || uploading || nameStatus === "checking"}
          className="btn-primary w-full"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saved ? "Сохранено" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
