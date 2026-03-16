"use client";

import { useState } from "react";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signUpWithEmail } from "@/lib/firebase/auth";
import { createUser } from "@/lib/firebase/firestore";
import { updateProfile } from "firebase/auth";

export default function SignupForm() {
  const t = useTranslations("auth");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!displayName.trim()) {
      errors.displayName = t("displayName") + " is required";
    }
    if (!email.trim()) {
      errors.email = t("email") + " is required";
    }
    if (!password) {
      errors.password = t("password") + " is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!confirmPassword) {
      errors.confirmPassword = t("confirmPassword") + " is required";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password);
      const user = result.user;

      await updateProfile(user, { displayName: displayName.trim() });

      await createUser(user.uid, {
        email: user.email ?? email,
        displayName: displayName.trim(),
        photoURL: "",
      });

      setSuccess(true);
    } catch {
      setError(t("signupError"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <svg
              className="h-8 w-8 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 font-heading text-xl font-bold text-accent">
          {t("signup")}
        </h2>
        <p className="mb-6 text-sm text-muted">{t("signupSuccess")}</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-center font-heading text-2xl font-bold text-accent">
        {t("signup")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm text-muted"
          >
            {t("displayName")}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-4 text-accent outline-none focus:ring-2 focus:ring-brand"
              placeholder={t("displayName")}
            />
          </div>
          {fieldErrors.displayName && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.displayName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-muted">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-4 text-accent outline-none focus:ring-2 focus:ring-brand"
              placeholder={t("email")}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-muted">
            {t("password")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-4 text-accent outline-none focus:ring-2 focus:ring-brand"
              placeholder={t("password")}
            />
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm text-muted"
          >
            {t("confirmPassword")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-4 text-accent outline-none focus:ring-2 focus:ring-brand"
              placeholder={t("confirmPassword")}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors.confirmPassword}
            </p>
          )}
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
            t("signup")
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-accent underline underline-offset-4 transition-colors hover:text-brand"
        >
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
