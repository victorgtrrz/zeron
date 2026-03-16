import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

const validTransitions: Record<string, string[]> = {
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("orders").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt:
        data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      updatedAt:
        data.updatedAt && typeof data.updatedAt.toDate === "function"
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const doc = await adminDb.collection("orders").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fulfillmentStatus } = body;

    if (!fulfillmentStatus) {
      return NextResponse.json(
        { error: "fulfillmentStatus is required" },
        { status: 400 }
      );
    }

    const currentStatus = doc.data()!.fulfillmentStatus as string;
    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(fulfillmentStatus)) {
      return NextResponse.json(
        {
          error: `Invalid transition: cannot move from "${currentStatus}" to "${fulfillmentStatus}". Allowed: ${allowed.join(", ") || "none (terminal state)"}`,
        },
        { status: 400 }
      );
    }

    await adminDb.collection("orders").doc(id).update({
      fulfillmentStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await adminDb.collection("orders").doc(id).get();
    const updatedData = updated.data()!;

    return NextResponse.json({
      id: updated.id,
      ...updatedData,
      createdAt:
        updatedData.createdAt &&
        typeof updatedData.createdAt.toDate === "function"
          ? updatedData.createdAt.toDate().toISOString()
          : updatedData.createdAt,
      updatedAt:
        updatedData.updatedAt &&
        typeof updatedData.updatedAt.toDate === "function"
          ? updatedData.updatedAt.toDate().toISOString()
          : updatedData.updatedAt,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
