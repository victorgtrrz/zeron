"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { Menu, User, Shield } from "lucide-react";
import Image from "next/image";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CartIcon } from "./cart-icon";
import { MobileMenu } from "./mobile-menu";

const categoryLinks = [
  { slug: "tshirts", key: "tshirts" as const },
  { slug: "pants", key: "pants" as const },
  { slug: "hoodies", key: "hoodies" as const },
  { slug: "accessories", key: "accessories" as const },
];

export function Header() {
  const t = useTranslations("nav");
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          {/* Left: Hamburger (mobile) + Category links (desktop) */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-md p-2 text-accent transition-colors hover:bg-surface md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav className="hidden items-center gap-5 md:flex">
              {categoryLinks.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/shop/${cat.slug}`}
                  className="text-sm font-medium text-muted transition-colors duration-200 hover:text-accent"
                >
                  {t(cat.key)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link
            href="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Image
              src="/zeron_logo.webp"
              alt="Zeron"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <LocaleSwitcher />
            </div>
            <ThemeToggle />
            <CartIcon />

            {/* User icon */}
            <Link
              href={user ? "/account/orders" : "/login"}
              className="rounded-md p-2 text-accent transition-colors hover:bg-surface"
              aria-label={user ? t("account") : t("login")}
            >
              <User className="h-4 w-4" />
            </Link>

            {/* Admin icon */}
            {isAdmin && (
              <Link
                href="/zr-ops/"
                className="rounded-md p-2 text-accent transition-colors hover:bg-surface"
                aria-label="Admin panel"
              >
                <Shield className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
