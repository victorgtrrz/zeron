"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { PasswordForm } from "@/components/account/password-form";

export default function PasswordPage() {
  const t = useTranslations("account");

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 flex items-center gap-2 font-heading text-2xl font-bold">
        <Lock className="h-6 w-6" />
        {t("password")}
      </h2>
      <div className="max-w-md rounded-xl border border-border bg-surface p-6">
        <PasswordForm />
      </div>
    </div>
  );
}
