"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, Archive, Pencil } from "lucide-react";
import type { Product, Category } from "@/types";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-success/20 text-success";
    case "draft":
      return "bg-warning/20 text-warning";
    case "archived":
      return "bg-muted/20 text-muted";
    default:
      return "bg-muted/20 text-muted";
  }
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  async function handleArchive(id: string) {
    if (!confirm("Archive this product?")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert("Failed to archive product");
      }
    } catch {
      alert("Failed to archive product");
    }
  }

  function totalStock(product: Product): number {
    if (!product.stock) return 0;
    return Object.values(product.stock).reduce(
      (sum, qty) => sum + (qty || 0),
      0
    );
  }

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
            placeholder="Search products..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name.en}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
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
                Category
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Price
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Stock
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
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const categoryName =
                  categories.find((c) => c.id === product.categoryId)?.name
                    ?.en || "—";

                return (
                  <tr
                    key={product.id}
                    className="border-b border-border transition-colors hover:bg-surface/50"
                  >
                    <td className="px-6 py-3">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name?.en || "Product"}
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
                      {product.name?.en || "Untitled"}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted">
                      {categoryName}
                    </td>
                    <td className="px-6 py-3 text-sm text-accent">
                      {formatCents(product.basePrice)}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted">
                      {totalStock(product)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/zr-ops/products/${product.id}/edit`}
                          className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        {product.status !== "archived" && (
                          <button
                            onClick={() => handleArchive(product.id)}
                            className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of{" "}
            {total} products
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
