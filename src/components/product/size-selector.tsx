"use client";

import { useTranslations } from "next-intl";

interface SizeSelectorProps {
  sizes: string[];
  stock: Record<string, number>;
  selected: string | null;
  onSelect: (size: string) => void;
}

export function SizeSelector({ sizes, stock, selected, onSelect }: SizeSelectorProps) {
  const t = useTranslations("product");

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
        {t("size")}
      </h3>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const qty = stock[size] ?? 0;
          const isOut = qty === 0;
          const isSelected = selected === size;

          return (
            <button
              key={size}
              onClick={() => !isOut && onSelect(size)}
              disabled={isOut}
              className={`relative flex min-w-12 items-center justify-center rounded-lg border h-12 px-4 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-accent bg-accent/10 text-accent"
                  : isOut
                  ? "cursor-not-allowed border-border text-muted line-through opacity-50"
                  : "border-border text-accent hover:border-accent"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
      {selected && (stock[selected] ?? 0) > 0 && (
        <p className="mt-2 text-xs text-muted">
          {t("remaining", { count: stock[selected] })}
        </p>
      )}
    </div>
  );
}
