import { AdminHeader } from "@/components/admin/admin-header";
import { OrderTable } from "@/components/admin/orders/order-table";

export default function OrdersPage() {
  return (
    <>
      <AdminHeader title="Orders" />
      <div className="p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">Orders</h2>
        <OrderTable />
      </div>
    </>
  );
}
