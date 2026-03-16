"use client";

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

const periods = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
      {periods.map((period) => (
        <button
          key={period.key}
          onClick={() => onChange(period.key)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === period.key
              ? "bg-accent text-background"
              : "text-muted hover:text-accent"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
