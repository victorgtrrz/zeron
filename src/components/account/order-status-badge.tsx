"use client";

import { useTranslations } from "next-intl";

interface OrderStatusBadgeProps {
  status: string;
  type: "payment" | "fulfillment";
}

const colorMap: Record<string, string> = {
  paid: "bg-success/10 text-success",
  delivered: "bg-success/10 text-success",
  processing: "bg-warning/10 text-warning",
  shipped: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-destructive/10 text-destructive",
  pending: "bg-muted/10 text-muted",
};

export function OrderStatusBadge({ status, type }: OrderStatusBadgeProps) {
  const t = useTranslations("orderStatus");

  const colors = colorMap[status] ?? "bg-muted/10 text-muted";

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${colors}`}
    >
      {t(status as "pending" | "paid" | "refunded" | "processing" | "shipped" | "delivered" | "cancelled")}
    </span>
  );
}
