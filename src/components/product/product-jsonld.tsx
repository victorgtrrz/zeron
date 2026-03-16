import type { Product } from "@/types";

interface ProductJsonLdProps {
  product: Product;
  locale: string;
}

export function ProductJsonLd({ product, locale }: ProductJsonLdProps) {
  const name =
    product.name[locale as keyof typeof product.name] || product.name.en || "";
  const description =
    product.description[locale as keyof typeof product.description] ||
    product.description.en ||
    "";
  const totalStock = Object.values(product.stock).reduce((sum, s) => sum + s, 0);

  const jsonLd = {
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
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
