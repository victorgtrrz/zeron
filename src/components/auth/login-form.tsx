"use client";

import { useState, useContext, useEffect } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { signInWithEmail } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/client";
import { AuthContext } from "@/lib/auth-context";
import SocialLoginButtons from "./social-login-buttons";

interface LoginFormProps {
  onSwitchToSignup?: () => void;
  onSwitchToForgot?: () => void;
  onSuccess?: () => void;
}

export default function LoginForm({ onSwitchToSignup, onSwitchToForgot, onSuccess }: LoginFormProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isModal = !!onSuccess;

  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [user, authLoading, searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("email") + " is required");
      return;
    }
    if (!password.trim()) {
      setError(t("password") + " is required");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);

      const currentUser = auth.currentUser;
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        if (tokenResult.claims.admin === true) {
          setIsAdmin(true);
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        const redirectTo = searchParams.get("redirect");
        router.push(redirectTo ?? "/");
      }
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={isModal ? "" : "animate-fade-in"}>
      <h1 className="mb-6 text-center font-heading text-2xl font-bold text-accent">
        {t("login")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm text-muted">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background py-3 pl-11 pr-4 text-accent outline-none focus:ring-2 focus:ring-brand"
              placeholder={t("email")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm text-muted">
            {t("password")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-background py-3 pl-11 pr-4 text-accent outline-none focus:ring-2 focus:ring-brand"
              placeholder={t("password")}
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
            t("login")
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        {onSwitchToForgot ? (
          <button
            type="button"
            onClick={onSwitchToForgot}
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            {t("forgotPassword")}
          </button>
        ) : (
          <Link
            href="/forgot-password"
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            {t("forgotPassword")}
          </Link>
        )}
      </div>

      <SocialLoginButtons onSuccess={onSuccess} />

      <p className="mt-6 text-center text-sm text-muted">
        {t("noAccount")}{" "}
        {onSwitchToSignup ? (
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-medium text-accent underline underline-offset-4 transition-colors hover:text-brand"
          >
            {t("signup")}
          </button>
        ) : (
          <Link
            href="/signup"
            className="font-medium text-accent underline underline-offset-4 transition-colors hover:text-brand"
          >
            {t("signup")}
          </Link>
        )}
      </p>

      {isAdmin && !isModal && (
        <div className="mt-4 text-center">
          <Link
            href="/zr-ops/"
            className="text-xs text-muted transition-colors hover:text-accent"
          >
            zr-ops
          </Link>
        </div>
      )}
    </div>
  );
}
