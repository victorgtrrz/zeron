import { ProductCard } from "@/components/product/product-card";
import type { Product, Locale } from "@/types";

interface ProductGridProps {
  products: Product[];
  locale: Locale;
  categorySlug?: string;
}

export function ProductGrid({ products, locale, categorySlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-20 text-center">
        <p className="text-lg text-muted">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          categorySlug={categorySlug}
        />
      ))}
    </div>
  );
}
