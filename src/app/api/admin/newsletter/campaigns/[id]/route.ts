import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
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
    const snap = await adminDb.collection("campaigns").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const d = snap.data()!;
    return NextResponse.json({
      id: snap.id,
      subject: d.subject,
      body: d.body,
      templateId: d.templateId ?? null,
      status: d.status,
      scheduledAt: d.scheduledAt?.toDate?.()?.toISOString() ?? null,
      sentAt: d.sentAt?.toDate?.()?.toISOString() ?? null,
      recipientCount: d.recipientCount ?? 0,
      successCount: d.successCount ?? 0,
      failureCount: d.failureCount ?? 0,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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

    if (snap.data()!.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body !== undefined) updates.body = body.body;

    await docRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
