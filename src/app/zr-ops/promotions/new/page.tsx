"use client";

import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PromotionForm } from "@/components/admin/promotions/promotion-form";
import type { Promotion } from "@/types";

export default function NewPromotionPage() {
  const router = useRouter();

  async function handleSave(data: Partial<Promotion>) {
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create promotion");
    }

    router.push("/zr-ops/promotions");
  }

  return (
    <>
      <AdminHeader title="New Promotion" />
      <div className="mx-auto max-w-3xl p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">
          Create New Promotion
        </h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <PromotionForm onSave={handleSave} />
        </div>
      </div>
    </>
  );
}
