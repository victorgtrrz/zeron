"use client";

import { useEffect } from "react";
import { X, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/hooks/use-cart";
import { CartItemRow } from "@/components/cart/cart-item";

export function CartDrawer() {
  const t = useTranslations("cart");
  const { items, isCartOpen, closeCart, subtotal } = useCart();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md animate-slide-in-right">
        <div className="flex h-full flex-col bg-background border-l border-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold text-accent">{t("title")}</h2>
            <button
              onClick={closeCart}
              className="rounded-md p-2 text-muted transition-colors hover:text-accent"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              <ShoppingBag className="h-16 w-16 text-muted" />
              <p className="text-muted">{t("empty")}</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                {t("continueShopping")}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6">
                {items.map((item) => (
                  <CartItemRow
                    key={`${item.productId}-${item.size}`}
                    item={item}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">{t("subtotal")}</span>
                  <span className="text-lg font-bold text-accent">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="block w-full text-center border border-border text-accent font-bold py-3 px-6 rounded-lg hover:bg-surface transition-colors"
                  >
                    {t("title")}
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="block w-full text-center bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {t("checkout")}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
