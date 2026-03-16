import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

function serializeTimestamp(val: unknown): string | unknown {
  if (val && typeof val === "object" && "toDate" in val && typeof (val as Record<string, unknown>).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return val;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("promotions").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      startDate: serializeTimestamp(data.startDate),
      endDate: serializeTimestamp(data.endDate),
    });
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotion" },
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

    const doc = await adminDb.collection("promotions").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      applyMode,
      code,
      type,
      value,
      minOrderAmount,
      applicableCategories,
      banner,
      showBanner,
      startDate,
      endDate,
      maxUses,
      active,
    } = body;

    // If updating code for manual promo, check uniqueness
    if (applyMode === "manual" && code) {
      const upperCode = code.trim().toUpperCase();
      const existing = await adminDb
        .collection("promotions")
        .where("code", "==", upperCode)
        .get();

      const otherWithSameCode = existing.docs.find((d) => d.id !== id);
      if (otherWithSameCode) {
        return NextResponse.json(
          { error: "A promotion with this code already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (applyMode !== undefined) updateData.applyMode = applyMode;
    if (applyMode === "manual" && code !== undefined) {
      updateData.code = code ? code.trim().toUpperCase() : null;
    }
    if (applyMode === "auto") {
      updateData.code = null;
    }
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
    if (applicableCategories !== undefined) {
      updateData.applicableCategories =
        applicableCategories && applicableCategories.length > 0
          ? applicableCategories
          : null;
    }
    if (banner !== undefined) updateData.banner = banner;
    if (showBanner !== undefined) updateData.showBanner = showBanner;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (active !== undefined) updateData.active = active;

    await adminDb.collection("promotions").doc(id).update(updateData);

    const updated = await adminDb.collection("promotions").doc(id).get();
    const updatedData = updated.data()!;

    return NextResponse.json({
      id: updated.id,
      ...updatedData,
      startDate: serializeTimestamp(updatedData.startDate),
      endDate: serializeTimestamp(updatedData.endDate),
    });
  } catch (error) {
    console.error("Error updating promotion:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const doc = await adminDb.collection("promotions").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }

    await adminDb.collection("promotions").doc(id).delete();

    return NextResponse.json({ success: true, message: "Promotion deleted" });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete promotion" },
      { status: 500 }
    );
  }
}
