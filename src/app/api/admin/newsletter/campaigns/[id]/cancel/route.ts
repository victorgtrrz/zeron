import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection("campaigns").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (snap.data()!.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only scheduled campaigns can be cancelled" },
        { status: 400 }
      );
    }

    await docRef.update({
      status: "draft",
      scheduledAt: null,
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to cancel campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
