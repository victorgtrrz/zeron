# Product Reviews Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a product review system with 1-5 star ratings, admin moderation, and SEO-enriched JSON-LD structured data.

**Architecture:** Reviews live in a top-level Firestore `reviews` collection. Approved review stats are precalculated on each product document. A new `verifyUser()` helper authenticates regular users for the public API. Admin moderation uses the existing `verifyAdmin()` pattern.

**Tech Stack:** Next.js 16 App Router, Firestore (firebase-admin), Firebase Auth, Tailwind CSS 4, next-intl, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-17-product-reviews-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/types/index.ts` | Add `Review` interface, extend `Product` with `reviewStats` |
| Create | `src/lib/user-auth.ts` | `verifyUser()` — authenticate regular users from `__session` cookie |
| Create | `src/lib/review-utils.ts` | `sanitizeComment()`, `getPartialName()`, `validateRating()` |
| Create | `src/app/api/reviews/route.ts` | `POST` (create review) + `GET` (list approved reviews) |
| Create | `src/app/api/admin/reviews/route.ts` | `GET` (list reviews with status filter) |
| Create | `src/app/api/admin/reviews/[id]/route.ts` | `PUT` (approve/reject + recalculate stats) |
| Modify | `src/components/product/product-jsonld.tsx` | Add `aggregateRating` + `review` to JSON-LD |
| Create | `src/components/product/star-rating.tsx` | Reusable star display (read-only + interactive modes) |
| Create | `src/components/product/review-card.tsx` | Single review card display |
| Create | `src/components/product/review-summary.tsx` | Aggregate rating bar (stars + count) |
| Create | `src/components/product/review-list.tsx` | Review list with "load more" pagination |
| Create | `src/components/product/review-form.tsx` | Review submission form with eligibility checks |
| Create | `src/components/product/review-section.tsx` | Orchestrator: summary + list + form |
| Modify | `src/app/[locale]/(shop)/shop/[slug]/page.tsx` | Wire review data + components into product page |
| Modify | `src/components/admin/admin-sidebar.tsx` | Add "Reviews" nav link |
| Create | `src/app/zr-ops/reviews/page.tsx` | Admin reviews page |
| Create | `src/components/admin/reviews/reviews-list.tsx` | Admin table with filters + approve/reject actions |
| Modify | `src/messages/es.json` | Add `reviews` + `admin.reviews` translation keys |
| Modify | `src/messages/en.json` | Add `reviews` + `admin.reviews` translation keys |
| Modify | `src/messages/zh-HK.json` | Add `reviews` + `admin.reviews` translation keys |

---

## Chunk 1: Data Layer (Types, Auth, Utilities, API Routes)

### Task 1: Add Review type and extend Product type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the Review interface and extend Product**

Add after the `Product` interface (after line 45):

```typescript
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  displayName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
```

Add `reviewStats` to the `Product` interface (after `tags: string[];` on line 42):

```typescript
  reviewStats?: ReviewStats;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no new errors related to Review types

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(reviews): add Review type and reviewStats to Product"
```

---

### Task 2: Create verifyUser() auth helper

**Files:**
- Create: `src/lib/user-auth.ts`

- [ ] **Step 1: Create the user auth helper**

```typescript
import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

export async function verifyUser(
  request: NextRequest
): Promise<{ uid: string; displayName: string | null }> {
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("No session cookie found");
  }

  const decodedToken = await adminAuth.verifyIdToken(sessionCookie);

  return {
    uid: decodedToken.uid,
    displayName: decodedToken.name || null,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/lib/user-auth.ts
git commit -m "feat(reviews): add verifyUser auth helper for public API routes"
```

---

### Task 3: Create review utility functions

**Files:**
- Create: `src/lib/review-utils.ts`

- [ ] **Step 1: Create sanitization and display utilities**

```typescript
/**
 * Strip HTML tags and trim whitespace from user input.
 * Returns sanitized plain text.
 */
export function sanitizeComment(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").trim();
}

/**
 * Validate that a rating is an integer between 1 and 5.
 */
export function validateRating(rating: unknown): rating is number {
  return (
    typeof rating === "number" &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}

/**
 * Generate a partial/anonymous display name.
 * "Juan Martinez" → "J. M."
 * "Ana" → "A."
 * null/empty → "Anon."
 */
export function getPartialName(displayName: string | null | undefined): string {
  if (!displayName || !displayName.trim()) return "Anon.";

  const parts = displayName.trim().split(/\s+/);
  return parts
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/lib/review-utils.ts
git commit -m "feat(reviews): add review sanitization and display utilities"
```

---

### Task 4: Create public reviews API routes

**Files:**
- Create: `src/app/api/reviews/route.ts`

- [ ] **Step 1: Create the GET and POST route handlers**

```typescript
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
  // 1. Authenticate user
  let user: { uid: string; displayName: string | null };
  try {
    user = await verifyUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, rating, comment } = body;

    // 2. Validate inputs
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

    // 3. Rate limiting: max 5 reviews per hour
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

    // 4. Verify the product exists
    const productSnap = await adminDb.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 5. Verify purchase: order with paid + delivered containing this product
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

    // 6. Check for duplicate review
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

    // 7. Create the review
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reviews/route.ts
git commit -m "feat(reviews): add public API routes for creating and listing reviews"
```

---

### Task 5: Create admin reviews API routes

**Files:**
- Create: `src/app/api/admin/reviews/route.ts`
- Create: `src/app/api/admin/reviews/[id]/route.ts`

- [ ] **Step 1: Create GET /api/admin/reviews**

```typescript
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageLimit = parseInt(searchParams.get("limit") || "20", 10);

    let q: FirebaseFirestore.Query = adminDb.collection("reviews");

    if (status !== "all") {
      q = q.where("status", "==", status);
    }

    q = q.orderBy("createdAt", "desc");

    const snapshot = await q.get();

    // Collect unique productIds to fetch product names
    const productIds = [...new Set(snapshot.docs.map((d) => d.data().productId))];
    const productNames: Record<string, string> = {};

    // Fetch product names in batches (Firestore "in" supports max 30)
    for (let i = 0; i < productIds.length; i += 30) {
      const batch = productIds.slice(i, i + 30);
      const productsSnap = await adminDb
        .collection("products")
        .where("__name__", "in", batch)
        .get();
      productsSnap.docs.forEach((doc) => {
        const name = doc.data().name;
        productNames[doc.id] = name?.en || name?.es || doc.id;
      });
    }

    const total = snapshot.size;
    const totalPages = Math.ceil(total / pageLimit);
    const start = (page - 1) * pageLimit;

    const reviews = snapshot.docs.slice(start, start + pageLimit).map((doc) => {
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
```

- [ ] **Step 2: Create PUT /api/admin/reviews/[id]**

```typescript
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
      // Update the review status
      transaction.update(reviewRef, {
        status,
        updatedAt: new Date(),
      });

      // Get all currently approved reviews for this product
      const approvedSnap = await transaction.get(
        adminDb
          .collection("reviews")
          .where("productId", "==", productId)
          .where("status", "==", "approved")
      );

      // Build the list of ratings that will be approved after this transaction
      let ratings: number[] = approvedSnap.docs
        .filter((d) => d.id !== id) // exclude current review (we'll add it back if approving)
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/reviews/route.ts src/app/api/admin/reviews/\[id\]/route.ts
git commit -m "feat(reviews): add admin API routes for listing and moderating reviews"
```

---

### Task 6: Document required Firestore composite indexes

**Files:**
- Create: `firestore.indexes.json` (project root)

- [ ] **Step 1: Create the indexes file**

If a `firestore.indexes.json` already exists at the project root, add to it. Otherwise create:

```json
{
  "indexes": [
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "productId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "productId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Note: These indexes can also be created automatically when Firestore throws an index error on first query — the error message includes a direct link to create the index in the Firebase console.

- [ ] **Step 2: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat(reviews): add Firestore composite indexes for reviews collection"
```

---

## Chunk 2: Frontend Components (Product Page)

### Task 7: Add i18n translation keys

**Files:**
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`
- Modify: `src/messages/zh-HK.json`

- [ ] **Step 1: Add review keys to es.json**

Add the following to the root of the JSON object (as a new top-level key):

```json
"reviews": {
  "title": "Reseñas de Clientes",
  "noReviews": "Sin reseñas todavía",
  "reviewCount": "{count, plural, one {# reseña} other {# reseñas}}",
  "verifiedPurchase": "Compra verificada",
  "writeReview": "Escribe tu reseña",
  "submitReview": "Enviar Reseña",
  "commentPlaceholder": "Cuéntanos tu experiencia con este producto...",
  "charactersRemaining": "{count} caracteres restantes",
  "loginRequired": "Inicia sesión para dejar una reseña",
  "purchaseRequired": "Solo los compradores verificados pueden dejar reseñas",
  "alreadyReviewed": "Ya has dejado una reseña para este producto",
  "submitSuccess": "Tu reseña ha sido enviada y será visible tras su aprobación",
  "submitError": "Error al enviar la reseña. Inténtalo de nuevo.",
  "ratingRequired": "Selecciona una puntuación",
  "commentTooShort": "El comentario debe tener al menos 10 caracteres",
  "starsLabel": "{rating} de 5 estrellas",
  "loadMore": "Cargar más reseñas",
  "sending": "Enviando..."
}
```

- [ ] **Step 2: Add review keys to en.json**

```json
"reviews": {
  "title": "Customer Reviews",
  "noReviews": "No reviews yet",
  "reviewCount": "{count, plural, one {# review} other {# reviews}}",
  "verifiedPurchase": "Verified Purchase",
  "writeReview": "Write Your Review",
  "submitReview": "Submit Review",
  "commentPlaceholder": "Tell us about your experience with this product...",
  "charactersRemaining": "{count} characters remaining",
  "loginRequired": "Log in to leave a review",
  "purchaseRequired": "Only verified purchasers can leave reviews",
  "alreadyReviewed": "You have already reviewed this product",
  "submitSuccess": "Your review has been submitted and will be visible after approval",
  "submitError": "Failed to submit review. Please try again.",
  "ratingRequired": "Please select a rating",
  "commentTooShort": "Comment must be at least 10 characters",
  "starsLabel": "{rating} out of 5 stars",
  "loadMore": "Load more reviews",
  "sending": "Sending..."
}
```

- [ ] **Step 3: Add review keys to zh-HK.json**

```json
"reviews": {
  "title": "顧客評價",
  "noReviews": "暫無評價",
  "reviewCount": "{count} 條評價",
  "verifiedPurchase": "已驗證購買",
  "writeReview": "撰寫評價",
  "submitReview": "提交評價",
  "commentPlaceholder": "告訴我們您對這個產品的體驗...",
  "charactersRemaining": "剩餘 {count} 個字符",
  "loginRequired": "登入後即可留下評價",
  "purchaseRequired": "只有已驗證的購買者才能留下評價",
  "alreadyReviewed": "您已經為此產品留下了評價",
  "submitSuccess": "您的評價已提交，審核通過後將會顯示",
  "submitError": "提交評價失敗，請重試。",
  "ratingRequired": "請選擇評分",
  "commentTooShort": "評論至少需要10個字符",
  "starsLabel": "{rating}/5 星",
  "loadMore": "載入更多評價",
  "sending": "提交中..."
}
```

- [ ] **Step 4: Add admin.reviews keys to es.json**

Add as a nested key inside `"admin"` (or as a top-level `"adminReviews"` key if no `"admin"` namespace exists):

```json
"adminReviews": {
  "title": "Reseñas",
  "product": "Producto",
  "user": "Usuario",
  "rating": "Puntuación",
  "comment": "Comentario",
  "date": "Fecha",
  "status": "Estado",
  "pending": "Pendientes",
  "approved": "Aprobadas",
  "rejected": "Rechazadas",
  "all": "Todas",
  "approve": "Aprobar",
  "reject": "Rechazar",
  "approveTitle": "Aprobar Reseña",
  "rejectTitle": "Rechazar Reseña",
  "approveMessage": "Esta reseña será visible en la página del producto.",
  "rejectMessage": "Esta reseña se ocultará de la página del producto.",
  "noReviews": "No se encontraron reseñas",
  "showingResults": "Mostrando {start}–{end} de {total} reseñas"
}
```

- [ ] **Step 5: Add admin.reviews keys to en.json**

```json
"adminReviews": {
  "title": "Reviews",
  "product": "Product",
  "user": "User",
  "rating": "Rating",
  "comment": "Comment",
  "date": "Date",
  "status": "Status",
  "pending": "Pending",
  "approved": "Approved",
  "rejected": "Rejected",
  "all": "All",
  "approve": "Approve",
  "reject": "Reject",
  "approveTitle": "Approve Review",
  "rejectTitle": "Reject Review",
  "approveMessage": "This review will become publicly visible on the product page.",
  "rejectMessage": "This review will be hidden from the product page.",
  "noReviews": "No reviews found",
  "showingResults": "Showing {start}–{end} of {total} reviews"
}
```

- [ ] **Step 6: Add admin.reviews keys to zh-HK.json**

```json
"adminReviews": {
  "title": "評價管理",
  "product": "產品",
  "user": "用戶",
  "rating": "評分",
  "comment": "評論",
  "date": "日期",
  "status": "狀態",
  "pending": "待審核",
  "approved": "已批准",
  "rejected": "已拒絕",
  "all": "全部",
  "approve": "批准",
  "reject": "拒絕",
  "approveTitle": "批准評價",
  "rejectTitle": "拒絕評價",
  "approveMessage": "此評價將在產品頁面上公開顯示。",
  "rejectMessage": "此評價將從產品頁面隱藏。",
  "noReviews": "未找到評價",
  "showingResults": "顯示第 {start}–{end} 條，共 {total} 條評價"
}
```

- [ ] **Step 7: Commit**

```bash
git add src/messages/es.json src/messages/en.json src/messages/zh-HK.json
git commit -m "feat(reviews): add i18n translation keys for reviews in all locales"
```

---

### Task 8: Create StarRating component

**Files:**
- Create: `src/components/product/star-rating.tsx`

- [ ] **Step 1: Create the StarRating component**

This component handles both read-only display and interactive selection.

```tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

const INTERACTIVE_SIZES = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onChange,
  size = "md",
  ariaLabel,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const displayRating = hovered || rating;
  const iconSize = interactive ? INTERACTIVE_SIZES[size] : SIZES[size];

  if (interactive) {
    return (
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label={ariaLabel}
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const value = i + 1;
          const filled = value <= displayRating;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange?.(value)}
              onMouseEnter={() => setHovered(value)}
              className="cursor-pointer rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-highlight/50"
              role="radio"
              aria-checked={value === rating}
              aria-label={`${value} star${value !== 1 ? "s" : ""}`}
            >
              <Star
                className={`${iconSize} transition-colors ${
                  filled
                    ? "fill-warning text-warning"
                    : "fill-none text-muted/40"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5" aria-label={ariaLabel} role="img">
      {Array.from({ length: maxStars }, (_, i) => {
        const value = i + 1;
        const filled = value <= Math.round(displayRating);
        return (
          <Star
            key={value}
            className={`${iconSize} ${
              filled
                ? "fill-warning text-warning"
                : "fill-none text-muted/40"
            }`}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/product/star-rating.tsx
git commit -m "feat(reviews): add StarRating component with read-only and interactive modes"
```

---

### Task 9: Create ReviewCard component

**Files:**
- Create: `src/components/product/review-card.tsx`

- [ ] **Step 1: Create the ReviewCard component**

```tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { StarRating } from "./star-rating";
import { getPartialName } from "@/lib/review-utils";
import { BadgeCheck } from "lucide-react";

interface ReviewCardProps {
  displayName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return rtf.format(-diffMinutes, "minute");
    }
    return rtf.format(-diffHours, "hour");
  }
  if (diffDays < 30) return rtf.format(-diffDays, "day");
  if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), "month");
  return rtf.format(-Math.floor(diffDays / 365), "year");
}

export function ReviewCard({
  displayName,
  rating,
  comment,
  verifiedPurchase,
  createdAt,
}: ReviewCardProps) {
  const t = useTranslations("reviews");
  const locale = useLocale();

  return (
    <div className="border-b border-border py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <StarRating
            rating={rating}
            size="sm"
            ariaLabel={t("starsLabel", { rating })}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-accent">
              {getPartialName(displayName)}
            </span>
            {verifiedPurchase && (
              <span className="flex items-center gap-1 text-xs text-success">
                <BadgeCheck className="h-3.5 w-3.5" />
                {t("verifiedPurchase")}
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {timeAgo(createdAt, locale)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{comment}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/product/review-card.tsx
git commit -m "feat(reviews): add ReviewCard component with partial name and relative date"
```

---

### Task 10: Create ReviewSummary component

**Files:**
- Create: `src/components/product/review-summary.tsx`

- [ ] **Step 1: Create the ReviewSummary component**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { StarRating } from "./star-rating";

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
}: ReviewSummaryProps) {
  const t = useTranslations("reviews");

  if (totalReviews === 0) {
    return (
      <p className="text-sm text-muted">{t("noReviews")}</p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating
        rating={averageRating}
        size="sm"
        ariaLabel={t("starsLabel", { rating: averageRating })}
      />
      <span className="text-sm font-medium text-accent">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-sm text-muted">
        ({t("reviewCount", { count: totalReviews })})
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/product/review-summary.tsx
git commit -m "feat(reviews): add ReviewSummary component with aggregate rating display"
```

---

### Task 11: Create ReviewForm component

**Files:**
- Create: `src/components/product/review-form.tsx`

- [ ] **Step 1: Create the ReviewForm component**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StarRating } from "./star-rating";
import { useToast } from "@/components/ui/toast";

interface ReviewFormProps {
  productId: string;
  eligibility: "eligible" | "login_required" | "purchase_required" | "already_reviewed";
}

export function ReviewForm({ productId, eligibility }: ReviewFormProps) {
  const t = useTranslations("reviews");
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const maxLength = 500;
  const remaining = maxLength - comment.length;

  if (submitted || eligibility === "already_reviewed") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t("alreadyReviewed")}</p>
      </div>
    );
  }

  if (eligibility === "login_required") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t("loginRequired")}</p>
      </div>
    );
  }

  if (eligibility === "purchase_required") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t("purchaseRequired")}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      toast(t("ratingRequired"), "warning");
      return;
    }

    if (comment.trim().length < 10) {
      toast(t("commentTooShort"), "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() }),
      });

      if (res.ok) {
        toast(t("submitSuccess"), "success");
        setSubmitted(true);
      } else {
        const data = await res.json();
        toast(data.error || t("submitError"), "error");
      }
    } catch {
      toast(t("submitError"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h3 className="mb-4 font-heading text-lg tracking-wide text-accent">
        {t("writeReview")}
      </h3>

      <div className="mb-4">
        <StarRating
          rating={rating}
          interactive
          onChange={setRating}
          size="lg"
          ariaLabel={t("starsLabel", { rating })}
        />
      </div>

      <div className="mb-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
          placeholder={t("commentPlaceholder")}
          rows={4}
          maxLength={maxLength}
          className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
        <p
          className={`mt-1 text-right text-xs ${
            remaining < 50 ? "text-warning" : "text-muted"
          }`}
        >
          {t("charactersRemaining", { count: remaining })}
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {submitting && (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {submitting ? t("sending") : t("submitReview")}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/product/review-form.tsx
git commit -m "feat(reviews): add ReviewForm component with eligibility checks and validation"
```

---

### Task 12: Create ReviewList component

**Files:**
- Create: `src/components/product/review-list.tsx`

- [ ] **Step 1: Create the ReviewList component**

```tsx
"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ReviewCard } from "./review-card";

interface ReviewItem {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewListProps {
  productId: string;
  initialReviews: ReviewItem[];
  initialTotal: number;
}

export function ReviewList({
  productId,
  initialReviews,
  initialTotal,
}: ReviewListProps) {
  const t = useTranslations("reviews");
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const hasMore = reviews.length < initialTotal;

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/reviews?productId=${productId}&page=${nextPage}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) => [...prev, ...data.reviews]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  if (reviews.length === 0) return null;

  return (
    <div>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          displayName={review.displayName}
          rating={review.rating}
          comment={review.comment}
          verifiedPurchase={review.verifiedPurchase}
          createdAt={review.createdAt}
        />
      ))}

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-border px-6 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-accent disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("loadMore")}
              </span>
            ) : (
              t("loadMore")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/product/review-list.tsx
git commit -m "feat(reviews): add ReviewList component with load-more pagination"
```

---

### Task 13: Create ReviewSection orchestrator and integrate into product page

**Files:**
- Create: `src/components/product/review-section.tsx`
- Modify: `src/app/[locale]/(shop)/shop/[slug]/page.tsx`

- [ ] **Step 1: Create the ReviewSection orchestrator**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { ReviewList } from "./review-list";
import { ReviewForm } from "./review-form";

interface ReviewItem {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewSectionProps {
  productId: string;
  reviews: ReviewItem[];
  totalReviews: number;
  eligibility: "eligible" | "login_required" | "purchase_required" | "already_reviewed";
}

export function ReviewSection({
  productId,
  reviews,
  totalReviews,
  eligibility,
}: ReviewSectionProps) {
  const t = useTranslations("reviews");

  return (
    <div id="reviews" className="mt-16">
      <h2 className="mb-6 font-heading text-2xl tracking-wider text-accent md:text-3xl">
        {t("title")}
      </h2>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Reviews list — takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          {totalReviews === 0 ? (
            <p className="py-8 text-sm text-muted">{t("noReviews")}</p>
          ) : (
            <ReviewList
              productId={productId}
              initialReviews={reviews}
              initialTotal={totalReviews}
            />
          )}
        </div>

        {/* Review form — takes 1/3 on desktop */}
        <div>
          <ReviewForm productId={productId} eligibility={eligibility} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate into product detail page**

Modify `src/app/[locale]/(shop)/shop/[slug]/page.tsx`:

Add these imports at the top:

```typescript
import { ReviewSummary } from "@/components/product/review-summary";
import { ReviewSection } from "@/components/product/review-section";
import { adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
```

Inside the `ProductDetailPage` function, after fetching `relatedProducts` and before the `return`, add the review data fetching logic:

```typescript
  // Fetch approved reviews for this product (first page)
  const reviewsSnap = await adminDb
    .collection("reviews")
    .where("productId", "==", product.id)
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const reviews = reviewsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      displayName: d.displayName,
      rating: d.rating,
      comment: d.comment,
      verifiedPurchase: d.verifiedPurchase,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });

  const totalApprovedReviews = product.reviewStats?.totalReviews ?? 0;

  // Determine review eligibility
  let eligibility: "eligible" | "login_required" | "purchase_required" | "already_reviewed" = "login_required";
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (sessionCookie) {
      const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
      const userId = decodedToken.uid;

      // Check if already reviewed
      const existingReview = await adminDb
        .collection("reviews")
        .where("productId", "==", product.id)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (!existingReview.empty) {
        eligibility = "already_reviewed";
      } else {
        // Check if has a verified purchase
        const ordersSnap = await adminDb
          .collection("orders")
          .where("userId", "==", userId)
          .where("paymentStatus", "==", "paid")
          .where("fulfillmentStatus", "==", "delivered")
          .get();

        const hasPurchased = ordersSnap.docs.some((doc) => {
          const items = doc.data().items || [];
          return items.some(
            (item: { productId: string }) => item.productId === product.id
          );
        });

        eligibility = hasPurchased ? "eligible" : "purchase_required";
      }
    }
  } catch {
    // Not logged in or invalid token — keep "login_required"
  }
```

Update the JSX return to include ReviewSummary and ReviewSection. In the right column div (the product info area), add `ReviewSummary` after the price `<p>` tag:

Wrap ReviewSummary in an anchor link for scroll-to-reviews:

```tsx
            <a href="#reviews" className="transition-opacity hover:opacity-80">
              <ReviewSummary
                averageRating={product.reviewStats?.averageRating ?? 0}
                totalReviews={totalApprovedReviews}
              />
            </a>
```

And before `<RelatedProducts>`, add:

```tsx
      {/* Reviews Section */}
      <ReviewSection
        productId={product.id}
        reviews={reviews}
        totalReviews={totalApprovedReviews}
        eligibility={eligibility}
      />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/product/review-section.tsx src/app/\[locale\]/\(shop\)/shop/\[slug\]/page.tsx
git commit -m "feat(reviews): add ReviewSection and integrate reviews into product page"
```

---

### Task 14: Extend ProductJsonLd for SEO

**Files:**
- Modify: `src/components/product/product-jsonld.tsx`

- [ ] **Step 1: Extend the component to include review data**

Replace the entire file content with:

```tsx
import type { Product, ReviewStats } from "@/types";
import { getPartialName } from "@/lib/review-utils";

interface ReviewData {
  displayName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductJsonLdProps {
  product: Product;
  locale: string;
  reviewStats?: ReviewStats;
  reviews?: ReviewData[];
}

export function ProductJsonLd({
  product,
  locale,
  reviewStats,
  reviews,
}: ProductJsonLdProps) {
  const name =
    product.name[locale as keyof typeof product.name] || product.name.en || "";
  const description =
    product.description[locale as keyof typeof product.description] ||
    product.description.en ||
    "";
  const totalStock = Object.values(product.stock).reduce((sum, s) => sum + s, 0);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: product.images,
    description,
    brand: {
      "@type": "Brand",
      name: "Zeron",
    },
    offers: {
      "@type": "Offer",
      price: (product.basePrice / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  // Add aggregate rating if reviews exist
  if (reviewStats && reviewStats.totalReviews > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewStats.averageRating,
      reviewCount: reviewStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add individual reviews
  if (reviews && reviews.length > 0) {
    jsonLd.review = reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: getPartialName(r.displayName),
      },
      datePublished: r.createdAt.split("T")[0],
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
      },
      reviewBody: r.comment,
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

- [ ] **Step 2: Update ProductJsonLd usage in the product page**

In `src/app/[locale]/(shop)/shop/[slug]/page.tsx`, update the `<ProductJsonLd>` call to pass the new props:

```tsx
      <ProductJsonLd
        product={product}
        locale={locale}
        reviewStats={product.reviewStats}
        reviews={reviews}
      />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/product/product-jsonld.tsx src/app/\[locale\]/\(shop\)/shop/\[slug\]/page.tsx
git commit -m "feat(reviews): extend ProductJsonLd with AggregateRating and Review structured data"
```

---

## Chunk 3: Admin Backoffice

### Task 15: Add Reviews link to admin sidebar

**Files:**
- Modify: `src/components/admin/admin-sidebar.tsx`

- [ ] **Step 1: Add the Reviews nav link**

Import `Star` from lucide-react (add to the import list).

Add this entry to the `navLinks` array after the "Orders" entry:

```typescript
  { href: "/zr-ops/reviews", label: "Reviews", icon: Star },
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-sidebar.tsx
git commit -m "feat(reviews): add Reviews link to admin sidebar navigation"
```

---

### Task 16: Create admin reviews page and list component

**Files:**
- Create: `src/app/zr-ops/reviews/page.tsx`
- Create: `src/components/admin/reviews/reviews-list.tsx`

- [ ] **Step 1: Create the admin reviews page**

```tsx
import { AdminHeader } from "@/components/admin/admin-header";
import { ReviewsList } from "@/components/admin/reviews/reviews-list";

export default function ReviewsPage() {
  return (
    <>
      <AdminHeader title="Reviews" />
      <div className="p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">Reviews</h2>
        <ReviewsList />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create the ReviewsList component**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, X, Eye } from "lucide-react";
import { StarRating } from "@/components/product/star-rating";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  displayName: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-success/20 text-success";
    case "pending":
      return "bg-warning/20 text-warning";
    case "rejected":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted/20 text-muted";
  }
}

export function ReviewsList() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "approved" | "rejected";
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function openConfirm(id: string, status: "approved" | "rejected") {
    setConfirmAction({ id, status });
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setConfirmLoading(true);

    try {
      const res = await fetch(`/api/admin/reviews/${confirmAction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirmAction.status }),
      });

      if (res.ok) {
        toast(
          confirmAction.status === "approved"
            ? "Review approved"
            : "Review rejected",
          "success"
        );
        fetchReviews();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update review", "error");
      }
    } catch {
      toast("Failed to update review", "error");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  }

  const statusFilters = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  return (
    <div>
      {/* Status filter tabs */}
      <div className="mb-4 flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-accent text-background"
                : "border border-border text-muted hover:bg-surface hover:text-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Product
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                User
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Rating
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Comment
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Date
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                  Loading...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-b border-border transition-colors hover:bg-surface/50"
                >
                  <td className="max-w-[200px] truncate px-6 py-4 text-sm text-accent">
                    {review.productName}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {review.displayName || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StarRating rating={review.rating} size="sm" />
                  </td>
                  <td className="max-w-[300px] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm text-muted">
                        {expandedId === review.id
                          ? review.comment
                          : review.comment.length > 60
                          ? `${review.comment.slice(0, 60)}...`
                          : review.comment}
                      </p>
                      {review.comment.length > 60 && (
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === review.id ? null : review.id
                            )
                          }
                          className="shrink-0 rounded-md p-1 text-muted transition-colors hover:text-accent"
                          title="Toggle full comment"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {review.createdAt ? formatDate(review.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                        review.status
                      )}`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {review.status !== "approved" && (
                        <button
                          onClick={() => openConfirm(review.id, "approved")}
                          className="flex items-center gap-1 rounded-lg bg-success/20 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/30"
                          title="Approve"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      {review.status !== "rejected" && (
                        <button
                          onClick={() => openConfirm(review.id, "rejected")}
                          className="flex items-center gap-1 rounded-lg bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/30"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of{" "}
            {total} reviews
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-sm text-muted transition-colors hover:text-accent disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="flex items-center px-3 text-sm text-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-sm text-muted transition-colors hover:text-accent disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirm}
        title={
          confirmAction?.status === "approved"
            ? "Approve Review"
            : "Reject Review"
        }
        message={
          confirmAction?.status === "approved"
            ? "This review will become publicly visible on the product page."
            : "This review will be hidden from the product page."
        }
        confirmText={
          confirmAction?.status === "approved" ? "Approve" : "Reject"
        }
        variant={
          confirmAction?.status === "rejected" ? "destructive" : "default"
        }
        loading={confirmLoading}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/zr-ops/reviews/page.tsx src/components/admin/reviews/reviews-list.tsx
git commit -m "feat(reviews): add admin reviews page with moderation table"
```

---

### Task 17: Final verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Run Next.js build to verify everything compiles**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(reviews): address build issues from final verification"
```

(Only if fixes were needed — skip if build passes clean.)
