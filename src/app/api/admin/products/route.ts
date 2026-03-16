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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let query: FirebaseFirestore.Query = adminDb.collection("products");

    if (category) {
      query = query.where("categoryId", "==", category);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let products = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
        updatedAt:
          data.updatedAt && typeof data.updatedAt.toDate === "function"
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt,
      } as Record<string, unknown> & { id: string; createdAt: any; updatedAt: any };
    });

    // Client-side search filter (Firestore doesn't support full-text search)
    if (search) {
      const lowerSearch = search.toLowerCase();
      products = products.filter((p) => {
        const name = p.name as Record<string, string>;
        return (
          (name?.en && name.en.toLowerCase().includes(lowerSearch)) ||
          (name?.es && name.es.toLowerCase().includes(lowerSearch)) ||
          (name?.["zh-HK"] &&
            name["zh-HK"].toLowerCase().includes(lowerSearch))
        );
      });
    }

    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    return NextResponse.json({
      products: paginatedProducts,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

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

    if (!name?.en) {
      return NextResponse.json(
        { error: "English name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(name.en);

    const productData = {
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
      categoryId: categoryId || "",
      basePrice: typeof basePrice === "number" ? basePrice : 0,
      images: images || [],
      sizes: sizes || [],
      stock: stock || {},
      status: status || "draft",
      tags: tags || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("products").add(productData);

    return NextResponse.json(
      {
        id: docRef.id,
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
