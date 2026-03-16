import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

function getDateRange(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date; days: number } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let days: number;
  switch (period) {
    case "90d":
      days = 90;
      break;
    case "30d":
      days = 30;
      break;
    case "7d":
    default:
      days = 7;
      break;
  }

  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days + 1);
  prevStart.setHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd, days };
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "object" && "toDate" in val && typeof (val as Record<string, unknown>).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof val === "string") return new Date(val);
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const { start, end, prevStart, prevEnd, days } = getDateRange(period);

    // Fetch orders for current and previous period
    const allOrdersSnapshot = await adminDb
      .collection("orders")
      .where("createdAt", ">=", prevStart)
      .where("createdAt", "<=", end)
      .get();

    const currentOrders: Array<Record<string, unknown>> = [];
    const prevOrders: Array<Record<string, unknown>> = [];

    allOrdersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const createdAt = toDate(data.createdAt);
      if (!createdAt) return;

      const order = { id: doc.id, ...data, createdAt };

      if (createdAt >= start && createdAt <= end) {
        currentOrders.push(order);
      } else if (createdAt >= prevStart && createdAt <= prevEnd) {
        prevOrders.push(order);
      }
    });

    // Revenue per day
    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};

    // Initialize all days in range
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = formatDate(d);
      revenueByDay[key] = 0;
      ordersByDay[key] = 0;
    }

    currentOrders.forEach((order) => {
      const createdAt = order.createdAt as Date;
      const key = formatDate(createdAt);
      const total = (order.total as number) || 0;
      revenueByDay[key] = (revenueByDay[key] || 0) + total;
      ordersByDay[key] = (ordersByDay[key] || 0) + 1;
    });

    const revenuePerDay = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    const ordersPerDay = Object.entries(ordersByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Previous period revenue per day (for comparison line)
    const prevRevenueByDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(prevStart);
      d.setDate(d.getDate() + i);
      const key = formatDate(d);
      prevRevenueByDay[key] = 0;
    }

    prevOrders.forEach((order) => {
      const createdAt = order.createdAt as Date;
      const key = formatDate(createdAt);
      const total = (order.total as number) || 0;
      prevRevenueByDay[key] = (prevRevenueByDay[key] || 0) + total;
    });

    const prevRevenuePerDay = Object.entries(prevRevenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // Top 10 products by units sold
    const productUnits: Record<string, { productId: string; name: string; quantity: number }> = {};

    currentOrders.forEach((order) => {
      const items = (order.items as Array<{ productId: string; name: string; quantity: number }>) || [];
      items.forEach((item) => {
        if (!productUnits[item.productId]) {
          productUnits[item.productId] = {
            productId: item.productId,
            name: item.name,
            quantity: 0,
          };
        }
        productUnits[item.productId].quantity += item.quantity || 0;
      });
    });

    const topProducts = Object.values(productUnits)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Revenue per category
    const categoryIds = new Set<string>();
    const categoryRevenue: Record<string, number> = {};

    // Get product category mappings
    const productIds = new Set<string>();
    currentOrders.forEach((order) => {
      const items = (order.items as Array<{ productId: string }>) || [];
      items.forEach((item) => productIds.add(item.productId));
    });

    const productCategoryMap: Record<string, string> = {};
    if (productIds.size > 0) {
      const productIdArray = Array.from(productIds);
      // Fetch in batches of 30 (Firestore 'in' limit)
      for (let i = 0; i < productIdArray.length; i += 30) {
        const batch = productIdArray.slice(i, i + 30);
        const productDocs = await adminDb
          .collection("products")
          .where("__name__", "in", batch)
          .get();

        productDocs.docs.forEach((doc) => {
          const data = doc.data();
          productCategoryMap[doc.id] = data.categoryId || "uncategorized";
          categoryIds.add(data.categoryId || "uncategorized");
        });
      }
    }

    currentOrders.forEach((order) => {
      const items = (order.items as Array<{ productId: string; unitPrice: number; quantity: number }>) || [];
      items.forEach((item) => {
        const catId = productCategoryMap[item.productId] || "uncategorized";
        categoryRevenue[catId] = (categoryRevenue[catId] || 0) + (item.unitPrice * item.quantity);
      });
    });

    // Fetch category names
    const categoryNames: Record<string, string> = {};
    const catIdArray = Array.from(categoryIds).filter((id) => id !== "uncategorized");
    if (catIdArray.length > 0) {
      for (let i = 0; i < catIdArray.length; i += 30) {
        const batch = catIdArray.slice(i, i + 30);
        const catDocs = await adminDb
          .collection("categories")
          .where("__name__", "in", batch)
          .get();

        catDocs.docs.forEach((doc) => {
          const data = doc.data();
          categoryNames[doc.id] = data.name?.en || doc.id;
        });
      }
    }
    categoryNames["uncategorized"] = "Uncategorized";

    const revenueByCategory = Object.entries(categoryRevenue).map(([catId, revenue]) => ({
      categoryId: catId,
      categoryName: categoryNames[catId] || catId,
      revenue,
    }));

    // Country distribution
    const countryDistribution: Record<string, number> = {};
    currentOrders.forEach((order) => {
      const address = order.shippingAddress as { country?: string } | undefined;
      const country = address?.country || "Unknown";
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    });

    const geoData = Object.entries(countryDistribution)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Registered users count
    const usersSnapshot = await adminDb.collection("users").count().get();
    const registeredUsers = usersSnapshot.data().count;

    // Carts count for conversion rate
    const cartsSnapshot = await adminDb.collection("carts").count().get();
    const totalCarts = cartsSnapshot.data().count;

    const conversionRate = totalCarts > 0
      ? (currentOrders.length / totalCarts) * 100
      : 0;

    // Abandoned carts: carts with items but updatedAt > 24h ago and no matching order
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const abandonedCartsSnapshot = await adminDb
      .collection("carts")
      .where("updatedAt", "<", twentyFourHoursAgo)
      .get();

    // Get all order userIds for matching
    const orderUserIds = new Set<string>();
    const recentOrdersSnapshot = await adminDb.collection("orders").get();
    recentOrdersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.userId) orderUserIds.add(data.userId);
    });

    let abandonedCarts = 0;
    abandonedCartsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const items = data.items as Array<unknown> | undefined;
      if (items && items.length > 0) {
        // Count as abandoned if the cart user doesn't have a recent order
        // or if it's an anonymous cart
        if (!data.userId || !orderUserIds.has(data.userId)) {
          abandonedCarts++;
        }
      }
    });

    // Period comparison
    const currentRevenue = currentOrders.reduce(
      (sum, o) => sum + ((o.total as number) || 0),
      0
    );
    const prevRevenue = prevOrders.reduce(
      (sum, o) => sum + ((o.total as number) || 0),
      0
    );
    const currentOrderCount = currentOrders.length;
    const prevOrderCount = prevOrders.length;

    // Previous period users and carts for comparison
    const prevConversionRate = totalCarts > 0
      ? (prevOrderCount / totalCarts) * 100
      : 0;

    return NextResponse.json({
      revenuePerDay,
      prevRevenuePerDay,
      ordersPerDay,
      topProducts,
      revenueByCategory,
      geoData,
      registeredUsers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      abandonedCarts,
      periodComparison: {
        current: {
          revenue: currentRevenue,
          orders: currentOrderCount,
        },
        previous: {
          revenue: prevRevenue,
          orders: prevOrderCount,
        },
        revenueChange:
          prevRevenue > 0
            ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 10000) / 100
            : currentRevenue > 0
            ? 100
            : 0,
        ordersChange:
          prevOrderCount > 0
            ? Math.round(((currentOrderCount - prevOrderCount) / prevOrderCount) * 10000) / 100
            : currentOrderCount > 0
            ? 100
            : 0,
      },
      prevConversionRate: Math.round(prevConversionRate * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
