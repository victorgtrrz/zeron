"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Minus, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { getProduct } from "@/lib/firebase/firestore";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItemRow({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [maxStock, setMaxStock] = useState<number>(Infinity);

  useEffect(() => {
    getProduct(item.productId).then((product) => {
      if (product) {
        setMaxStock(product.stock[item.size] ?? 0);
      }
    });
  }, [item.productId, item.size]);

  const lineTotal = item.unitPrice * item.quantity;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted text-xs">
            No img
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">{item.name}</p>
            <p className="text-xs text-muted">Size: {item.size}</p>
            <p className="text-xs text-muted">
              ${(item.unitPrice / 100).toFixed(2)}
            </p>
          </div>

          <button
            onClick={() => removeItem(item.productId, item.size)}
            className="rounded-md p-1 text-muted transition-colors hover:text-destructive"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateQuantity(item.productId, item.size, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-accent transition-colors hover:bg-background disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium text-accent">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(item.productId, item.size, item.quantity + 1)
              }
              disabled={item.quantity >= maxStock}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-accent transition-colors hover:bg-background disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <p className="text-sm font-bold text-accent">
            ${(lineTotal / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
