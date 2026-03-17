"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CampaignSummary {
  id: string;
  subject: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string | null;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "sent":
      return "bg-success/20 text-success";
    case "sending":
      return "bg-brand/20 text-accent";
    case "scheduled":
      return "bg-warning/20 text-warning";
    case "failed":
      return "bg-destructive/20 text-destructive";
    case "draft":
    default:
      return "bg-muted/20 text-muted";
  }
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/newsletter/campaigns?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div>
      {/* Header with New Campaign button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading">Campaigns</h2>
        <Link
          href="/zr-ops/newsletter/campaigns/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-medium text-muted">Subject</th>
              <th className="px-4 py-3 font-medium text-muted">Status</th>
              <th className="px-4 py-3 font-medium text-muted">Recipients</th>
              <th className="px-4 py-3 font-medium text-muted">Sent</th>
              <th className="px-4 py-3 font-medium text-muted">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No campaigns yet
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border transition-colors hover:bg-background/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/zr-ops/newsletter/campaigns/${c.id}`}
                      className="text-accent hover:underline"
                    >
                      {c.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {c.status === "sent" || c.status === "failed"
                      ? `${c.successCount}/${c.recipientCount}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(c.sentAt)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(c.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border p-2 text-accent transition-colors hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border p-2 text-accent transition-colors hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
