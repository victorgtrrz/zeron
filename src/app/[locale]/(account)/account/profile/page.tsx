"use client";

import { useTranslations } from "next-intl";
import { User as UserIcon, MapPin } from "lucide-react";
import { ProfileForm } from "@/components/account/profile-form";
import { AddressManager } from "@/components/account/address-manager";

export default function ProfilePage() {
  const t = useTranslations("account");

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
    </div>
  );
}
