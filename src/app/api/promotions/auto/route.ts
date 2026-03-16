import { NextRequest, NextResponse } from "next/server";
import { getAutoPromotion } from "@/lib/promotions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, subtotal } = body;

    if (!items || subtotal === undefined) {
      return NextResponse.json(
        { discount: 0, promotion: null },
        { status: 400 }
      );
    }

    const result = await getAutoPromotion(items, subtotal);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Auto promotion error:", error);
    return NextResponse.json(
      { discount: 0, promotion: null },
      { status: 500 }
    );
  }
}
