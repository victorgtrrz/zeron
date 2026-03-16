import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { PromotionTable } from "@/components/admin/promotions/promotion-table";
import { Plus } from "lucide-react";

export default function PromotionsPage() {
  return (
    <>
      <AdminHeader title="Promotions" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold font-heading">Promotions</h2>
          <Link
            href="/zr-ops/promotions/new"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Add Promotion
          </Link>
        </div>
        <PromotionTable />
      </div>
    </>
  );
}
