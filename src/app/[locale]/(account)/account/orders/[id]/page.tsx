"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getOrder } from "@/lib/firebase/firestore";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import type { Order } from "@/types";

export default function OrderDetailPage() {
  const t = useTranslations("account");
  const tCart = useTranslations("cart");
  const tCheckout = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const data = await getOrder(orderId);
        if (!data) {
          setError("Order not found");
          return;
        }
        if (data.userId !== user!.uid) {
          setError("Order not found");
          return;
        }
        setOrder(data);
      } catch {
        setError(tCommon("error"));
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [user, authLoading, orderId, tCommon]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-destructive mb-4">{error || tCommon("error")}</p>
        <Link
          href="/account/orders"
          className="text-sm text-muted transition-colors hover:text-accent"
        >
          &larr; {tCommon("back")}
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const addr = order.shippingAddress;

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </Link>

      {/* Order header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">
            {t("viewOrder")} #{order.id.slice(0, 8)}
          </h2>
          <p className="mt-1 text-sm text-muted">{formattedDate}</p>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.paymentStatus} type="payment" />
          <OrderStatusBadge status={order.fulfillmentStatus} type="fulfillment" />
        </div>
      </div>

      {/* Order items */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 font-heading text-lg font-bold">{t("orderItems")}</h3>
        <div className="divide-y divide-border">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <p className="font-medium text-accent">{item.name}</p>
                <p className="text-sm text-muted">
                  {item.size} &middot; Qty: {item.quantity}
                </p>
              </div>
              <div className="flex items-center">
                <p className="font-bold text-accent">
                  ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping address */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
            <MapPin className="h-5 w-5" />
            {tCheckout("shippingAddress")}
          </h3>
          <div className="space-y-1 text-sm text-muted">
            <p className="font-medium text-accent">{addr.recipientName}</p>
            <p>{addr.street}</p>
            <p>
              {addr.city}, {addr.state} {addr.zip}
            </p>
            <p>{addr.country}</p>
            {addr.phone && <p>{addr.phone}</p>}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-heading text-lg font-bold">
            {tCheckout("orderSummary")}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{tCart("subtotal")}</span>
              <span className="text-accent">
                ${(order.subtotal / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{tCart("shipping")}</span>
              <span className="text-accent">
                {order.shipping === 0
                  ? tCart("freeShipping")
                  : `$${(order.shipping / 100).toFixed(2)}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">{tCart("discount")}</span>
                <span className="text-success">
                  -${(order.discount / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-accent">{tCart("total")}</span>
                <span className="font-bold text-accent">
                  ${(order.total / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
