"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Pencil, Trash2, Filter } from "lucide-react";
import type { Promotion } from "@/types";

function formatValue(promo: Promotion): string {
  switch (promo.type) {
    case "percentage":
      return `${promo.value}%`;
    case "fixed":
      return `$${(promo.value / 100).toFixed(2)}`;
    case "free_shipping":
      return "Free Ship";
    default:
      return String(promo.value);
  }
}

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PromotionTable() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "manual" | "auto">("all");

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  async function handleToggleActive(promo: Promotion) {
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !promo.active }),
      });
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) =>
            p.id === promo.id ? { ...p, active: !p.active } : p
          )
        );
      } else {
        alert("Failed to update promotion");
      }
    } catch {
      alert("Failed to update promotion");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promotion? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete promotion");
      }
    } catch {
      alert("Failed to delete promotion");
    }
  }

  const filtered = promotions.filter((p) => {
    if (activeFilter === "active" && !p.active) return false;
    if (activeFilter === "inactive" && p.active) return false;
    if (modeFilter === "manual" && p.applyMode !== "manual") return false;
    if (modeFilter === "auto" && p.applyMode !== "auto") return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-muted">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filters:</span>
        </div>

        <select
          value={activeFilter}
          onChange={(e) =>
            setActiveFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={modeFilter}
          onChange={(e) =>
            setModeFilter(e.target.value as "all" | "manual" | "auto")
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="all">All modes</option>
          <option value="manual">Manual</option>
          <option value="auto">Automatic</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Code
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Type
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Value
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Mode
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Date Range
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Uses
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Active
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-muted"
                >
                  No promotions found
                </td>
              </tr>
            ) : (
              filtered.map((promo) => (
                <tr
                  key={promo.id}
                  className="border-b border-border transition-colors hover:bg-surface/50"
                >
                  <td className="px-6 py-3 text-sm font-mono font-medium text-accent">
                    {promo.code || "AUTO"}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-block rounded-full bg-brand/20 px-3 py-1 text-xs font-medium text-accent">
                      {promo.type === "percentage"
                        ? "Percentage"
                        : promo.type === "fixed"
                        ? "Fixed"
                        : "Free Shipping"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-accent">
                    {formatValue(promo)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        promo.applyMode === "auto"
                          ? "bg-success/20 text-success"
                          : "bg-brand/20 text-accent"
                      }`}
                    >
                      {promo.applyMode === "auto" ? "Auto" : "Manual"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">
                    {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">
                    {promo.currentUses}
                    {promo.maxUses !== null ? ` / ${promo.maxUses}` : " / \u221E"}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleToggleActive(promo)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        promo.active ? "bg-success" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          promo.active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/zr-ops/promotions/${promo.id}/edit`}
                        className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
