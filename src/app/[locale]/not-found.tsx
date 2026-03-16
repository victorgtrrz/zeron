"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";
import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen bg-background text-accent">
      <div className="sticky top-0 z-50">
        <Header />
      </div>

      <main className="pb-16 md:pb-0">
        <section className="grain-overlay relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
          {/* Giant decorative 404 background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <span className="select-none font-heading text-[20rem] leading-none tracking-widest text-accent/[0.03] sm:text-[28rem] lg:text-[38rem]">
              {t("code")}
            </span>
          </div>

          {/* Decorative geometric elements */}
          <div className="absolute left-[15%] top-1/3 hidden h-40 w-px bg-gradient-to-b from-transparent via-highlight/20 to-transparent lg:block" />
          <div className="absolute right-[15%] bottom-1/3 hidden h-40 w-px bg-gradient-to-b from-transparent via-highlight/20 to-transparent lg:block" />

          {/* Corner brackets */}
          <div className="absolute left-8 top-8 hidden md:block">
            <div className="h-12 w-px bg-border" />
            <div className="mt-[-1px] h-px w-12 bg-border" />
          </div>
          <div className="absolute bottom-8 right-8 hidden md:block">
            <div className="ml-auto h-12 w-px bg-border" />
            <div className="mt-[-1px] h-px w-12 bg-border" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-6 bg-highlight" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-highlight">
                &#47;&#47; Error {t("code")}
              </span>
              <div className="h-px w-6 bg-highlight" />
            </div>

            <h1 className="mb-2 font-heading text-8xl tracking-wider text-accent sm:text-9xl">
              {t("code")}
            </h1>

            <h2 className="mb-4 font-heading text-2xl tracking-wider text-accent sm:text-3xl">
              {t("title")}
            </h2>

            <div className="mb-6 h-px w-16 bg-highlight/50" />

            <p className="mb-10 max-w-sm text-sm leading-relaxed text-muted">
              {t("description")}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="group flex items-center justify-center gap-2 border border-border bg-surface px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition-all duration-300 hover:border-accent"
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                {t("backHome")}
              </Link>
              <Link
                href="/shop"
                className="glow-button flex items-center justify-center gap-2 border border-highlight bg-highlight/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition-all duration-300 hover:bg-highlight/20"
              >
                <ShoppingBag className="h-4 w-4" />
                {t("backShop")}
              </Link>
            </div>
          </div>

          {/* Floating decorative dots */}
          <div className="absolute left-[20%] top-[20%] h-1 w-1 rounded-full bg-highlight/30 animate-float" />
          <div className="absolute right-[25%] top-[30%] h-1.5 w-1.5 rounded-full bg-highlight/20 animate-float stagger-2" />
          <div className="absolute left-[30%] bottom-[25%] h-1 w-1 rounded-full bg-highlight/25 animate-float stagger-4" />
          <div className="absolute right-[20%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-highlight/15 animate-float stagger-3" />
        </section>
      </main>

      <Footer />
      <MobileBottomBar />
      <ChatWidget />
    </div>
  );
}
