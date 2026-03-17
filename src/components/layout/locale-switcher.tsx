"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Globe, ChevronDown } from "lucide-react";

const locales = [
  { code: "en" as const, label: "EN" },
  { code: "es" as const, label: "ES" },
  { code: "zh-HK" as const, label: "繁中" },
];

export function LocaleSwitcher({ align = "right" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const currentLabel = locales.find((l) => l.code === currentLocale)?.label ?? "EN";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(locale: "en" | "es" | "zh-HK") {
    setOpen(false);
    router.replace(pathname, { locale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-accent transition-colors hover:bg-surface"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span>{currentLabel}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className={`absolute top-full z-50 mt-1 min-w-[100px] animate-scale-in rounded-md border border-border bg-surface py-1 shadow-lg ${align === "left" ? "left-0" : "right-0"}`}>
          {locales.map((locale) => (
            <button
              key={locale.code}
              onClick={() => switchLocale(locale.code)}
              className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-background ${
                currentLocale === locale.code
                  ? "font-semibold text-accent"
                  : "text-muted"
              }`}
            >
              {locale.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
