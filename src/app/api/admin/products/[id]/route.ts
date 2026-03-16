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
    const doc = await adminDb.collection("products").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt:
        data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      updatedAt:
        data.updatedAt && typeof data.updatedAt.toDate === "function"
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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

    const doc = await adminDb.collection("products").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      categoryId,
      basePrice,
      images,
      sizes,
      stock,
      status,
      tags,
    } = body;

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
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (images !== undefined) updateData.images = images;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (stock !== undefined) updateData.stock = stock;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;

    await adminDb.collection("products").doc(id).update(updateData);

    const updated = await adminDb.collection("products").doc(id).get();
    const updatedData = updated.data()!;

    return NextResponse.json({
      id: updated.id,
      ...updatedData,
      createdAt:
        updatedData.createdAt &&
        typeof updatedData.createdAt.toDate === "function"
          ? updatedData.createdAt.toDate().toISOString()
          : updatedData.createdAt,
      updatedAt:
        updatedData.updatedAt &&
        typeof updatedData.updatedAt.toDate === "function"
          ? updatedData.updatedAt.toDate().toISOString()
          : updatedData.updatedAt,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update product" },
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

    const doc = await adminDb.collection("products").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Soft delete - set status to archived
    await adminDb.collection("products").doc(id).update({
      status: "archived",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: "Product archived" });
  } catch (error) {
    console.error("Error archiving product:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to archive product" },
      { status: 500 }
    );
  }
}
