import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductBySlug, getCategoryBySlug } from "@/lib/firebase/firestore";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductJsonLd } from "@/components/product/product-jsonld";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Not Found — ZERON" };
  }

  const name = product.name[locale as Locale] || product.name.en || slug;
  const description =
    product.description[locale as Locale] || product.description.en || "";
  const ogImage = product.images[0] ?? undefined;

  // Build hreflang alternates for all locales
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `/${loc}/shop/${slug}`;
  }

  return {
    title: `${name} — ZERON`,
    description,
    openGraph: {
      title: `${name} — ZERON`,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "website",
    },
    alternates: {
      languages,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category: categorySlug, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const name = product.name[locale as Locale] || product.name.en || "";
  const description =
    product.description[locale as Locale] || product.description.en || "";
  const price = `$${(product.basePrice / 100).toFixed(2)}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <ProductJsonLd product={product} locale={locale} />

      <div className="grid gap-10 md:grid-cols-2">
        {/* Left — Gallery */}
        <ProductGallery images={product.images} name={name} />

        {/* Right — Product info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-accent md:text-4xl">
              {name}
            </h1>
            <p className="mt-2 text-2xl font-bold text-accent">{price}</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-sm leading-relaxed text-muted">{description}</p>
          </div>

          {/* Client-side interactive bits: size selector, add to cart, wishlist */}
          <ProductDetailClient product={product} />
        </div>
      </div>
    </section>
  );
}
