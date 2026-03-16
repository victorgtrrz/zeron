"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CategoryRevenueData {
  categoryId: string;
  categoryName: string;
  revenue: number;
}

interface CategoryRevenueProps {
  data: CategoryRevenueData[];
}

const COLORS = [
  "#E5E5E5",
  "#6B6B6B",
  "#A0A0A0",
  "#8B8B8B",
  "#C4C4C4",
  "#555555",
  "#D1D1D1",
  "#787878",
];

function formatCurrency(value: number): string {
  return `$${(value / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: CategoryRevenueData & { percent: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-muted">{payload[0].name}</p>
      <p className="text-sm font-medium text-accent">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

interface LegendPayloadItem {
  value: string;
  color?: string;
}

function CustomLegend({ payload, data }: { payload?: LegendPayloadItem[]; data: CategoryRevenueData[] }) {
  if (!payload) return null;

  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
      {payload.map((entry, index) => {
        const item = data[index];
        const pct = total > 0 ? ((item?.revenue || 0) / total * 100).toFixed(1) : "0";
        return (
          <li key={index} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.value} ({pct}%)
          </li>
        );
      })}
    </ul>
  );
}

export function CategoryRevenue({ data }: CategoryRevenueProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-lg font-bold font-heading text-accent">
        Revenue by Category
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="categoryName"
            cx="50%"
            cy="45%"
            outerRadius={90}
            innerRadius={50}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend data={data} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
