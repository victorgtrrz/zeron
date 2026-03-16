"use client";

import { useState } from "react";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resetPassword } from "@/lib/firebase/auth";

interface ForgotPasswordFormProps {
  onSwitchToLogin?: () => void;
}

export default function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("email") + " is required");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  }

  const backToLogin = onSwitchToLogin ? (
    <button
      type="button"
      onClick={onSwitchToLogin}
      className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("login")}
    </button>
  ) : (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("login")}
    </Link>
  );

  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Mail className="h-8 w-8 text-success" />
          </div>
        </div>
        <h2 className="mb-2 font-heading text-xl font-bold text-accent">
          {t("resetPassword")}
        </h2>
        <p className="mb-6 text-sm text-muted">{t("resetSent")}</p>
        <div>{backToLogin}</div>
      </div>
    );
  }

  return (
    <div className={onSwitchToLogin ? "" : "animate-fade-in"}>
      <h1 className="mb-2 text-center font-heading text-2xl font-bold text-accent">
        {t("resetPassword")}
      </h1>
      <p className="mb-6 text-center text-sm text-muted">
        {t("forgotPassword")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="mb-1 block text-sm text-muted">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background py-3 pl-11 pr-4 text-accent outline-none focus:ring-2 focus:ring-brand"
              placeholder={t("email")}
            />
          </div>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            t("resetPassword")
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        {backToLogin}
      </div>
    </div>
  );
}
