"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { Category } from "@/types";

interface CategoryTableProps {
  onEdit: (category: Category) => void;
  refreshKey: number;
}

export function CategoryTable({ onEdit, refreshKey }: CategoryTableProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshKey]);

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirm}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchCategories();
        toast("Category deleted successfully", "success");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete category");
        setDeleteConfirm(null);
      }
    } catch {
      toast("Failed to delete category");
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Image
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Slug
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Order
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted">
                  Loading...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-border transition-colors hover:bg-surface/50"
                >
                  <td className="px-6 py-3">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name?.en || "Category"}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-accent">
                    {category.name?.en || "Untitled"}
                  </td>
                  <td className="px-6 py-3 font-mono text-sm text-muted">
                    {category.slug}
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">
                    {category.order}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(category)}
                        className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
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

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone. Categories with assigned products cannot be deleted."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </>
  );
}
