import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("chatbotKB").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      updatedAt:
        data.updatedAt && typeof data.updatedAt.toDate === "function"
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching chatbot KB entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry" },
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

    const doc = await adminDb.collection("chatbotKB").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, category, active } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (category !== undefined) {
      const validCategories = ["products", "policies", "faq", "sizing"];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
      updateData.category = category;
    }
    if (active !== undefined) updateData.active = active;

    await adminDb.collection("chatbotKB").doc(id).update(updateData);

    const updated = await adminDb.collection("chatbotKB").doc(id).get();
    const updatedData = updated.data()!;

    return NextResponse.json({
      id: updated.id,
      ...updatedData,
      updatedAt:
        updatedData.updatedAt &&
        typeof updatedData.updatedAt.toDate === "function"
          ? updatedData.updatedAt.toDate().toISOString()
          : updatedData.updatedAt,
    });
  } catch (error) {
    console.error("Error updating chatbot KB entry:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update entry" },
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

    const doc = await adminDb.collection("chatbotKB").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    await adminDb.collection("chatbotKB").doc(id).delete();

    return NextResponse.json({ success: true, message: "Entry deleted" });
  } catch (error) {
    console.error("Error deleting chatbot KB entry:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
