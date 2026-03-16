"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { CategoryTable } from "@/components/admin/categories/category-table";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { Plus } from "lucide-react";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>(
    undefined
  );
  const [refreshKey, setRefreshKey] = useState(0);

  function handleEdit(category: Category) {
    setEditCategory(category);
    setShowForm(true);
  }

  function handleAdd() {
    setEditCategory(undefined);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditCategory(undefined);
  }

  async function handleSave(data: Partial<Category>) {
    if (editCategory) {
      // Update
      const res = await fetch(`/api/admin/categories/${editCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update category");
      }
    } else {
      // Create
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create category");
      }
    }

    handleClose();
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <AdminHeader title="Categories" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold font-heading">Categories</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
        <CategoryTable onEdit={handleEdit} refreshKey={refreshKey} />
      </div>

      {showForm && (
        <CategoryForm
          initialData={editCategory}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </>
  );
}
