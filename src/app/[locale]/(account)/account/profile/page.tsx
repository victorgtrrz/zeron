"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { User as UserIcon, MapPin, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { signOutUser } from "@/lib/firebase/auth";
import { ProfileForm } from "@/components/account/profile-form";
import { AddressManager } from "@/components/account/address-manager";

export default function ProfilePage() {
  const t = useTranslations("account");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutUser();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-10">
      {/* Profile section */}
      <section>
        <h2 className="mb-6 flex items-center gap-2 font-heading text-2xl font-bold">
          <UserIcon className="h-6 w-6" />
          {t("profile")}
        </h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <ProfileForm />
        </div>
      </section>

      {/* Addresses section */}
      <section>
        <h2 className="mb-6 flex items-center gap-2 font-heading text-2xl font-bold">
          <MapPin className="h-6 w-6" />
          {t("addresses")}
        </h2>
        <AddressManager />
      </section>

      {/* Sign out */}
      <section>
        <div className="border-t border-border pt-8">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {tNav("logout")}
          </button>
        </div>
      </section>
    </div>
  );
}
