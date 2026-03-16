"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

const SORT_OPTIONS = [
  { value: "newest", labelKey: "sortNewest" },
  { value: "price-asc", labelKey: "sortPriceLow" },
  { value: "price-desc", labelKey: "sortPriceHigh" },
  { value: "name-asc", labelKey: "sortNameAz" },
] as const;

export function SortSelect() {
  const t = useTranslations("product");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "newest";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/shop${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-muted whitespace-nowrap">
        {t("sortBy")}
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-accent focus:border-accent focus:outline-none disabled:opacity-50"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
