import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/promotions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, items, subtotal } = body;

    if (!code || !items || subtotal === undefined) {
      return NextResponse.json(
        { valid: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await validatePromoCode(code, items, subtotal);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Server error validating promo code" },
      { status: 500 }
    );
  }
}
