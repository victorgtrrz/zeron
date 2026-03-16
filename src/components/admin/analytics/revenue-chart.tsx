"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  prevData?: RevenueDataPoint[];
}

function formatCurrency(value: number): string {
  return `$${(value / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateLabel(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-muted">{label ? formatDateLabel(label) : ""}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium text-accent">
          {entry.dataKey === "prevRevenue" ? "Previous: " : "Revenue: "}
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, prevData }: RevenueChartProps) {
  // Merge current and previous data by index position for comparison
  const merged = data.map((item, index) => ({
    date: item.date,
    revenue: item.revenue,
    prevRevenue: prevData?.[index]?.revenue ?? undefined,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-lg font-bold font-heading text-accent">
        Revenue Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={merged} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5E5E5" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#E5E5E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-muted)"
            opacity={0.2}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          {prevData && prevData.length > 0 && (
            <Area
              type="monotone"
              dataKey="prevRevenue"
              stroke="#6B6B6B"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="none"
              dot={false}
              name="Previous Period"
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#E5E5E5"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={false}
            name="Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
