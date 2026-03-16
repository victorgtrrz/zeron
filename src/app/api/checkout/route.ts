import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe";
import { validatePromoCode, getAutoPromotion, calculateDiscount } from "@/lib/promotions";
import type { CartItem, Product } from "@/types";

interface CheckoutBody {
  items: { productId: string; size: string; quantity: number }[];
  shippingAddress: {
    recipientName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  promotionCodes: string[];
  visitorId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();
    const { items: requestItems, shippingAddress, promotionCodes, visitorId } = body;

    if (!requestItems?.length || !shippingAddress || !visitorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch authoritative product data and validate stock
    const lineItems: CartItem[] = [];
    for (const item of requestItems) {
      const productDoc = await adminDb
        .collection("products")
        .doc(item.productId)
        .get();
      const productData = productDoc.data() as Product | undefined;

      if (!productData) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      if (productData.status !== "active") {
        return NextResponse.json(
          { error: `Product "${productData.name.en}" is not available` },
          { status: 400 }
        );
      }

      const stockForSize = productData.stock?.[item.size] ?? 0;
      if (stockForSize < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${productData.name.en}" size ${item.size}. Available: ${stockForSize}`,
          },
          { status: 400 }
        );
      }

      lineItems.push({
        productId: item.productId,
        name: productData.name.en,
        size: item.size,
        quantity: item.quantity,
        unitPrice: productData.basePrice,
        image: productData.images?.[0] ?? "",
      });
    }

    // Calculate subtotal from authoritative prices
    const subtotal = lineItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );

    // Fetch shipping settings
    const settingsDoc = await adminDb
      .collection("settings")
      .doc("general")
      .get();
    const settingsData = settingsDoc.data();
    const flatRateShipping = settingsData?.flatRateShipping ?? 999;
    const currency = settingsData?.currency ?? "usd";

    // Validate manual promotions
    let manualDiscount = 0;
    const validatedPromoCodes: string[] = [];
    for (const code of promotionCodes ?? []) {
      const result = await validatePromoCode(code, lineItems, subtotal);
      if (result.valid) {
        manualDiscount += result.discount;
        validatedPromoCodes.push(code);
      }
    }

    // Check auto promotions
    const autoResult = await getAutoPromotion(lineItems, subtotal);
    const autoDiscount = autoResult.discount;

    // Determine if free shipping applies
    let isFreeShipping = false;
    if (manualDiscount === 0) {
      // check if the manual promo was free_shipping type
    }
    // Re-check: iterate promos for free_shipping
    for (const code of validatedPromoCodes) {
      const r = await validatePromoCode(code, lineItems, subtotal);
      if (r.valid && r.promotion.type === "free_shipping") {
        isFreeShipping = true;
      }
    }
    if (autoResult.promotion?.type === "free_shipping") {
      isFreeShipping = true;
    }

    const effectiveShipping = isFreeShipping ? 0 : flatRateShipping;
    const totalDiscount = manualDiscount + autoDiscount;
    const total = Math.max(0, subtotal - totalDiscount + effectiveShipping);

    // Build Stripe line items
    const stripeLineItems = lineItems.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: `${item.name} (${item.size})`,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: item.unitPrice,
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if not free
    if (effectiveShipping > 0) {
      stripeLineItems.push({
        price_data: {
          currency,
          product_data: {
            name: "Shipping",
            images: undefined,
          },
          unit_amount: effectiveShipping,
        },
        quantity: 1,
      });
    }

    // Add discount as a coupon if there is one
    const discounts: { coupon: string }[] = [];
    if (totalDiscount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: totalDiscount,
        currency,
        duration: "once",
        name: validatedPromoCodes.length > 0
          ? `Promo: ${validatedPromoCodes.join(", ")}`
          : "Auto discount",
      });
      discounts.push({ coupon: coupon.id });
    }

    // Determine the origin for success/cancel URLs
    const origin =
      request.headers.get("origin") ??
      request.headers.get("referer")?.replace(/\/[^/]*$/, "") ??
      "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: stripeLineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      success_url: `${origin}/en/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/en/cart`,
      metadata: {
        visitorId,
        promotionCodes: JSON.stringify(validatedPromoCodes),
        autoPromotionId: autoResult.promotion?.id ?? "",
        shippingAddress: JSON.stringify(shippingAddress),
        items: JSON.stringify(
          lineItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            size: i.size,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            image: i.image,
          }))
        ),
        subtotal: String(subtotal),
        shipping: String(effectiveShipping),
        discount: String(totalDiscount),
        total: String(total),
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
