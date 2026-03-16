"use client";

import { useState } from "react";
import { Chrome, Apple } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { signInWithGoogle, signInWithApple } from "@/lib/firebase/auth";
import { createUser } from "@/lib/firebase/firestore";

export default function SocialLoginButtons() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading("google");
    setError(null);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      await createUser(user.uid, {
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
      });
      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      if (!message.includes("popup-closed-by-user")) {
        setError(message);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleAppleSignIn() {
    setLoading("apple");
    setError(null);
    try {
      const result = await signInWithApple();
      const user = result.user;
      await createUser(user.uid, {
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
      });
      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      if (!message.includes("popup-closed-by-user")) {
        setError(message);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface px-4 text-muted">
            {t("orContinueWith")}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-6 py-3 text-accent transition-colors hover:bg-border disabled:opacity-50"
      >
        {loading === "google" ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : (
          <Chrome className="h-5 w-5" />
        )}
        <span>Google</span>
      </button>

      <button
        type="button"
        onClick={handleAppleSignIn}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-6 py-3 text-accent transition-colors hover:bg-border disabled:opacity-50"
      >
        {loading === "apple" ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : (
          <Apple className="h-5 w-5" />
        )}
        <span>Apple</span>
      </button>
    </div>
  );
}
