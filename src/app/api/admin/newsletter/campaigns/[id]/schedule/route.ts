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
    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt is required" },
        { status: 400 }
      );
    }

    const scheduleDate = new Date(scheduledAt);
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
      return NextResponse.json(
        { error: "scheduledAt must be a valid future date" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("campaigns").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (snap.data()!.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be scheduled" },
        { status: 400 }
      );
    }

    await docRef.update({
      status: "scheduled",
      scheduledAt: scheduleDate,
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to schedule campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
