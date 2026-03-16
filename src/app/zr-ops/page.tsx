import { adminDb } from "@/lib/firebase/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import {
  DollarSign,
  ShoppingCart,
  Clock,
  Users,
} from "lucide-react";
import type { Order } from "@/types";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch today's orders
  const todayOrdersSnap = await adminDb
    .collection("orders")
    .where("createdAt", ">=", todayStart)
    .get();

  const todayOrders = todayOrdersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (Order & { id: string })[];

  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayOrderCount = todayOrders.length;

  // Fetch pending orders count
  const pendingOrdersSnap = await adminDb
    .collection("orders")
    .where("fulfillmentStatus", "==", "processing")
    .get();

  const pendingOrdersCount = pendingOrdersSnap.size;

  // Fetch total registered users
  const usersSnap = await adminDb.collection("users").get();
  const totalUsers = usersSnap.size;

  // Fetch last 7 days of orders for chart
  const weekOrdersSnap = await adminDb
    .collection("orders")
    .where("createdAt", ">=", sevenDaysAgo)
    .orderBy("createdAt", "asc")
    .get();

  const weekOrders = weekOrdersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (Order & { id: string })[];

  // Aggregate by day
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const chartData: { day: string; revenue: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const dayLabel = dayNames[date.getDay()];

    const dayRevenue = weekOrders
      .filter((o) => {
        const orderDate =
          o.createdAt instanceof Date
            ? o.createdAt
            : typeof (o.createdAt as unknown as { toDate?: () => Date }).toDate === "function"
            ? (o.createdAt as unknown as { toDate: () => Date }).toDate()
            : new Date(o.createdAt as unknown as string);
        return orderDate >= date && orderDate < nextDate;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    chartData.push({ day: dayLabel, revenue: dayRevenue });
  }

  // Fetch recent 10 orders
  const recentOrdersSnap = await adminDb
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const recentOrders = recentOrdersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt:
        data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate()
          : data.createdAt,
      updatedAt:
        data.updatedAt && typeof data.updatedAt.toDate === "function"
          ? data.updatedAt.toDate()
          : data.updatedAt,
    };
  }) as Order[];

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="p-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Today's Revenue"
            value={`$${(todayRevenue / 100).toFixed(2)}`}
          />
          <StatCard
            icon={ShoppingCart}
            label="Today's Orders"
            value={String(todayOrderCount)}
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value={String(pendingOrdersCount)}
          />
          <StatCard
            icon={Users}
            label="Total Customers"
            value={String(totalUsers)}
          />
        </div>

        {/* Charts and Recent Orders */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SalesChart data={chartData} />
          <RecentOrders orders={recentOrders} />
        </div>
      </div>
    </>
  );
}
