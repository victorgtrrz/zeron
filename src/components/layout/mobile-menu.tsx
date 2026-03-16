"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryLinks = [
  { slug: "tshirts", key: "tshirts" as const },
  { slug: "pants", key: "pants" as const },
  { slug: "hoodies", key: "hoodies" as const },
  { slug: "accessories", key: "accessories" as const },
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const t = useTranslations("nav");
  const { user } = useAuth();
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setAnimating(false);
    } else if (visible) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-overlay ${
          animating ? "animate-fade-in" : "animate-fade-in"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <nav
        className={`absolute inset-y-0 left-0 w-72 bg-surface shadow-2xl ${
          animating ? "animate-slide-out-left" : "animate-slide-in-left"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-heading text-lg font-bold tracking-tight text-accent">
            ZERON
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-accent transition-colors hover:bg-background"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-4">
          {/* Categories */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
            {t("categories")}
          </p>
          {categoryLinks.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              onClick={onClose}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
            >
              {t(cat.key)}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-3 border-t border-border" />

          {/* Account links */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
            {t("account")}
          </p>
          {user ? (
            <>
              <Link
                href="/account/orders"
                onClick={onClose}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
              >
                {t("account")}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
            >
              {t("login")}
            </Link>
          )}

          <Link
            href="/contact"
            onClick={onClose}
            className="rounded-md px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
          >
            {t("contact")}
          </Link>

          {/* Divider */}
          <div className="my-3 border-t border-border" />

          {/* Settings row */}
          <div className="flex items-center gap-2 px-3">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </div>
  );
}
