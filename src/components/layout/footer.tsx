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
    <footer className="relative overflow-hidden border-t border-border bg-surface">
      {/* Gradient top border accent */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-highlight/50 to-transparent" />

      {/* Large decorative background text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="select-none font-heading text-[12rem] leading-none tracking-widest text-accent/[0.02] sm:text-[16rem] lg:text-[20rem]">
          ZERON
        </span>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand info */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-3xl tracking-widest text-accent">
              ZERON
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Streetwear without limits. Exclusive urban clothing for those who
              dare to stand out.
            </p>
            {/* Decorative line */}
            <div className="mt-6 h-px w-12 bg-highlight/50" />
          </div>

          {/* Category links */}
          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-highlight">
              {tNav("categories")}
            </h4>
            <ul className="flex flex-col gap-3">
              {categoryLinks.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className="footer-link text-sm text-muted transition-colors duration-200 hover:text-accent"
                  >
                    {tNav(cat.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-highlight">
              {tNav("contact")}
            </h4>
            <Link
              href="/contact"
              className="footer-link text-sm text-muted transition-colors duration-200 hover:text-accent"
            >
              {tNav("contact")}
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <div className="flex flex-col items-center gap-1 text-xs text-muted sm:items-start">
            <p>&copy; 2026 ZERON. {tFooter("rights")}.</p>
            <p>
              {tFooter("madeBy")}{" "}
              <a
                href="https://network-88.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-highlight transition-opacity duration-200 hover:opacity-70"
              >
                network-88.com
              </a>
            </p>
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
