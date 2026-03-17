"use client";

import { useTranslations } from "next-intl";
import { ReviewList } from "./review-list";
import { ReviewForm } from "./review-form";

interface ReviewItem {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewSectionProps {
  productId: string;
  reviews: ReviewItem[];
  totalReviews: number;
  eligibility: "eligible" | "login_required" | "purchase_required" | "already_reviewed";
}

export function ReviewSection({
  productId,
  reviews,
  totalReviews,
  eligibility,
}: ReviewSectionProps) {
  const t = useTranslations("reviews");

  return (
    <div id="reviews" className="mt-16">
      <h2 className="mb-6 font-heading text-2xl tracking-wider text-accent md:text-3xl">
        {t("title")}
      </h2>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {totalReviews === 0 ? (
            <p className="py-8 text-sm text-muted">{t("noReviews")}</p>
          ) : (
            <ReviewList
              productId={productId}
              initialReviews={reviews}
              initialTotal={totalReviews}
            />
          )}
        </div>

        <div>
          <ReviewForm productId={productId} eligibility={eligibility} />
        </div>
      </div>
    </div>
  );
}
