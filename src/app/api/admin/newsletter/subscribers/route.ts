import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const collection = adminDb.collection("newsletter_subscribers");

    // Get total count
    const countSnap = await collection.count().get();
    const total = countSnap.data().count;
    const totalPages = Math.ceil(total / limit);

    // Get paginated results ordered by subscribedAt descending
    const offset = (page - 1) * limit;
    const snap = await collection
      .orderBy("subscribedAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    const subscribers = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        locale: data.locale,
        subscribedAt: data.subscribedAt?.toDate?.()?.toISOString() ?? null,
        unsubscribedAt: data.unsubscribedAt?.toDate?.()?.toISOString() ?? null,
        source: data.source,
      };
    });

    return NextResponse.json({
      subscribers,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
