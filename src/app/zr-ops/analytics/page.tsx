"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PeriodSelector } from "@/components/admin/analytics/period-selector";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { OrdersChart } from "@/components/admin/analytics/orders-chart";
import { TopProducts } from "@/components/admin/analytics/top-products";
import { CategoryRevenue } from "@/components/admin/analytics/category-revenue";
import { GeoChart } from "@/components/admin/analytics/geo-chart";
import { ConversionStats } from "@/components/admin/analytics/conversion-stats";

interface AnalyticsData {
  revenuePerDay: Array<{ date: string; revenue: number }>;
  prevRevenuePerDay: Array<{ date: string; revenue: number }>;
  ordersPerDay: Array<{ date: string; count: number }>;
  topProducts: Array<{ productId: string; name: string; quantity: number }>;
  revenueByCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
  }>;
  geoData: Array<{ country: string; count: number }>;
  registeredUsers: number;
  conversionRate: number;
  abandonedCarts: number;
  periodComparison: {
    current: { revenue: number; orders: number };
    previous: { revenue: number; orders: number };
    revenueChange: number;
    ordersChange: number;
  };
  prevConversionRate: number;
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-border bg-surface p-6 ${className}`}
    >
      <div className="mb-4 h-5 w-40 rounded bg-border" />
      <div className="h-[260px] rounded bg-border/50" />
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-border" />
        <div className="h-8 w-8 rounded-lg bg-border" />
      </div>
      <div className="mb-2 h-7 w-20 rounded bg-border" />
      <div className="h-3 w-32 rounded bg-border" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  return (
    <>
      <AdminHeader title="Analytics" />
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold font-heading">Analytics</h2>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SkeletonCard />
              </div>
              <div className="space-y-4">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Revenue Chart - Full Width */}
            <RevenueChart
              data={data.revenuePerDay}
              prevData={data.prevRevenuePerDay}
            />

            {/* Orders + Conversion Stats - 2 cols */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <OrdersChart data={data.ordersPerDay} />
              </div>
              <ConversionStats
                conversionRate={data.conversionRate}
                prevConversionRate={data.prevConversionRate}
                abandonedCarts={data.abandonedCarts}
                registeredUsers={data.registeredUsers}
                periodComparison={data.periodComparison}
              />
            </div>

            {/* Top Products + Category Revenue - 2 cols */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TopProducts data={data.topProducts} />
              <CategoryRevenue data={data.revenueByCategory} />
            </div>

            {/* Geo Chart - Full Width */}
            <GeoChart data={data.geoData} />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center text-muted">
            Failed to load analytics data. Please try again.
          </div>
        )}
      </div>
    </>
  );
}
