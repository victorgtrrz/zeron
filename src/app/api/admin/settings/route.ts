import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const doc = await adminDb.collection("settings").doc("general").get();

    if (!doc.exists) {
      // Return defaults if no settings exist
      return NextResponse.json({
        flatRateShipping: 999, // $9.99 in cents
        currency: "USD",
        defaultLocale: "es",
      });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const { flatRateShipping, defaultLocale } = body;

    const updateData: Record<string, unknown> = {
      currency: "USD", // Always USD
    };

    if (flatRateShipping !== undefined) {
      if (typeof flatRateShipping !== "number" || flatRateShipping < 0) {
        return NextResponse.json(
          { error: "Invalid shipping amount" },
          { status: 400 }
        );
      }
      updateData.flatRateShipping = flatRateShipping;
    }

    if (defaultLocale !== undefined) {
      const validLocales = ["es", "en", "zh-HK"];
      if (!validLocales.includes(defaultLocale)) {
        return NextResponse.json(
          { error: "Invalid locale" },
          { status: 400 }
        );
      }
      updateData.defaultLocale = defaultLocale;
    }

    await adminDb.collection("settings").doc("general").set(updateData, { merge: true });

    const updated = await adminDb.collection("settings").doc("general").get();

    return NextResponse.json(updated.data());
  } catch (error) {
    console.error("Error updating settings:", error);
    if (
      error instanceof Error &&
      (error.message.includes("admin") || error.message.includes("session"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
