"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { getBannerPromotions } from "@/lib/firebase/firestore";
import type { Promotion } from "@/types";
import type { Locale } from "@/types";

export function PromoBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const locale = useLocale() as Locale;

  useEffect(() => {
    async function fetchBanners() {
      try {
        const banners = await getBannerPromotions();
        setPromotions(banners);
      } catch {
        // silently fail — banner is non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchBanners();
  }, []);

  if (loading || dismissed || promotions.length === 0) {
    return null;
  }

  const banner = promotions[0];
  const bannerText = banner.banner?.[locale] ?? banner.banner?.en ?? "";

  if (!bannerText) return null;

  const separator = " ✦ ";

  return (
    <div className="relative overflow-hidden bg-highlight text-black">
      <div className="flex items-center py-2">
        {/* Marquee scrolling text */}
        <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-4 text-xs font-semibold uppercase tracking-[0.2em]">
              {bannerText}{separator}
            </span>
          ))}
        </div>
        <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-4 text-xs font-semibold uppercase tracking-[0.2em]">
              {bannerText}{separator}
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/20 p-1 transition-all hover:bg-background/40"
        aria-label="Dismiss banner"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
