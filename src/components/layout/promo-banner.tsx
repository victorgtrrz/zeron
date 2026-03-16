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

  return (
    <div className="animate-slide-down relative z-50 bg-accent text-background">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2">
        <p className="text-center text-sm font-medium">{bannerText}</p>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 rounded-md p-1 transition-opacity hover:opacity-70"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
