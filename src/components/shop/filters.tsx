"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import { getCategories } from "@/lib/firebase/firestore";
import type { Category, Locale } from "@/types";
import { useLocale } from "next-intl";

const SIZES = ["S", "M", "L", "XL"];

export function Filters() {
  const t = useTranslations("product");
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Local filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") ?? ""
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get("sizes")?.split(",").filter(Boolean) ?? []
  );
  const [minPrice, setMinPrice] = useState<string>(
    searchParams.get("minPrice") ?? ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    searchParams.get("maxPrice") ?? ""
  );

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","));
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    // Preserve sort
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);

    const qs = params.toString();
    startTransition(() => {
      router.push(`/shop${qs ? `?${qs}` : ""}`);
    });
    setIsOpen(false);
  }

  function clearFilters() {
    setSelectedCategory("");
    setSelectedSizes([]);
    setMinPrice("");
    setMaxPrice("");

    const sort = searchParams.get("sort");
    startTransition(() => {
      router.push(`/shop${sort ? `?sort=${sort}` : ""}`);
    });
    setIsOpen(false);
  }

  const hasFilters =
    selectedCategory !== "" ||
    selectedSizes.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "";

  const filterContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent">
          {t("allCategories")}
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-accent"
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.id}
                onChange={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? "" : cat.id
                  )
                }
                className="accent-accent"
              />
              {cat.name[locale] || cat.name.en}
            </label>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent">
          {t("size")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`min-w-10 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedSizes.includes(size)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent">
          {t("priceRange")}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("filters")}
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-20 rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-accent">
            <SlidersHorizontal className="h-5 w-5" />
            {t("filters")}
          </h2>
          {filterContent}
        </div>
      </aside>

      {/* Mobile toggle */}
      <div className="mb-4 md:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-background"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters")}
          {hasFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-background">
              !
            </span>
          )}
        </button>
      </div>

      {/* Mobile overlay panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-6 animate-slide-down">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-accent">
                <SlidersHorizontal className="h-5 w-5" />
                {t("filters")}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-2 text-muted hover:text-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
