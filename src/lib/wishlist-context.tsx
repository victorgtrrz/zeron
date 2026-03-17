"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import { getWishlist, toggleWishlistItem } from "@/lib/firebase/firestore";

export interface WishlistState {
  wishlistIds: Set<string>;
  loading: boolean;
  toggle: (productId: string) => void;
  isWished: (productId: string) => boolean;
}

export const WishlistContext = createContext<WishlistState>({
  wishlistIds: new Set(),
  loading: true,
  toggle: () => {},
  isWished: () => false,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load wishlist on mount / user change
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const doc = await getWishlist(user!.uid);
        if (!cancelled) {
          setWishlistIds(new Set(doc?.productIds ?? []));
        }
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [user]);

  const toggle = useCallback(
    (productId: string) => {
      if (!user) return;

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      // Persist to Firestore — rollback on failure
      toggleWishlistItem(user.uid, productId).catch(() => {
        setWishlistIds((prev) => {
          const rollback = new Set(prev);
          if (rollback.has(productId)) {
            rollback.delete(productId);
          } else {
            rollback.add(productId);
          }
          return rollback;
        });
      });
    },
    [user]
  );

  const isWished = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  return (
    <WishlistContext.Provider value={{ wishlistIds, loading, toggle, isWished }}>
      {children}
    </WishlistContext.Provider>
  );
}
