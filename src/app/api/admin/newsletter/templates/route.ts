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
    const snap = await adminDb
      .collection("campaign_templates")
      .orderBy("updatedAt", "desc")
      .get();

    const templates = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        subject: d.subject,
        body: d.body,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
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
    const { name, subject, body: htmlBody } = body;

    if (!name || !subject || !htmlBody) {
      return NextResponse.json(
        { error: "Name, subject, and body are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const docRef = await adminDb.collection("campaign_templates").add({
      name,
      subject,
      body: htmlBody,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
