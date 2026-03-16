import Link from "next/link";
import type { Order } from "@/types";

interface RecentOrdersProps {
  orders: Order[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
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

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border p-6">
        <h2 className="text-lg font-bold font-heading">Recent Orders</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Order ID
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Customer
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Total
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Payment
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Fulfillment
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-muted"
                >
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border transition-colors hover:bg-surface/50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/zr-ops/orders/${order.id}`}
                      className="text-sm font-mono text-accent hover:underline"
                    >
                      {order.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {order.userId}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-accent">
                    {formatCents(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${paymentBadgeClass(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${fulfillmentBadgeClass(
                        order.fulfillmentStatus
                      )}`}
                    >
                      {order.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
