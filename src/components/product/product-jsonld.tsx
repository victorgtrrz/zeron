import type { Product, ReviewStats } from "@/types";
import { getPartialName } from "@/lib/review-utils";

interface ReviewData {
  displayName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductJsonLdProps {
  product: Product;
  locale: string;
  reviewStats?: ReviewStats;
  reviews?: ReviewData[];
}

export function ProductJsonLd({
  product,
  locale,
  reviewStats,
  reviews,
}: ProductJsonLdProps) {
  const name =
    product.name[locale as keyof typeof product.name] || product.name.en || "";
  const description =
    product.description[locale as keyof typeof product.description] ||
    product.description.en ||
    "";
  const totalStock = Object.values(product.stock).reduce((sum, s) => sum + s, 0);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: product.images,
    description,
    brand: {
      "@type": "Brand",
      name: "Zeron",
    },
    offers: {
      "@type": "Offer",
      price: (product.basePrice / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  if (reviewStats && reviewStats.totalReviews > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewStats.averageRating,
      reviewCount: reviewStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (reviews && reviews.length > 0) {
    jsonLd.review = reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: getPartialName(r.displayName),
      },
      datePublished: r.createdAt.split("T")[0],
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
      },
      reviewBody: r.comment,
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
