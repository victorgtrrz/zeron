"use client";

import { useTranslations } from "next-intl";
import { StarRating } from "./star-rating";

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
}: ReviewSummaryProps) {
  const t = useTranslations("reviews");

  if (totalReviews === 0) {
    return (
      <p className="text-sm text-muted">{t("noReviews")}</p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating
        rating={averageRating}
        size="sm"
        ariaLabel={t("starsLabel", { rating: averageRating })}
      />
      <span className="text-sm font-medium text-accent">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-sm text-muted">
        ({t("reviewCount", { count: totalReviews })})
      </span>
    </div>
  );
}
