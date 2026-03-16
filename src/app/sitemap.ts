import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zeron.store";
const LOCALES = ["es", "en", "zh-HK"] as const;

// Static pages that exist for every locale
const STATIC_PATHS = ["/", "/shop", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ---- Static pages ----
  for (const path of STATIC_PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path === "/" ? "" : path}`,
        lastModified: new Date(),
        changeFrequency: path === "/" ? "daily" : "weekly",
        priority: path === "/" ? 1.0 : 0.8,
      });
    }
  }

  // ---- Categories (as filtered shop URLs) ----
  try {
    const categoriesSnap = await adminDb
      .collection("categories")
      .orderBy("order", "asc")
      .get();

    for (const doc of categoriesSnap.docs) {
      const data = doc.data();
      const slug = data.slug as string;

      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/shop?category=${slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // If admin DB is not available, skip categories
  }

  // ---- Products ----
  try {
    const productsSnap = await adminDb
      .collection("products")
      .where("status", "==", "active")
      .get();

    for (const doc of productsSnap.docs) {
      const data = doc.data();
      const productSlug = data.slug as string;
      const updatedAt = data.updatedAt?.toDate?.() ?? new Date();

      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/shop/${productSlug}`,
          lastModified: updatedAt,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // If admin DB is not available, skip products
  }

  return entries;
}
