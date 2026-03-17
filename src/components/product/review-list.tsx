"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ReviewCard } from "./review-card";

interface ReviewItem {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewListProps {
  productId: string;
  initialReviews: ReviewItem[];
  initialTotal: number;
}

export function ReviewList({
  productId,
  initialReviews,
  initialTotal,
}: ReviewListProps) {
  const t = useTranslations("reviews");
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const hasMore = reviews.length < initialTotal;

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/reviews?productId=${productId}&page=${nextPage}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) => [...prev, ...data.reviews]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  if (reviews.length === 0) return null;

  return (
    <div>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          displayName={review.displayName}
          rating={review.rating}
          comment={review.comment}
          verifiedPurchase={review.verifiedPurchase}
          createdAt={review.createdAt}
        />
      ))}

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-border px-6 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-accent disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("loadMore")}
              </span>
            ) : (
              t("loadMore")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
