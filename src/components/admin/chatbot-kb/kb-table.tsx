"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Filter } from "lucide-react";
import { KBForm } from "@/components/admin/chatbot-kb/kb-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { ChatbotKBEntry } from "@/types";

function categoryBadgeClass(
  category: string
): string {
  switch (category) {
    case "products":
      return "bg-accent/20 text-accent";
    case "policies":
      return "bg-brand/20 text-accent";
    case "faq":
      return "bg-success/20 text-success";
    case "sizing":
      return "bg-muted/30 text-muted";
    default:
      return "bg-muted/20 text-muted";
  }
}

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function KBTable() {
  const [entries, setEntries] = useState<ChatbotKBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingEntry, setEditingEntry] = useState<ChatbotKBEntry | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chatbot-kb");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch KB entries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleToggleActive(entry: ChatbotKBEntry) {
    try {
      const res = await fetch(`/api/admin/chatbot-kb/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !entry.active }),
      });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, active: !e.active } : e
          )
        );
      } else {
        toast("Failed to update entry");
      }
    } catch {
      toast("Failed to update entry");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/chatbot-kb/${deleteTarget}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
        setDeleteTarget(null);
        toast("Entry deleted successfully", "success");
      } else {
        toast("Failed to delete entry");
      }
    } catch {
      toast("Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreateSave(data: Partial<ChatbotKBEntry>) {
    const res = await fetch("/api/admin/chatbot-kb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create entry");
    }

    setShowCreateForm(false);
    fetchEntries();
  }

  async function handleEditSave(data: Partial<ChatbotKBEntry>) {
    if (!editingEntry) return;

    const res = await fetch(`/api/admin/chatbot-kb/${editingEntry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update entry");
    }

    setEditingEntry(null);
    fetchEntries();
  }

  const filtered =
    categoryFilter === "all"
      ? entries
      : entries.filter((e) => e.category === categoryFilter);

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-muted">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Category:</span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="all">All categories</option>
          <option value="products">Products</option>
          <option value="policies">Policies</option>
          <option value="faq">FAQ</option>
          <option value="sizing">Sizing</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Title
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Category
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Active
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Last Updated
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
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-muted"
                >
                  No entries found
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border transition-colors hover:bg-surface/50"
                >
                  <td className="px-6 py-3 text-sm font-medium text-accent">
                    {entry.title}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${categoryBadgeClass(
                        entry.category
                      )}`}
                    >
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleToggleActive(entry)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        entry.active ? "bg-success" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          entry.active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">
                    {formatDate(entry.updatedAt)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(entry.id)}
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

      {/* Create Modal */}
      {showCreateForm && (
        <KBForm
          onSave={handleCreateSave}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <KBForm
          initialData={editingEntry}
          onSave={handleEditSave}
          onClose={() => setEditingEntry(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this knowledge base entry? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
