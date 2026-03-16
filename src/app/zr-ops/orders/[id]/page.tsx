import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { OrderDetail } from "@/components/admin/orders/order-detail";
import type { Order } from "@/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const doc = await adminDb.collection("orders").doc(id).get();

  if (!doc.exists) {
    notFound();
  }

  const data = doc.data()!;
  const order: Order = {
    id: doc.id,
    userId: data.userId || "",
    items: data.items || [],
    subtotal: data.subtotal || 0,
    shipping: data.shipping || 0,
    discount: data.discount || 0,
    total: data.total || 0,
    paymentStatus: data.paymentStatus || "pending",
    fulfillmentStatus: data.fulfillmentStatus || "processing",
    shippingAddress: data.shippingAddress || {
      recipientName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      country: "",
      zip: "",
    },
    stripeSessionId: data.stripeSessionId || "",
    promotionCodes: data.promotionCodes || [],
    createdAt:
      data.createdAt && typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || new Date().toISOString(),
    updatedAt:
      data.updatedAt && typeof data.updatedAt.toDate === "function"
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt || new Date().toISOString(),
  } as unknown as Order;

  return (
    <>
      <AdminHeader title={`Order #${id.slice(0, 8)}...`} />
      <div className="p-6">
        <OrderDetail order={order} />
      </div>
    </>
  );
}
