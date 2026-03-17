"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, X, Eye } from "lucide-react";
import { StarRating } from "@/components/product/star-rating";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  displayName: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

function formatDate(date: string): string {
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
    case "approved":
      return "bg-success/20 text-success";
    case "pending":
      return "bg-warning/20 text-warning";
    case "rejected":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted/20 text-muted";
  }
}

export function ReviewsList() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "approved" | "rejected";
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function openConfirm(id: string, status: "approved" | "rejected") {
    setConfirmAction({ id, status });
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setConfirmLoading(true);

    try {
      const res = await fetch(`/api/admin/reviews/${confirmAction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirmAction.status }),
      });

      if (res.ok) {
        toast(
          confirmAction.status === "approved"
            ? "Review approved"
            : "Review rejected",
          "success"
        );
        fetchReviews();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update review", "error");
      }
    } catch {
      toast("Failed to update review", "error");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  }

  const statusFilters = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  return (
    <div>
      {/* Status filter tabs */}
      <div className="mb-4 flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-accent text-background"
                : "border border-border text-muted hover:bg-surface hover:text-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Product
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                User
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Rating
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Comment
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Date
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Actions
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
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-b border-border transition-colors hover:bg-surface/50"
                >
                  <td className="max-w-[200px] truncate px-6 py-4 text-sm text-accent">
                    {review.productName}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {review.displayName || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StarRating rating={review.rating} size="sm" />
                  </td>
                  <td className="max-w-[300px] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm text-muted">
                        {expandedId === review.id
                          ? review.comment
                          : review.comment.length > 60
                          ? `${review.comment.slice(0, 60)}...`
                          : review.comment}
                      </p>
                      {review.comment.length > 60 && (
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === review.id ? null : review.id
                            )
                          }
                          className="shrink-0 rounded-md p-1 text-muted transition-colors hover:text-accent"
                          title="Toggle full comment"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {review.createdAt ? formatDate(review.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                        review.status
                      )}`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {review.status !== "approved" && (
                        <button
                          onClick={() => openConfirm(review.id, "approved")}
                          className="flex items-center gap-1 rounded-lg bg-success/20 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/30"
                          title="Approve"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      {review.status !== "rejected" && (
                        <button
                          onClick={() => openConfirm(review.id, "rejected")}
                          className="flex items-center gap-1 rounded-lg bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/30"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                    </div>
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
            {total} reviews
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirm}
        title={
          confirmAction?.status === "approved"
            ? "Approve Review"
            : "Reject Review"
        }
        message={
          confirmAction?.status === "approved"
            ? "This review will become publicly visible on the product page."
            : "This review will be hidden from the product page."
        }
        confirmText={
          confirmAction?.status === "approved" ? "Approve" : "Reject"
        }
        variant={
          confirmAction?.status === "rejected" ? "destructive" : "default"
        }
        loading={confirmLoading}
      />
    </div>
  );
}
