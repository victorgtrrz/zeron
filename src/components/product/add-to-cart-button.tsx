"use client";

import { useState } from "react";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types";

interface AddToCartButtonProps {
  product: Product;
  selectedSize: string | null;
}

export function AddToCartButton({ product, selectedSize }: AddToCartButtonProps) {
  const t = useTranslations("common");
  const tProduct = useTranslations("product");
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  const isDisabled =
    !selectedSize || (selectedSize ? (product.stock[selectedSize] ?? 0) === 0 : true);

  const totalStock = Object.values(product.stock).reduce((sum, s) => sum + s, 0);
  const isOutOfStock = totalStock === 0;

  function handleClick() {
    if (!selectedSize || isDisabled) return;
    addItem(product, selectedSize, 1);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  if (isOutOfStock) {
    return (
      <button
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface py-4 text-sm font-bold text-muted border border-border cursor-not-allowed"
      >
        {t("outOfStock")}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled || added}
      className={`flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-bold transition-all ${
        added
          ? "bg-success text-white"
          : isDisabled
          ? "cursor-not-allowed bg-surface text-muted border border-border"
          : "bg-accent text-background hover:opacity-90"
      }`}
    >
      {added ? (
        <>
          <Check className="h-5 w-5" />
          {tProduct("addedToCart")}
        </>
      ) : isDisabled ? (
        <>
          <ShoppingBag className="h-5 w-5" />
          {tProduct("selectSize")}
        </>
      ) : (
        <>
          <ShoppingBag className="h-5 w-5" />
          {t("addToCart")}
        </>
      )}
    </button>
  );
}
