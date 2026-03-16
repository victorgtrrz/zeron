import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("categories")
      .orderBy("order", "asc")
      .get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const { name, description, image, order } = body;

    if (!name?.en) {
      return NextResponse.json(
        { error: "English name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(name.en);

    // Check for duplicate slug
    const existingSlug = await adminDb
      .collection("categories")
      .where("slug", "==", slug)
      .get();

    if (!existingSlug.empty) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const categoryData = {
      name: {
        en: name.en || "",
        es: name.es || "",
        "zh-HK": name["zh-HK"] || "",
      },
      description: {
        en: description?.en || "",
        es: description?.es || "",
        "zh-HK": description?.["zh-HK"] || "",
      },
      slug,
      image: image || "",
      order: typeof order === "number" ? order : 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("categories").add(categoryData);

    return NextResponse.json(
      {
        id: docRef.id,
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
