"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./locale-switcher";

const categoryLinks = [
  { slug: "tshirts", key: "tshirts" as const },
  { slug: "pants", key: "pants" as const },
  { slug: "hoodies", key: "hoodies" as const },
  { slug: "accessories", key: "accessories" as const },
];

export function Footer() {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand info */}
          <div>
            <h3 className="font-heading text-xl font-bold tracking-tight text-accent">
              ZERON
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Streetwear without limits. Exclusive urban clothing for those who
              dare to stand out.
            </p>
          </div>

          {/* Category links */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              {tNav("categories")}
            </h4>
            <ul className="flex flex-col gap-2">
              {categoryLinks.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="text-sm text-accent transition-colors duration-200 hover:text-muted"
                  >
                    {tNav(cat.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              {tNav("contact")}
            </h4>
            <Link
              href="/contact"
              className="text-sm text-accent transition-colors duration-200 hover:text-muted"
            >
              {tNav("contact")}
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; 2026 ZERON. {tFooter("rights")}.
          </p>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
