"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PromotionForm } from "@/components/admin/promotions/promotion-form";
import type { Promotion } from "@/types";

export default function EditPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPromotion() {
      try {
        const res = await fetch(`/api/admin/promotions/${id}`);
        if (!res.ok) {
          setError("Promotion not found");
          return;
        }
        const data = await res.json();
        setPromotion(data);
      } catch {
        setError("Failed to load promotion");
      } finally {
        setLoading(false);
      }
    }
    fetchPromotion();
  }, [id]);

  async function handleSave(data: Partial<Promotion>) {
    const res = await fetch(`/api/admin/promotions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update promotion");
    }

    router.push("/zr-ops/promotions");
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Edit Promotion" />
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      </>
    );
  }

  if (error || !promotion) {
    return (
      <>
        <AdminHeader title="Edit Promotion" />
        <div className="p-6 text-center text-muted">
          {error || "Promotion not found"}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Edit Promotion" />
      <div className="mx-auto max-w-3xl p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">
          Edit Promotion
        </h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <PromotionForm initialData={promotion} onSave={handleSave} />
        </div>
      </div>
    </>
  );
}
