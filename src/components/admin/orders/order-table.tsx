"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Order } from "@/types";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (fulfillmentFilter) params.set("fulfillmentStatus", fulfillmentFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [search, paymentFilter, fulfillmentFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order ID or email..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="">All payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={fulfillmentFilter}
          onChange={(e) => {
            setFulfillmentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="">All fulfillment</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
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
                Items
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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                  No orders found
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
                      className="font-mono text-sm text-accent hover:underline"
                    >
                      {order.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {order.userId}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {order.items?.length || 0}
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
                    {formatDate(order.createdAt as unknown as string)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of{" "}
            {total} orders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-sm text-muted transition-colors hover:text-accent disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="flex items-center px-3 text-sm text-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-sm text-muted transition-colors hover:text-accent disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
