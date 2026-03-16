"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Package, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserOrders } from "@/lib/firebase/firestore";
import { OrderCard } from "@/components/account/order-card";
import type { Order } from "@/types";

export default function OrdersPage() {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchOrders() {
      try {
        const data = await getUserOrders(user!.uid);
        setOrders(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 font-heading text-2xl font-bold">
        <Package className="mr-2 inline-block h-6 w-6" />
        {t("orders")}
      </h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-muted" />
          <p className="mb-4 text-muted">{t("noOrders")}</p>
          <Link
            href="/shop"
            className="rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90"
          >
            {tCommon("shopNow")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
