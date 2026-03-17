import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";

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
    const body = await request.json();
    const { status } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const reviewRef = adminDb.collection("reviews").doc(id);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const reviewData = reviewSnap.data()!;
    const productId = reviewData.productId;

    // Update review status AND recalculate stats atomically in a transaction
    await adminDb.runTransaction(async (transaction) => {
      transaction.update(reviewRef, {
        status,
        updatedAt: new Date(),
      });

      const approvedSnap = await transaction.get(
        adminDb
          .collection("reviews")
          .where("productId", "==", productId)
          .where("status", "==", "approved")
      );

      let ratings: number[] = approvedSnap.docs
        .filter((d) => d.id !== id)
        .map((d) => d.data().rating || 0);

      if (status === "approved") {
        ratings.push(reviewData.rating);
      }

      const totalReviews = ratings.length;
      const averageRating =
        totalReviews > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / totalReviews) * 10) / 10
          : 0;

      const productRef = adminDb.collection("products").doc(productId);
      transaction.update(productRef, {
        reviewStats: { averageRating, totalReviews },
      });
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
