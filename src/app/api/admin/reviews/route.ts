import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    let q: FirebaseFirestore.Query = adminDb.collection("reviews");

    if (status !== "all") {
      q = q.where("status", "==", status);
    }

    q = q.orderBy("createdAt", "desc");

    const snapshot = await q.get();

    const total = snapshot.size;
    const totalPages = Math.ceil(total / pageLimit);
    const start = (page - 1) * pageLimit;

    // Slice first, then batch product lookups only for the current page
    const pageDocs = snapshot.docs.slice(start, start + pageLimit);
    const productIds = [...new Set(pageDocs.map((d) => d.data().productId))];
    const productNames: Record<string, string> = {};

    for (let i = 0; i < productIds.length; i += 30) {
      const batch = productIds.slice(i, i + 30);
      if (batch.length === 0) continue;
      const productsSnap = await adminDb
        .collection("products")
        .where("__name__", "in", batch)
        .get();
      productsSnap.docs.forEach((doc) => {
        const name = doc.data().name;
        productNames[doc.id] = name?.en || name?.es || doc.id;
      });
    }

    const reviews = pageDocs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        productId: d.productId,
        productName: productNames[d.productId] || d.productId,
        userId: d.userId,
        displayName: d.displayName,
        rating: d.rating,
        comment: d.comment,
        verifiedPurchase: d.verifiedPurchase,
        status: d.status,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ reviews, total, page, totalPages });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
