"use client";

import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/product-card";
import type { Product, Locale } from "@/types";

interface RelatedProductsProps {
  products: Product[];
  locale: Locale;
}

export function RelatedProducts({ products, locale }: RelatedProductsProps) {
  const t = useTranslations("product");

  if (products.length === 0) return null;

  return (
    <section className="pt-12">
      {/* Section header */}
      <div className="mb-10 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <h2 className="font-heading text-2xl tracking-wider text-accent md:text-3xl">
          {t("relatedProducts")}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Mobile: horizontal scroll / Desktop: grid */}
      <div className="relative">
        {/* Mobile scroll container */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:hidden">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="w-[72vw] flex-shrink-0 snap-start opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards" }}
            >
              <ProductCard product={product} locale={locale} />
            </div>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
            >
              <ProductCard product={product} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
