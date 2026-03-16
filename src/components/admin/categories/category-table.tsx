"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/types";

interface CategoryTableProps {
  onEdit: (category: Category) => void;
  refreshKey: number;
}

export function CategoryTable({ onEdit, refreshKey }: CategoryTableProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete category");
        setDeleteConfirm(null);
      }
    } catch {
      alert("Failed to delete category");
      setDeleteConfirm(null);
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

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-overlay"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold font-heading">Delete Category</h3>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete this category? This action cannot
              be undone. Categories with assigned products cannot be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
