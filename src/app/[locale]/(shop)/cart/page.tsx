"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CartItemRow } from "@/components/cart/cart-item";

interface PromoResult {
  valid: boolean;
  discount?: number;
  promotion?: { id: string; code: string; type: string; value: number };
  error?: string;
}

interface AutoPromoResult {
  discount: number;
  promotion?: { id: string; type: string; value: number };
}

export default function CartPage() {
  const t = useTranslations("cart");
  const { items, subtotal, clearCart } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const [autoDiscount, setAutoDiscount] = useState(0);
  const [autoPromo, setAutoPromo] = useState<AutoPromoResult | null>(null);

  const [shipping, setShipping] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch shipping settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setShipping(data.flatRateShipping ?? 999);
        }
      } catch {
        setShipping(999);
      }
      setSettingsLoaded(true);
    }
    fetchSettings();
  }, []);

  // Fetch auto promotions when items/subtotal change
  const fetchAutoPromo = useCallback(async () => {
    if (items.length === 0) {
      setAutoDiscount(0);
      setAutoPromo(null);
      return;
    }
    try {
      const res = await fetch("/api/promotions/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, subtotal }),
      });
      if (res.ok) {
        const data: AutoPromoResult = await res.json();
        setAutoDiscount(data.discount ?? 0);
        setAutoPromo(data);
      }
    } catch {
      setAutoDiscount(0);
      setAutoPromo(null);
    }
  }, [items, subtotal]);

  useEffect(() => {
    fetchAutoPromo();
  }, [fetchAutoPromo]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), items, subtotal }),
      });
      const data: PromoResult = await res.json();
      setPromoResult(data);
    } catch {
      setPromoResult({ valid: false, error: "Network error" });
    }
    setPromoLoading(false);
  };

  const manualDiscount = promoResult?.valid ? (promoResult.discount ?? 0) : 0;

  // If any promo is free_shipping type, shipping becomes 0
  const isFreeShipping =
    (promoResult?.valid && promoResult.promotion?.type === "free_shipping") ||
    (autoPromo?.promotion?.type === "free_shipping");

  const effectiveShipping = isFreeShipping ? 0 : shipping;

  const total = Math.max(0, subtotal - manualDiscount - autoDiscount + effectiveShipping);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-20 w-20 text-muted mb-6" />
        <h1 className="text-2xl font-bold text-accent mb-4">{t("empty")}</h1>
        <Link
          href="/shop"
          className="inline-block bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-accent">{t("title")}</h1>
        <button
          onClick={clearCart}
          className="flex items-center gap-2 text-sm text-muted hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-xl p-6">
            {items.map((item) => (
              <CartItemRow
                key={`${item.productId}-${item.size}`}
                item={item}
              />
            ))}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6 sticky top-24">
            {/* Promo code */}
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                {t("promoCode")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMO2024"
                  className="flex-1 bg-surface border border-border text-accent rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none text-sm"
                />
                <button
                  onClick={applyPromoCode}
                  disabled={promoLoading || !promoCode.trim()}
                  className="bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                >
                  {t("apply")}
                </button>
              </div>
              {promoResult && (
                <p
                  className={`mt-2 text-xs ${
                    promoResult.valid ? "text-success" : "text-destructive"
                  }`}
                >
                  {promoResult.valid ? t("codeApplied") : (promoResult.error ?? t("invalidCode"))}
                </p>
              )}
            </div>

            {/* Auto discount banner */}
            {autoDiscount > 0 && (
              <div className="rounded-lg bg-success/10 border border-success/30 px-4 py-3">
                <p className="text-xs text-success font-medium">
                  {t("autoDiscount")} &mdash; -${(autoDiscount / 100).toFixed(2)}
                </p>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t("subtotal")}</span>
                <span className="text-accent">${(subtotal / 100).toFixed(2)}</span>
              </div>

              {manualDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{t("discount")}</span>
                  <span className="text-success">
                    -${(manualDiscount / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {autoDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{t("autoDiscount")}</span>
                  <span className="text-success">
                    -${(autoDiscount / 100).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted">{t("shipping")}</span>
                <span className="text-accent">
                  {isFreeShipping
                    ? t("freeShipping")
                    : settingsLoaded
                      ? `$${(shipping / 100).toFixed(2)}`
                      : "..."}
                </span>
              </div>

              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-base font-bold text-accent">
                  {t("total")}
                </span>
                <span className="text-base font-bold text-accent">
                  ${(total / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              {t("checkout")}
            </Link>

            <Link
              href="/shop"
              className="block w-full text-center text-sm text-muted hover:text-accent transition-colors"
            >
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
