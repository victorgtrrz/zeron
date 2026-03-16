"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { CartItem, Product } from "@/types";

export interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, size: string, qty: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

function getVisitorId(): string {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("visitorId="));
  if (match) return match.split("=")[1];

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  document.cookie = `visitorId=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  return id;
}

async function persistCart(
  visitorId: string,
  items: CartItem[],
  userId: string | null
) {
  try {
    const db = getClientDb();
    await setDoc(doc(db, "carts", visitorId), {
      items,
      userId: userId ?? null,
      updatedAt: Timestamp.now(),
    });
  } catch {
    // Silently fail — cart is also in local state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Set visitor ID on mount
  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  // Subscribe to Firestore cart doc for real-time sync
  useEffect(() => {
    if (!visitorId) return;

    let cancelled = false;
    const db = getClientDb();
    const unsub = onSnapshot(
      doc(db, "carts", visitorId),
      (snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data();
          setItems(data.items ?? []);
        }
        setInitialLoadDone(true);
      },
      () => {
        // On error, mark initial load done so UI doesn't hang
        if (!cancelled) setInitialLoadDone(true);
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [visitorId]);

  // When auth changes, link cart to userId
  useEffect(() => {
    if (!visitorId || !initialLoadDone) return;
    const userId = user?.uid ?? null;
    persistCart(visitorId, items, userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, visitorId, initialLoadDone]);

  const addItem = useCallback(
    (product: Product, size: string, qty: number) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === product.id && i.size === size
        );
        let next: CartItem[];
        if (existing) {
          next = prev.map((i) =>
            i.productId === product.id && i.size === size
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        } else {
          const newItem: CartItem = {
            productId: product.id,
            name: product.name.en,
            size,
            quantity: qty,
            unitPrice: product.basePrice,
            image: product.images[0] ?? "",
          };
          next = [...prev, newItem];
        }
        persistCart(visitorId, next, user?.uid ?? null);
        return next;
      });
    },
    [visitorId, user?.uid]
  );

  const removeItem = useCallback(
    (productId: string, size: string) => {
      setItems((prev) => {
        const next = prev.filter(
          (i) => !(i.productId === productId && i.size === size)
        );
        persistCart(visitorId, next, user?.uid ?? null);
        return next;
      });
    },
    [visitorId, user?.uid]
  );

  const updateQuantity = useCallback(
    (productId: string, size: string, qty: number) => {
      if (qty < 1) return;
      setItems((prev) => {
        const next = prev.map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, quantity: qty }
            : i
        );
        persistCart(visitorId, next, user?.uid ?? null);
        return next;
      });
    },
    [visitorId, user?.uid]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    persistCart(visitorId, [], user?.uid ?? null);
  }, [visitorId, user?.uid]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
