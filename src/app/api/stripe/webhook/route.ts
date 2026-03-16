import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmation } from "@/lib/ses";
import { FieldValue } from "firebase-admin/firestore";
import type { Order, OrderItem } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutComplete(event.data.object as any);
        break;
      }
      case "charge.refunded": {
        await handleChargeRefunded(event.data.object as any);
        break;
      }
      default:
        // Unhandled event type — that's fine
        break;
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(
  session: Record<string, unknown>
) {
  const metadata = session.metadata as Record<string, string> | undefined;
  if (!metadata) {
    console.error("No metadata on checkout session");
    return;
  }

  const visitorId = metadata.visitorId;
  const promotionCodes: string[] = JSON.parse(
    metadata.promotionCodes || "[]"
  );
  const autoPromotionId = metadata.autoPromotionId || "";
  const shippingAddress = JSON.parse(metadata.shippingAddress || "{}");
  const items: OrderItem[] = JSON.parse(metadata.items || "[]");
  const subtotal = parseInt(metadata.subtotal || "0", 10);
  const shipping = parseInt(metadata.shipping || "0", 10);
  const discount = parseInt(metadata.discount || "0", 10);
  const total = parseInt(metadata.total || "0", 10);

  // Get customer email from session
  const customerEmail =
    (session.customer_details as Record<string, unknown>)?.email as string ??
    (session.customer_email as string) ??
    "";

  // Determine userId from cart
  let userId = "";
  if (visitorId) {
    const cartDoc = await adminDb.collection("carts").doc(visitorId).get();
    const cartData = cartDoc.data();
    userId = cartData?.userId ?? "";
  }

  // Create order in Firestore
  const orderRef = adminDb.collection("orders").doc();
  const orderData: Omit<Order, "id" | "createdAt" | "updatedAt"> & { createdAt: FirebaseFirestore.FieldValue; updatedAt: FirebaseFirestore.FieldValue } = {
    userId,
    items,
    subtotal,
    shipping,
    discount,
    total,
    paymentStatus: "paid",
    fulfillmentStatus: "processing",
    shippingAddress,
    stripeSessionId: session.id as string,
    promotionCodes,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await orderRef.set(orderData);

  // Decrement product stock per size
  for (const item of items) {
    const productRef = adminDb.collection("products").doc(item.productId);
    await productRef.update({
      [`stock.${item.size}`]: FieldValue.increment(-item.quantity),
    });
  }

  // Clear cart
  if (visitorId) {
    await adminDb.collection("carts").doc(visitorId).set({
      items: [],
      userId: userId || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Increment promo currentUses for manual promo codes
  for (const code of promotionCodes) {
    const promoSnap = await adminDb
      .collection("promotions")
      .where("code", "==", code)
      .limit(1)
      .get();
    if (!promoSnap.empty) {
      await promoSnap.docs[0].ref.update({
        currentUses: FieldValue.increment(1),
      });
    }
  }

  // Increment auto promotion currentUses
  if (autoPromotionId) {
    const autoPromoRef = adminDb
      .collection("promotions")
      .doc(autoPromotionId);
    await autoPromoRef.update({
      currentUses: FieldValue.increment(1),
    });
  }

  // Send confirmation email
  if (customerEmail) {
    try {
      const order: Order = {
        id: orderRef.id,
        userId,
        items,
        subtotal,
        shipping,
        discount,
        total,
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        shippingAddress,
        stripeSessionId: session.id as string,
        promotionCodes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await sendOrderConfirmation(customerEmail, order);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the webhook for email errors
    }
  }
}

async function handleChargeRefunded(charge: Record<string, unknown>) {
  const paymentIntent = charge.payment_intent as string;
  if (!paymentIntent) return;

  // Find orders by stripeSessionId — we need to look up the session from the payment intent
  // First, try to find the checkout session for this payment intent
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntent,
    limit: 1,
  });

  if (sessions.data.length === 0) return;

  const sessionId = sessions.data[0].id;

  // Find the order with this session ID
  const orderSnap = await adminDb
    .collection("orders")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();

  if (orderSnap.empty) return;

  await orderSnap.docs[0].ref.update({
    paymentStatus: "refunded",
    updatedAt: FieldValue.serverTimestamp(),
  });
}
