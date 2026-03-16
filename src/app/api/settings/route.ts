import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const doc = await adminDb.collection("settings").doc("general").get();
    const data = doc.data();

    if (!data) {
      return NextResponse.json({
        flatRateShipping: 999,
        currency: "usd",
      });
    }

    return NextResponse.json({
      flatRateShipping: data.flatRateShipping ?? 999,
      currency: data.currency ?? "usd",
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { flatRateShipping: 999, currency: "usd" },
      { status: 500 }
    );
  }
}
