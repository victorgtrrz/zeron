"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/admin/products/product-form";
import type { Product } from "@/types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        if (!res.ok) {
          setError("Product not found");
          return;
        }
        const data = await res.json();
        setProduct(data);
      } catch {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  async function handleSave(data: Partial<Product>) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update product");
    }

    router.push("/zr-ops/products");
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Edit Product" />
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <AdminHeader title="Edit Product" />
        <div className="p-6 text-center text-muted">
          {error || "Product not found"}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Edit Product" />
      <div className="mx-auto max-w-3xl p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">Edit Product</h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <ProductForm initialData={product} onSave={handleSave} />
        </div>
      </div>
    </>
  );
}
