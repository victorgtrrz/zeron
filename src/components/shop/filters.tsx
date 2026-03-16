"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
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

  // Sync local state when URL changes externally (e.g. back/forward navigation)
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") ?? "");
    setSelectedSizes(searchParams.get("sizes")?.split(",").filter(Boolean) ?? []);
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
  }, [searchParams]);

  const navigate = useCallback(
    (overrides: {
      category?: string;
      sizes?: string[];
      min?: string;
      max?: string;
    }) => {
      const cat = overrides.category ?? selectedCategory;
      const sizes = overrides.sizes ?? selectedSizes;
      const min = overrides.min ?? minPrice;
      const max = overrides.max ?? maxPrice;

      const params = new URLSearchParams();
      if (cat) params.set("category", cat);
      if (sizes.length > 0) params.set("sizes", sizes.join(","));
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);

      const sort = searchParams.get("sort");
      if (sort) params.set("sort", sort);

      const qs = params.toString();
      startTransition(() => {
        router.push(`/shop${qs ? `?${qs}` : ""}`);
      });
    },
    [selectedCategory, selectedSizes, minPrice, maxPrice, searchParams, router, startTransition]
  );

  function selectCategory(slug: string) {
    if (selectedCategory === slug) return;
    setSelectedCategory(slug);
    navigate({ category: slug });
  }

  function toggleSize(size: string) {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(next);
    navigate({ sizes: next });
  }

  function handlePriceBlur() {
    navigate({ min: minPrice, max: maxPrice });
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
        <div className="space-y-1">
          {categories.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.slug)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-muted hover:bg-surface hover:text-accent"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                    active
                      ? "border-highlight bg-highlight"
                      : "border-muted"
                  }`}
                >
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-background" />
                  )}
                </span>
                {cat.name[locale] || cat.name.en}
              </button>
            );
          })}
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
            onBlur={handlePriceBlur}
            onKeyDown={(e) => e.key === "Enter" && handlePriceBlur()}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={handlePriceBlur}
            onKeyDown={(e) => e.key === "Enter" && handlePriceBlur()}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-muted transition-colors hover:text-accent disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          {t("allCategories")}
        </button>
      )}
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
      <div className="mb-3 md:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
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
