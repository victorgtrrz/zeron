"use client";

import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/admin/products/product-form";
import type { Product } from "@/types";

export default function NewProductPage() {
  const router = useRouter();

  async function handleSave(data: Partial<Product>) {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create product");
    }

    router.push("/zr-ops/products");
  }

  return (
    <>
      <AdminHeader title="New Product" />
      <div className="mx-auto max-w-3xl p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">
          Create New Product
        </h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <ProductForm onSave={handleSave} />
        </div>
      </div>
    </>
  );
}
