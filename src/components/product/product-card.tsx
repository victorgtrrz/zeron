"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useTranslations } from "next-intl";
import type { Product, Locale } from "@/types";

interface ProductCardProps {
  product: Product;
  locale: Locale;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const [showSizes, setShowSizes] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCart();
  const { isWished, toggle: toggleWishlist } = useWishlist();
  const t = useTranslations("common");
  const tProduct = useTranslations("product");

  const name = product.name[locale] || product.name.en || "";
  const price = `$${(product.basePrice / 100).toFixed(2)}`;
  const firstImage = product.images[0] ?? "";
  const secondImage = product.images[1] ?? "";
  const href = `/shop/${product.slug}`;

  const availableSizes = product.sizes.filter(
    (s) => (product.stock[s] ?? 0) > 0
  );

  function handleAddToCart(size: string) {
    addItem(product, size, 1);
    setShowSizes(false);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-surface transition-shadow duration-300 hover:shadow-lg">
      {/* Wishlist heart */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        className="absolute right-3 top-3 z-10 rounded-full bg-background/60 p-2 backdrop-blur-sm transition-colors hover:bg-background/80"
        aria-label="Toggle wishlist"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isWished(product.id) ? "fill-red-500 text-red-500" : "text-accent"
          }`}
        />
      </button>

      <Link href={href}>
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden">
          {firstImage && (
            <Image
              src={firstImage}
              alt={name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                secondImage ? "group-hover:opacity-0" : ""
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          {secondImage && (
            <Image
              src={secondImage}
              alt={name}
              fill
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
        </div>
      </Link>

      {/* Info + Add to cart */}
      <div className="p-3 sm:p-4">
        <Link href={href}>
          <h3 className="truncate text-xs font-medium text-accent transition-colors group-hover:text-brand sm:text-sm">
            {name}
          </h3>
          <p className="mt-1 text-xs font-bold text-accent sm:text-sm">{price}</p>
        </Link>

        {/* Add to cart button */}
        {availableSizes.length > 0 && (
          <div className="relative mt-3">
            <button
              onClick={() => setShowSizes((prev) => !prev)}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 sm:gap-2 sm:py-2 sm:text-xs ${
                added
                  ? "border-success bg-success/10 text-success"
                  : "border-border text-muted hover:border-highlight hover:text-highlight"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {tProduct("addedToCart")}
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {t("addToCart")}
                </>
              )}
            </button>

            {/* Size picker overlay */}
            {showSizes && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSizes(false)}
                />
                <div className="absolute bottom-full left-0 right-0 z-20 mb-1 animate-scale-in rounded-lg border border-border bg-surface p-3 shadow-xl">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {tProduct("selectSize")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes.map((size) => {
                      const inStock = (product.stock[size] ?? 0) > 0;
                      return (
                        <button
                          key={size}
                          disabled={!inStock}
                          onClick={() => handleAddToCart(size)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                            inStock
                              ? "border-border text-accent hover:border-highlight hover:text-highlight"
                              : "border-border/50 text-muted/40 line-through"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
