"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StarRating } from "./star-rating";
import { useToast } from "@/components/ui/toast";

interface ReviewFormProps {
  productId: string;
  eligibility: "eligible" | "login_required" | "purchase_required" | "already_reviewed";
}

export function ReviewForm({ productId, eligibility }: ReviewFormProps) {
  const t = useTranslations("reviews");
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const maxLength = 500;
  const remaining = maxLength - comment.length;

  if (submitted || eligibility === "already_reviewed") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t("alreadyReviewed")}</p>
      </div>
    );
  }

  if (eligibility === "login_required") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t("loginRequired")}</p>
      </div>
    );
  }

  if (eligibility === "purchase_required") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t("purchaseRequired")}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      toast(t("ratingRequired"), "warning");
      return;
    }

    if (comment.trim().length < 10) {
      toast(t("commentTooShort"), "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() }),
      });

      if (res.ok) {
        toast(t("submitSuccess"), "success");
        setSubmitted(true);
      } else {
        const data = await res.json();
        toast(data.error || t("submitError"), "error");
      }
    } catch {
      toast(t("submitError"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h3 className="mb-4 font-heading text-lg tracking-wide text-accent">
        {t("writeReview")}
      </h3>

      <div className="mb-4">
        <StarRating
          rating={rating}
          interactive
          onChange={setRating}
          size="lg"
          ariaLabel={t("starsLabel", { rating })}
        />
      </div>

      <div className="mb-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
          placeholder={t("commentPlaceholder")}
          rows={4}
          maxLength={maxLength}
          className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
        <p
          className={`mt-1 text-right text-xs ${
            remaining < 50 ? "text-warning" : "text-muted"
          }`}
        >
          {t("charactersRemaining", { count: remaining })}
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {submitting && (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {submitting ? t("sending") : t("submitReview")}
      </button>
    </form>
  );
}
