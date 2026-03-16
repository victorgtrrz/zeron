"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export function CartIcon() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className="relative rounded-md p-2 text-accent transition-colors hover:bg-surface"
      aria-label="Shopping cart"
    >
      <ShoppingBag className="h-4 w-4" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background">
          {itemCount}
        </span>
      )}
    </button>
  );
}
