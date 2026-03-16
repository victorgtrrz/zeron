"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUser, updateUser } from "@/lib/firebase/firestore";
import type { User, Locale } from "@/types";

const localeOptions: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Espanol" },
  { value: "zh-HK", label: "Traditional Chinese" },
];

export function ProfileForm() {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { user, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const data = await getUser(user!.uid);
        if (data) {
          setUserData(data);
          setDisplayName(data.displayName || "");
          setPreferredLocale(data.preferredLocale || "en");
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [user, authLoading]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);

    try {
      await updateUser(user.uid, {
        displayName,
        preferredLocale,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="mb-1 block text-sm font-medium text-muted"
        >
          {tAuth("displayName")}
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* Preferred Locale */}
      <div>
        <label
          htmlFor="preferredLocale"
          className="mb-1 block text-sm font-medium text-muted"
        >
          {t("preferredLocale")}
        </label>
        <select
          id="preferredLocale"
          value={preferredLocale}
          onChange={(e) => setPreferredLocale(e.target.value as Locale)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
        >
          {localeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            tCommon("save")
          )}
        </button>
        {success && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" />
            {t("profileUpdated")}
          </span>
        )}
      </div>
    </form>
  );
}
