"use client";

import { Package, User as UserIcon, Heart, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const navItems = [
  { href: "/account/orders", icon: Package, labelKey: "orders" as const },
  { href: "/account/profile", icon: UserIcon, labelKey: "profile" as const },
  { href: "/account/wishlist", icon: Heart, labelKey: "wishlist" as const },
  { href: "/account/password", icon: Lock, labelKey: "password" as const },
];

export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden md:flex md:flex-col md:gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-background"
                  : "text-muted hover:bg-surface hover:text-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Mobile: horizontal scrollable tabs */}
      <nav className="flex gap-2 overflow-x-auto pb-2 md:hidden scrollbar-none">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-background"
                  : "bg-surface border border-border text-muted hover:text-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
