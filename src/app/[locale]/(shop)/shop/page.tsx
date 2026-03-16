import { setRequestLocale, getTranslations } from "next-intl/server";
import { getProducts, getCategories, getCategoryBySlug } from "@/lib/firebase/firestore";
import { ProductGrid } from "@/components/shop/product-grid";
import { Filters } from "@/components/shop/filters";
import { SortSelect } from "@/components/shop/sort-select";
import type { Locale } from "@/types";
import type { ProductFilters } from "@/lib/firebase/firestore";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("shop")} — ZERON`,
    description: "Browse the full Zeron streetwear collection.",
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const categoryFilter = typeof sp.category === "string" ? sp.category : undefined;
  const sizesFilter = typeof sp.sizes === "string" ? sp.sizes.split(",").filter(Boolean) : undefined;
  const minPriceStr = typeof sp.minPrice === "string" ? sp.minPrice : undefined;
  const maxPriceStr = typeof sp.maxPrice === "string" ? sp.maxPrice : undefined;
  const sortParam = typeof sp.sort === "string" ? sp.sort : undefined;

  const filters: ProductFilters = {
    status: "active",
  };

  if (categoryFilter) {
    filters.categoryId = categoryFilter;
  }

  if (sortParam === "price-asc" || sortParam === "price-desc" || sortParam === "name-asc" || sortParam === "newest") {
    filters.sort = sortParam;
  }

  let products = await getProducts(filters);

  // Client-side filtering for sizes and price (Firestore doesn't support these compound queries easily)
  if (sizesFilter && sizesFilter.length > 0) {
    products = products.filter((p) =>
      sizesFilter.some((size) => p.sizes.includes(size) && (p.stock[size] ?? 0) > 0)
    );
  }

  if (minPriceStr) {
    const minCents = Math.round(parseFloat(minPriceStr) * 100);
    if (!isNaN(minCents)) {
      products = products.filter((p) => p.basePrice >= minCents);
    }
  }

  if (maxPriceStr) {
    const maxCents = Math.round(parseFloat(maxPriceStr) * 100);
    if (!isNaN(maxCents)) {
      products = products.filter((p) => p.basePrice <= maxCents);
    }
  }

  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight text-accent md:text-4xl">
        {t("shop")}
      </h1>

      <div className="flex gap-8">
        <Filters />
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
            <SortSelect />
          </div>
          <ProductGrid
            products={products}
            locale={locale as Locale}
          />
        </div>
      </div>
    </section>
  );
}
