import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUser } from "@/lib/user-auth";
import { sanitizeComment, validateRating } from "@/lib/review-utils";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageLimit = parseInt(searchParams.get("limit") || "10", 10);

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const reviewsRef = adminDb.collection("reviews");
    const q = reviewsRef
      .where("productId", "==", productId)
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc");

    const snapshot = await q.get();
    const total = snapshot.size;
    const totalPages = Math.ceil(total / pageLimit);
    const start = (page - 1) * pageLimit;

    const reviews = snapshot.docs.slice(start, start + pageLimit).map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        productId: d.productId,
        displayName: d.displayName,
        rating: d.rating,
        comment: d.comment,
        verifiedPurchase: d.verifiedPurchase,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
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

export async function POST(request: NextRequest) {
  let user: { uid: string; displayName: string | null };
  try {
    user = await verifyUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, rating, comment } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    if (!validateRating(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string") {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    const sanitized = sanitizeComment(comment);
    if (sanitized.length < 10 || sanitized.length > 500) {
      return NextResponse.json(
        { error: "Comment must be between 10 and 500 characters" },
        { status: 400 }
      );
    }

    // Rate limiting: max 5 reviews per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReviews = await adminDb
      .collection("reviews")
      .where("userId", "==", user.uid)
      .where("createdAt", ">=", oneHourAgo)
      .get();

    if (recentReviews.size >= 5) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // Verify product exists
    const productSnap = await adminDb.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify purchase
    const ordersSnap = await adminDb
      .collection("orders")
      .where("userId", "==", user.uid)
      .where("paymentStatus", "==", "paid")
      .where("fulfillmentStatus", "==", "delivered")
      .get();

    const hasPurchased = ordersSnap.docs.some((doc) => {
      const items = doc.data().items || [];
      return items.some(
        (item: { productId: string }) => item.productId === productId
      );
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "Only verified purchasers can leave reviews" },
        { status: 403 }
      );
    }

    // Check duplicate
    const existingReview = await adminDb
      .collection("reviews")
      .where("productId", "==", productId)
      .where("userId", "==", user.uid)
      .get();

    if (!existingReview.empty) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 403 }
      );
    }

    // Create review
    const reviewData = {
      productId,
      userId: user.uid,
      displayName: user.displayName || "",
      rating,
      comment: sanitized,
      verifiedPurchase: true,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("reviews").add(reviewData);

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
