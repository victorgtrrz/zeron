"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const categories = [
  { slug: "tshirts", key: "tshirts" as const },
  { slug: "pants", key: "pants" as const },
  { slug: "hoodies", key: "hoodies" as const },
  { slug: "accessories", key: "accessories" as const },
];

export function CategoryGrid() {
  const tNav = useTranslations("nav");
  const tCategories = useTranslations("categories");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <h2 className="mb-10 text-center font-heading text-3xl font-bold tracking-tight text-accent md:text-4xl">
        {tCategories("title")}
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop/${cat.slug}`}
            className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-surface transition-transform duration-200 hover:scale-105"
          >
            {/* Category name */}
            <span className="font-heading text-lg font-bold uppercase tracking-widest text-accent transition-colors duration-200 group-hover:text-white sm:text-xl md:text-2xl">
              {tNav(cat.key)}
            </span>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-accent/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}
