import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fulfillmentStatus = searchParams.get("fulfillmentStatus") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let query: FirebaseFirestore.Query = adminDb.collection("orders");

    if (fulfillmentStatus) {
      query = query.where("fulfillmentStatus", "==", fulfillmentStatus);
    }

    if (paymentStatus) {
      query = query.where("paymentStatus", "==", paymentStatus);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
        updatedAt:
          data.updatedAt && typeof data.updatedAt.toDate === "function"
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt,
      } as Record<string, unknown> & { id: string; createdAt: any; updatedAt: any };
    });

    // Client-side search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      orders = orders.filter((o) => {
        const orderId = (o.id as string).toLowerCase();
        const userId = ((o.userId as string) || "").toLowerCase();
        return orderId.includes(lowerSearch) || userId.includes(lowerSearch);
      });
    }

    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedOrders = orders.slice(start, start + limit);

    return NextResponse.json({
      orders: paginatedOrders,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
