"use client";

import { useState } from "react";
import Image from "next/image";
import { StatusUpdater } from "./status-updater";
import type { Order } from "@/types";

interface OrderDetailProps {
  order: Order;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-success/20 text-success";
    case "pending":
      return "bg-warning/20 text-warning";
    case "refunded":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted/20 text-muted";
  }
}

function fulfillmentBadgeClass(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-success/20 text-success";
    case "shipped":
      return "bg-brand/20 text-accent";
    case "processing":
      return "bg-warning/20 text-warning";
    case "cancelled":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted/20 text-muted";
  }
}

export function OrderDetail({ order: initialOrder }: OrderDetailProps) {
  const [order, setOrder] = useState(initialOrder);

  function handleStatusUpdate(newStatus: string) {
    setOrder({
      ...order,
      fulfillmentStatus: newStatus as Order["fulfillmentStatus"],
    });
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-mono text-lg font-bold text-accent">
              Order #{order.id}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {formatDate(order.createdAt as unknown as string)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${paymentBadgeClass(
                order.paymentStatus
              )}`}
            >
              {order.paymentStatus}
            </span>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${fulfillmentBadgeClass(
                order.fulfillmentStatus
              )}`}
            >
              {order.fulfillmentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order items */}
        <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold font-heading">Items</h3>

          <div className="space-y-4">
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-background text-muted">
                    —
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-accent">{item.name}</p>
                  <p className="text-xs text-muted">
                    Size: {item.size} | Qty: {item.quantity}
                  </p>
                </div>

                <p className="text-sm font-medium text-accent">
                  {formatCents(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-6 border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="text-accent">{formatCents(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Shipping</span>
              <span className="text-accent">{formatCents(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Discount</span>
                <span className="text-success">
                  -{formatCents(order.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span className="text-accent">Total</span>
              <span className="text-accent">{formatCents(order.total)}</span>
            </div>
          </div>

          {/* Promotion codes */}
          {order.promotionCodes && order.promotionCodes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted">Promotion codes used:</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {order.promotionCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-accent"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 text-lg font-bold font-heading">Customer</h3>
            <p className="text-sm text-accent">{order.userId}</p>
          </div>

          {/* Shipping address */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 text-lg font-bold font-heading">
              Shipping Address
            </h3>
            {order.shippingAddress ? (
              <div className="space-y-1 text-sm text-muted">
                <p className="font-medium text-accent">
                  {order.shippingAddress.recipientName}
                </p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="pt-1">{order.shippingAddress.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">No address provided</p>
            )}
          </div>

          {/* Status updater */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 text-lg font-bold font-heading">
              Update Status
            </h3>
            <StatusUpdater
              orderId={order.id}
              currentStatus={order.fulfillmentStatus}
              onUpdate={handleStatusUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
