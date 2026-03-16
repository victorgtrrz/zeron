"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

const categories = [
  { slug: "tshirts", key: "tshirts" as const },
  { slug: "pants", key: "pants" as const },
  { slug: "hoodies", key: "hoodies" as const },
  { slug: "accessories", key: "accessories" as const },
];

export function CategoryGrid() {
  const tNav = useTranslations("nav");
  const tCategories = useTranslations("categories");
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
      {/* Section header with decorative elements */}
      <div className="mb-16 flex flex-col items-center">
        <span
          className={`mb-4 text-xs uppercase tracking-[0.3em] text-highlight transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          &#47;&#47; Collection
        </span>
        <h2
          className={`text-center font-heading text-4xl tracking-wider text-accent transition-all duration-700 delay-100 md:text-6xl ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {tCategories("title")}
        </h2>
        <div
          className={`mt-4 h-px w-16 bg-highlight transition-all duration-700 delay-200 ${
            isVisible ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
          }`}
        />
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {categories.map((cat, index) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className={`group relative flex aspect-[3/4] flex-col justify-end overflow-hidden border border-border bg-surface p-6 transition-all duration-500 hover:border-highlight/50 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
            style={{
              transitionDelay: isVisible ? `${200 + index * 120}ms` : "0ms",
            }}
          >
            {/* Index number - large decorative */}
            <span className="absolute right-4 top-4 font-heading text-[8rem] leading-none text-accent/[0.03] transition-all duration-500 group-hover:text-highlight/[0.08] sm:text-[10rem]">
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-highlight/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Content */}
            <div className="relative z-10">
              {/* Small index */}
              <span className="mb-3 block text-[11px] font-medium tracking-[0.2em] text-muted transition-colors duration-300 group-hover:text-highlight">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Category name */}
              <div className="flex items-end justify-between">
                <h3 className="font-heading text-3xl tracking-wider text-accent transition-colors duration-300 group-hover:text-white md:text-4xl">
                  {tNav(cat.key)}
                </h3>
                <ArrowUpRight className="mb-1 h-5 w-5 -translate-x-2 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-highlight group-hover:opacity-100" />
              </div>

              {/* Animated underline */}
              <div className="mt-3 h-px w-0 bg-highlight transition-all duration-500 group-hover:w-full" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
