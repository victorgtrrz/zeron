import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/firebase/firestore";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductJsonLd } from "@/components/product/product-jsonld";
import { RelatedProducts } from "@/components/product/related-products";
import { routing } from "@/i18n/routing";
import { MarkdownContent } from "@/components/product/markdown-content";
import type { Locale } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
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
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Fetch related products from the same category (exclude current)
  const categoryProducts = await getProducts({
    categoryId: product.categoryId,
    status: "active",
    limitCount: 9,
  });
  const relatedProducts = categoryProducts.filter((p) => p.id !== product.id).slice(0, 8);

  const name = product.name[locale as Locale] || product.name.en || "";
  const description =
    product.description[locale as Locale] || product.description.en || "";
  const price = `$${(product.basePrice / 100).toFixed(2)}`;

  return (
    <section className="mx-auto min-h-screen max-w-7xl px-4 py-10">
      <ProductJsonLd product={product} locale={locale} />

      <div className="grid gap-10 md:grid-cols-2">
        {/* Left — Gallery */}
        <ProductGallery images={product.images} name={name} />

        {/* Right — Product info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading text-3xl tracking-wider text-accent md:text-4xl">
              {name}
            </h1>
            <p className="mt-2 text-2xl font-bold text-accent">{price}</p>
          </div>

          <MarkdownContent content={description} />

          {/* Client-side interactive bits: size selector, add to cart, wishlist */}
          <ProductDetailClient product={product} />
        </div>
      </div>

      {/* Related products from same category */}
      <RelatedProducts products={relatedProducts} locale={locale as Locale} />
    </section>
  );
}
