"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface StatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onUpdate: (newStatus: string) => void;
}

const validTransitions: Record<string, string[]> = {
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const statusLabels: Record<string, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function StatusUpdater({
  orderId,
  currentStatus,
  onUpdate,
}: StatusUpdaterProps) {
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const allowedNext = validTransitions[currentStatus] || [];

  async function handleStatusChange(newStatus: string) {
    if (newStatus === "cancelled") {
      setShowCancelConfirm(true);
      return;
    }

    await performUpdate(newStatus);
  }

  async function performUpdate(newStatus: string) {
    setUpdating(true);
    setShowCancelConfirm(false);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: newStatus }),
      });

      if (res.ok) {
        onUpdate(newStatus);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (allowedNext.length === 0) {
    return (
      <p className="text-sm text-muted">
        Status is <span className="font-medium text-accent">{statusLabels[currentStatus] || currentStatus}</span> (terminal — no further transitions)
      </p>
    );
  }

  return (
    <div>
      <label className="mb-2 block text-sm text-muted">
        Update Fulfillment Status
      </label>

      <div className="flex flex-wrap gap-2">
        {allowedNext.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={updating}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              status === "cancelled"
                ? "border-destructive/50 text-destructive hover:bg-destructive/10"
                : "border-border text-accent hover:bg-background"
            }`}
          >
            {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {statusLabels[status] || status}
          </button>
        ))}
      </div>

      {/* Cancellation confirmation dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-overlay"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold font-heading">Cancel Order</h3>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-accent"
              >
                Go back
              </button>
              <button
                onClick={() => performUpdate("cancelled")}
                disabled={updating}
                className="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
