import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection("chatbotKB")
      .orderBy("updatedAt", "desc")
      .get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        updatedAt:
          data.updatedAt && typeof data.updatedAt.toDate === "function"
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt,
      };
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching chatbot KB entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const { title, content, category, active } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const validCategories = ["products", "policies", "faq", "sizing"];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Valid category is required" },
        { status: 400 }
      );
    }

    const entryData = {
      title: title.trim(),
      content: content.trim(),
      category,
      active: active !== undefined ? active : true,
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("chatbotKB").add(entryData);

    return NextResponse.json(
      {
        id: docRef.id,
        ...entryData,
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating chatbot KB entry:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create knowledge base entry" },
      { status: 500 }
    );
  }
}
