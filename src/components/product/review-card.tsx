"use client";

import { useTranslations, useLocale } from "next-intl";
import { StarRating } from "./star-rating";
import { getPartialName } from "@/lib/review-utils";
import { BadgeCheck } from "lucide-react";

interface ReviewCardProps {
  displayName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return rtf.format(-diffMinutes, "minute");
    }
    return rtf.format(-diffHours, "hour");
  }
  if (diffDays < 30) return rtf.format(-diffDays, "day");
  if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), "month");
  return rtf.format(-Math.floor(diffDays / 365), "year");
}

export function ReviewCard({
  displayName,
  rating,
  comment,
  verifiedPurchase,
  createdAt,
}: ReviewCardProps) {
  const t = useTranslations("reviews");
  const locale = useLocale();

  return (
    <div className="border-b border-border py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <StarRating
            rating={rating}
            size="sm"
            ariaLabel={t("starsLabel", { rating })}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-accent">
              {getPartialName(displayName)}
            </span>
            {verifiedPurchase && (
              <span className="flex items-center gap-1 text-xs text-success">
                <BadgeCheck className="h-3.5 w-3.5" />
                {t("verifiedPurchase")}
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {timeAgo(createdAt, locale)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{comment}</p>
    </div>
  );
}
