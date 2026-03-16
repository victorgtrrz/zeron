"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, ShoppingBag } from "lucide-react";

function SuccessContent() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <Check className="h-10 w-10 text-success" />
      </div>

      <h1 className="text-3xl font-bold text-accent mb-4">{t("success")}</h1>

      <p className="text-muted mb-2">{t("successMessage")}</p>

      {sessionId && (
        <p className="text-xs text-muted/60 mb-8">
          Session: {sessionId}
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
        >
          <ShoppingBag className="h-4 w-4" />
          {t("viewOrders")}
        </Link>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 border border-border text-accent font-bold py-3 px-6 rounded-lg hover:bg-surface transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="animate-pulse text-muted">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
