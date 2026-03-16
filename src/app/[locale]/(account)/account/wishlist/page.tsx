"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Heart, Loader2, ShoppingBag, Trash2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getWishlist,
  getProduct,
  toggleWishlistItem,
} from "@/lib/firebase/firestore";
import type { Product } from "@/types";
import { useLocale } from "next-intl";
import type { Locale } from "@/types";

export default function WishlistPage() {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const { user, loading: authLoading } = useAuth();
  const locale = useLocale() as Locale;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const wishlist = await getWishlist(user.uid);
      if (!wishlist || wishlist.productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productPromises = wishlist.productIds.map((id) => getProduct(id));
      const results = await Promise.all(productPromises);
      const validProducts = results.filter((p): p is Product => p !== null);
      setProducts(validProducts);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchWishlist();
  }, [authLoading, fetchWishlist]);

  async function handleRemove(productId: string) {
    if (!user) return;
    setRemovingId(productId);
    try {
      await toggleWishlistItem(user.uid, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      // silently fail
    } finally {
      setRemovingId(null);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 flex items-center gap-2 font-heading text-2xl font-bold">
        <Heart className="h-6 w-6" />
        {t("wishlist")}
      </h2>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted" />
          <p className="mb-4 text-muted">{t("emptyWishlist")}</p>
          <Link
            href="/shop"
            className="rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90"
          >
            {tCommon("shopNow")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const name = product.name[locale] || product.name.en || "";
            const price = `$${(product.basePrice / 100).toFixed(2)}`;
            const image = product.images[0] || "";

            return (
              <div
                key={product.id}
                className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand"
              >
                {/* Product image */}
                <Link href={`/shop/${product.slug}`}>
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-background">
                    {image && (
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>
                </Link>

                {/* Product info */}
                <Link href={`/shop/${product.slug}`}>
                  <h3 className="mb-1 font-medium text-accent transition-colors group-hover:text-brand">
                    {name}
                  </h3>
                </Link>
                <p className="mb-3 font-bold text-accent">{price}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={removingId === product.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface py-2 px-4 text-sm text-accent transition-colors hover:bg-border disabled:opacity-50"
                  >
                    {removingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        {t("removeFromWishlist")}
                      </>
                    )}
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90">
                    <ShoppingCart className="h-4 w-4" />
                    {tCommon("addToCart")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
