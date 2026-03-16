import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection("promotions")
      .orderBy("startDate", "desc")
      .get();

    const promotions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate:
          data.startDate && typeof data.startDate.toDate === "function"
            ? data.startDate.toDate().toISOString()
            : data.startDate,
        endDate:
          data.endDate && typeof data.endDate.toDate === "function"
            ? data.endDate.toDate().toISOString()
            : data.endDate,
      };
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const {
      applyMode,
      code,
      type,
      value,
      minOrderAmount,
      applicableCategories,
      banner,
      showBanner,
      startDate,
      endDate,
      maxUses,
      active,
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Promotion type is required" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    // Validate code uniqueness for manual promos
    if (applyMode === "manual") {
      if (!code || !code.trim()) {
        return NextResponse.json(
          { error: "Code is required for manual promotions" },
          { status: 400 }
        );
      }

      const upperCode = code.trim().toUpperCase();
      const existing = await adminDb
        .collection("promotions")
        .where("code", "==", upperCode)
        .get();

      if (!existing.empty) {
        return NextResponse.json(
          { error: "A promotion with this code already exists" },
          { status: 409 }
        );
      }
    }

    const promotionData = {
      applyMode: applyMode || "manual",
      code: applyMode === "manual" ? (code?.trim().toUpperCase() || null) : null,
      type,
      value: typeof value === "number" ? value : 0,
      minOrderAmount:
        minOrderAmount !== null && minOrderAmount !== undefined
          ? minOrderAmount
          : null,
      applicableCategories:
        applicableCategories && applicableCategories.length > 0
          ? applicableCategories
          : null,
      banner: banner || null,
      showBanner: showBanner || false,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxUses: maxUses !== null && maxUses !== undefined ? maxUses : null,
      currentUses: 0,
      active: active !== undefined ? active : true,
    };

    const docRef = await adminDb.collection("promotions").add(promotionData);

    return NextResponse.json(
      {
        id: docRef.id,
        ...promotionData,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating promotion:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    );
  }
}
