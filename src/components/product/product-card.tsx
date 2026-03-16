"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Product, Locale } from "@/types";

interface ProductCardProps {
  product: Product;
  locale: Locale;
  categorySlug?: string;
}

export function ProductCard({ product, locale, categorySlug }: ProductCardProps) {
  const [isWished, setIsWished] = useState(false);
  const name = product.name[locale] || product.name.en || "";
  const price = `$${(product.basePrice / 100).toFixed(2)}`;
  const firstImage = product.images[0] ?? "";
  const secondImage = product.images[1] ?? "";

  const href = categorySlug
    ? `/shop/${categorySlug}/${product.slug}`
    : `/shop/${product.slug}`;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-surface transition-shadow duration-300 hover:shadow-lg">
      {/* Wishlist heart */}
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsWished((prev) => !prev);
        }}
        className="absolute right-3 top-3 z-10 rounded-full bg-background/60 p-2 backdrop-blur-sm transition-colors hover:bg-background/80"
        aria-label="Toggle wishlist"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isWished ? "fill-red-500 text-red-500" : "text-accent"
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

        {/* Info */}
        <div className="p-4">
          <h3 className="truncate text-sm font-medium text-accent transition-colors group-hover:text-brand">
            {name}
          </h3>
          <p className="mt-1 text-sm font-bold text-accent">{price}</p>
        </div>
      </Link>
    </div>
  );
}
