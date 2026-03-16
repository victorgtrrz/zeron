"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order } from "@/types";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const t = useTranslations("account");

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTotal = `$${(order.total / 100).toFixed(2)}`;
  const truncatedId = order.id.length > 8 ? order.id.slice(0, 8) + "..." : order.id;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link href={`/account/orders/${order.id}`}>
      <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">{formattedDate}</span>
              <span className="font-mono text-xs text-muted">#{truncatedId}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted">
                {t("orderItems")}: {itemCount}
              </span>
              <span className="font-bold text-accent">{formattedTotal}</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <OrderStatusBadge status={order.paymentStatus} type="payment" />
          <OrderStatusBadge status={order.fulfillmentStatus} type="fulfillment" />
        </div>
      </div>
    </Link>
  );
}
