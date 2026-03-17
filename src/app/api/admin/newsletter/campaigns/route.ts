import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const collection = adminDb.collection("campaigns");

    const countSnap = await collection.count().get();
    const total = countSnap.data().count;
    const totalPages = Math.ceil(total / limit);

    const offset = (page - 1) * limit;
    const snap = await collection
      .orderBy("createdAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    const campaigns = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        subject: d.subject,
        status: d.status,
        scheduledAt: d.scheduledAt?.toDate?.()?.toISOString() ?? null,
        sentAt: d.sentAt?.toDate?.()?.toISOString() ?? null,
        recipientCount: d.recipientCount ?? 0,
        successCount: d.successCount ?? 0,
        failureCount: d.failureCount ?? 0,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ campaigns, total, page, totalPages });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, body: htmlBody, templateId } = body;

    if (!subject || !htmlBody) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
    }

    const now = new Date();
    const docRef = await adminDb.collection("campaigns").add({
      subject,
      body: htmlBody,
      templateId: templateId || null,
      status: "draft",
      scheduledAt: null,
      sentAt: null,
      recipientCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
