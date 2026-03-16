import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts } from "@/lib/firebase/firestore";
import { ProductGrid } from "@/components/shop/product-grid";
import { Filters } from "@/components/shop/filters";
import { SortSelect } from "@/components/shop/sort-select";
import type { Locale } from "@/types";
import type { ProductFilters } from "@/lib/firebase/firestore";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: categorySlug } = await params;
  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) return { title: "Not Found — ZERON" };

  const name = cat.name[locale as Locale] || cat.name.en || categorySlug;

  return {
    title: `${name} — ZERON`,
    description: cat.description[locale as Locale] || cat.description.en || `Shop ${name} at Zeron.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, category: categorySlug } = await params;
  setRequestLocale(locale);

  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) notFound();

  const sp = await searchParams;
  const sizesFilter = typeof sp.sizes === "string" ? sp.sizes.split(",").filter(Boolean) : undefined;
  const minPriceStr = typeof sp.minPrice === "string" ? sp.minPrice : undefined;
  const maxPriceStr = typeof sp.maxPrice === "string" ? sp.maxPrice : undefined;
  const sortParam = typeof sp.sort === "string" ? sp.sort : undefined;

  const filters: ProductFilters = {
    status: "active",
    categoryId: cat.id,
  };

  if (sortParam === "price-asc" || sortParam === "price-desc" || sortParam === "name-asc" || sortParam === "newest") {
    filters.sort = sortParam;
  }

  let products = await getProducts(filters);

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

  const name = cat.name[locale as Locale] || cat.name.en || categorySlug;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight text-accent md:text-4xl">
        {name}
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
            categorySlug={categorySlug}
          />
        </div>
      </div>
    </section>
  );
}
