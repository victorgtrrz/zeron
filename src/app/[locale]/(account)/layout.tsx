import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "account" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="min-h-screen bg-background text-accent">
      <Header />
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          <a
            href="/shop"
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            &larr; {tCommon("shopNow")}
          </a>
        </div>

        {/* Mobile nav */}
        <div className="mb-6 md:hidden">
          <AccountNav />
        </div>

        {/* Desktop: sidebar + content */}
        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 md:block">
            <AccountNav />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
