"use client";

import { TrendingUp, TrendingDown, ShoppingCart, Users, BarChart3 } from "lucide-react";

interface ConversionStatsProps {
  conversionRate: number;
  prevConversionRate: number;
  abandonedCarts: number;
  registeredUsers: number;
  periodComparison: {
    current: { revenue: number; orders: number };
    previous: { revenue: number; orders: number };
    revenueChange: number;
    ordersChange: number;
  };
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined && change !== 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-muted">
          {icon}
        </div>
      </div>
      <p className="mb-1 text-2xl font-bold text-accent">{value}</p>
      {hasChange && (
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span
            className={`text-xs font-medium ${
              isPositive ? "text-success" : "text-destructive"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(1)}% vs prev period
          </span>
        </div>
      )}
      {!hasChange && change === 0 && (
        <p className="text-xs text-muted">No change vs prev period</p>
      )}
    </div>
  );
}

export function ConversionStats({
  conversionRate,
  prevConversionRate,
  abandonedCarts,
  registeredUsers,
  periodComparison,
}: ConversionStatsProps) {
  const conversionChange =
    prevConversionRate > 0
      ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100
      : conversionRate > 0
      ? 100
      : 0;

  return (
    <div className="space-y-4">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(periodComparison.current.revenue)}
        change={periodComparison.revenueChange}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <StatCard
        title="Total Orders"
        value={periodComparison.current.orders.toLocaleString()}
        change={periodComparison.ordersChange}
        icon={<ShoppingCart className="h-4 w-4" />}
      />
      <StatCard
        title="Conversion Rate"
        value={`${conversionRate.toFixed(2)}%`}
        change={Math.round(conversionChange * 10) / 10}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Abandoned Carts"
        value={abandonedCarts.toLocaleString()}
        icon={<ShoppingCart className="h-4 w-4" />}
      />
      <StatCard
        title="Registered Users"
        value={registeredUsers.toLocaleString()}
        icon={<Users className="h-4 w-4" />}
      />
    </div>
  );
}
