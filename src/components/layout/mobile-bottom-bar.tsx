"use client";

import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const navItems = [
  { href: "/", icon: Home, labelKey: "home" as const },
  { href: "/shop", icon: ShoppingBag, labelKey: "shop" as const },
  { href: "/cart", icon: ShoppingCart, labelKey: "cart" as const },
  { href: "/account/orders", icon: User, labelKey: "account" as const },
];

export function MobileBottomBar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-border bg-surface md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200 ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
