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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("categories").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
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

    const doc = await adminDb.collection("categories").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, image, order } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (name) {
      updateData.name = {
        en: name.en || "",
        es: name.es || "",
        "zh-HK": name["zh-HK"] || "",
      };
      if (name.en) {
        updateData.slug = slugify(name.en);
      }
    }
    if (description) {
      updateData.description = {
        en: description.en || "",
        es: description.es || "",
        "zh-HK": description["zh-HK"] || "",
      };
    }
    if (image !== undefined) updateData.image = image;
    if (order !== undefined) updateData.order = order;

    await adminDb.collection("categories").doc(id).update(updateData);

    const updated = await adminDb.collection("categories").doc(id).get();

    return NextResponse.json({
      id: updated.id,
      ...updated.data(),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update category" },
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

    const doc = await adminDb.collection("categories").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if any products reference this category
    const productsSnap = await adminDb
      .collection("products")
      .where("categoryId", "==", id)
      .limit(1)
      .get();

    if (!productsSnap.empty) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category: products are still assigned to it. Reassign or remove those products first.",
        },
        { status: 409 }
      );
    }

    await adminDb.collection("categories").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
