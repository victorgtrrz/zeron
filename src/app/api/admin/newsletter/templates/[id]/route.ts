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
    const snap = await adminDb.collection("campaign_templates").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const d = snap.data()!;
    return NextResponse.json({
      id: snap.id,
      name: d.name,
      subject: d.subject,
      body: d.body,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch template:", error);
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
    const docRef = adminDb.collection("campaign_templates").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body !== undefined) updates.body = body.body;

    await docRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    const docRef = adminDb.collection("campaign_templates").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
