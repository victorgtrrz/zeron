"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { updateUserPassword } from "@/lib/firebase/auth";

export function PasswordForm() {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError(t("passwordError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current password */}
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-1 block text-sm font-medium text-muted"
        >
          {t("currentPassword")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-12 text-accent outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent"
          >
            {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label
          htmlFor="newPassword"
          className="mb-1 block text-sm font-medium text-muted"
        >
          {t("newPassword")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="newPassword"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-12 text-accent outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent"
          >
            {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Confirm new password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium text-muted"
        >
          {t("confirmNewPassword")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-12 text-accent outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent"
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="flex items-center gap-1 text-sm text-success">
          <Check className="h-4 w-4" />
          {t("passwordChanged")}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          tCommon("save")
        )}
      </button>
    </form>
  );
}
