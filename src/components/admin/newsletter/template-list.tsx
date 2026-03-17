"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Template {
  id: string;
  name: string;
  subject: string;
  updatedAt: string | null;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/newsletter/templates/${deleteConfirm}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== deleteConfirm));
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    } finally {
      setDeleteConfirm(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading">Templates</h2>
        <Link
          href="/zr-ops/newsletter/templates/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-medium text-muted">Name</th>
              <th className="px-4 py-3 font-medium text-muted">Subject</th>
              <th className="px-4 py-3 font-medium text-muted">Updated</th>
              <th className="px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No templates yet
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border transition-colors hover:bg-background/50"
                >
                  <td className="px-4 py-3 font-medium text-accent">{t.name}</td>
                  <td className="px-4 py-3 text-muted">{t.subject}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(t.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/zr-ops/newsletter/templates/${t.id}/edit`}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
