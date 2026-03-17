import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/chatbot-rate-limit";
import { invokeModel } from "@/lib/gemini";
import type { ChatbotKBEntry, Order } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { message, history } = (await request.json()) as {
      message: string;
      history: { role: string; content: string }[];
    };

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine user identity
    let userId: string | null = null;
    const sessionCookie = request.cookies.get("__session")?.value;

    if (sessionCookie) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        userId = decodedToken.uid;
      } catch {
        // Invalid token — treat as anonymous
      }
    }

    // Determine rate limit key
    const rateLimitKey = userId
      ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";

    const { allowed } = await checkRateLimit(rateLimitKey, !!userId);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch knowledge base entries
    const kbSnapshot = await adminDb
      .collection("chatbot_kb")
      .where("active", "==", true)
      .get();

    const kbEntries = kbSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatbotKBEntry[];

    const kbSections = kbEntries
      .map((entry) => `### ${entry.title} [${entry.category}]\n${entry.content}`)
      .join("\n\n");

    // Optionally fetch recent orders for authenticated users
    let orderContext = "";
    if (userId) {
      const ordersSnapshot = await adminDb
        .collection("orders")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (!ordersSnapshot.empty) {
        const orders = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        const orderLines = orders.map((order) => {
          const items = order.items
            .map((i) => `${i.name} (${i.size}) x${i.quantity}`)
            .join(", ");
          return `- Order #${order.id}: ${items} | Status: ${order.fulfillmentStatus} | Total: $${(order.total / 100).toFixed(2)}`;
        });

        orderContext =
          "\n\nThe customer's recent orders:\n" + orderLines.join("\n");
      }
    }

    // Build system prompt
    const systemPrompt =
      "You are Zeron's shopping assistant. Zeron is a streetwear clothing brand. You help customers find products, recommend sizes, check order status, and answer questions about store policies. Be friendly, concise, and on-brand with a streetwear vibe. Here is your knowledge base:\n\n" +
      kbSections +
      orderContext;

    // Build messages array
    const messages = [
      ...(history ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of invokeModel(messages, systemPrompt)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error("Gemini streaming error:", error);
          controller.enqueue(
            encoder.encode("Sorry, I encountered an error. Please try again.")
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chatbot API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
