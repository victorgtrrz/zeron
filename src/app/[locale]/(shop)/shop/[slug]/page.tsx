import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/firebase/firestore";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductJsonLd } from "@/components/product/product-jsonld";
import { RelatedProducts } from "@/components/product/related-products";
import { routing } from "@/i18n/routing";
import { MarkdownContent } from "@/components/product/markdown-content";
import { ReviewSummary } from "@/components/product/review-summary";
import { ReviewSection } from "@/components/product/review-section";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
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

  // Fetch approved reviews for this product (first page)
  const reviewsSnap = await adminDb
    .collection("reviews")
    .where("productId", "==", product.id)
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const reviews = reviewsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      displayName: d.displayName,
      rating: d.rating,
      comment: d.comment,
      verifiedPurchase: d.verifiedPurchase,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });

  const totalApprovedReviews = product.reviewStats?.totalReviews ?? 0;

  // Determine review eligibility
  let eligibility: "eligible" | "login_required" | "purchase_required" | "already_reviewed" = "login_required";
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (sessionCookie) {
      const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
      const userId = decodedToken.uid;

      // Check if already reviewed
      const existingReview = await adminDb
        .collection("reviews")
        .where("productId", "==", product.id)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (!existingReview.empty) {
        eligibility = "already_reviewed";
      } else {
        // Check if has a verified purchase
        const ordersSnap = await adminDb
          .collection("orders")
          .where("userId", "==", userId)
          .where("paymentStatus", "==", "paid")
          .where("fulfillmentStatus", "==", "delivered")
          .get();

        const hasPurchased = ordersSnap.docs.some((doc) => {
          const items = doc.data().items || [];
          return items.some(
            (item: { productId: string }) => item.productId === product.id
          );
        });

        eligibility = hasPurchased ? "eligible" : "purchase_required";
      }
    }
  } catch {
    // Not logged in or invalid token — keep "login_required"
  }

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
            <a href="#reviews" className="transition-opacity hover:opacity-80">
              <ReviewSummary
                averageRating={product.reviewStats?.averageRating ?? 0}
                totalReviews={totalApprovedReviews}
              />
            </a>
          </div>

          <MarkdownContent content={description} />

          {/* Client-side interactive bits: size selector, add to cart, wishlist */}
          <ProductDetailClient product={product} />
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection
        productId={product.id}
        reviews={reviews}
        totalReviews={totalApprovedReviews}
        eligibility={eligibility}
      />

      {/* Related products from same category */}
      <RelatedProducts products={relatedProducts} locale={locale as Locale} />
    </section>
  );
}
