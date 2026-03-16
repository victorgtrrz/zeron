"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { SizeSelector } from "@/components/product/size-selector";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWished, setIsWished] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <SizeSelector
        sizes={product.sizes}
        stock={product.stock}
        selected={selectedSize}
        onSelect={setSelectedSize}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <AddToCartButton product={product} selectedSize={selectedSize} />
        </div>
        <button
          onClick={() => setIsWished((prev) => !prev)}
          className={`flex h-14 w-14 items-center justify-center rounded-lg border transition-colors ${
            isWished
              ? "border-red-500 bg-red-500/10 text-red-500"
              : "border-border text-muted hover:text-accent hover:border-accent"
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-5 w-5 ${isWished ? "fill-red-500" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
