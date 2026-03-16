import { adminDb } from "@/lib/firebase/admin";
import type { Promotion, CartItem } from "@/types";

function docToPromotion(
  doc: FirebaseFirestore.DocumentSnapshot
): Promotion | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    code: data.code ?? null,
    type: data.type,
    applyMode: data.applyMode,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    applicableCategories: data.applicableCategories ?? null,
    banner: data.banner ?? null,
    showBanner: data.showBanner ?? false,
    startDate: data.startDate?.toDate?.() ?? new Date(data.startDate),
    endDate: data.endDate?.toDate?.() ?? new Date(data.endDate),
    maxUses: data.maxUses ?? null,
    currentUses: data.currentUses ?? 0,
    active: data.active ?? false,
  };
}

export function calculateDiscount(
  promotion: Promotion,
  _items: CartItem[],
  subtotal: number,
  shippingAmount: number = 0
): number {
  switch (promotion.type) {
    case "percentage": {
      // value is the percentage (e.g. 10 means 10%)
      return Math.round(subtotal * (promotion.value / 100));
    }
    case "fixed": {
      // value is the fixed amount in cents
      return Math.min(promotion.value, subtotal);
    }
    case "free_shipping": {
      return shippingAmount;
    }
    default:
      return 0;
  }
}

function isPromotionValid(promo: Promotion, subtotal: number): boolean {
  const now = new Date();

  if (!promo.active) return false;

  const start =
    promo.startDate instanceof Date ? promo.startDate : new Date(promo.startDate);
  const end =
    promo.endDate instanceof Date ? promo.endDate : new Date(promo.endDate);

  if (now < start || now > end) return false;

  if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) return false;

  if (promo.minOrderAmount !== null && subtotal < promo.minOrderAmount)
    return false;

  return true;
}

function categoriesMatch(
  promo: Promotion,
  items: CartItem[],
  productCategories: Record<string, string>
): boolean {
  if (!promo.applicableCategories || promo.applicableCategories.length === 0) {
    return true;
  }

  // At least one item must belong to an applicable category
  return items.some((item) => {
    const catId = productCategories[item.productId];
    return catId && promo.applicableCategories!.includes(catId);
  });
}

export async function validatePromoCode(
  code: string,
  items: CartItem[],
  subtotal: number
): Promise<
  | { valid: true; discount: number; promotion: Promotion }
  | { valid: false; error: string }
> {
  // Find promotion by code (case-insensitive comparison)
  const snapshot = await adminDb
    .collection("promotions")
    .where("applyMode", "==", "manual")
    .get();

  let promo: Promotion | null = null;
  for (const doc of snapshot.docs) {
    const p = docToPromotion(doc);
    if (p && p.code && p.code.toLowerCase() === code.toLowerCase()) {
      promo = p;
      break;
    }
  }

  if (!promo) {
    return { valid: false, error: "Promotion code not found" };
  }

  if (!promo.active) {
    return { valid: false, error: "This promotion is no longer active" };
  }

  if (!isPromotionValid(promo, subtotal)) {
    if (promo.minOrderAmount !== null && subtotal < promo.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order amount is $${(promo.minOrderAmount / 100).toFixed(2)}`,
      };
    }
    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return { valid: false, error: "This promotion has reached its max uses" };
    }
    return { valid: false, error: "This promotion is not currently valid" };
  }

  // Check applicable categories if set
  if (promo.applicableCategories && promo.applicableCategories.length > 0) {
    // Fetch product categories from Firestore
    const productCategories: Record<string, string> = {};
    const productIds = [...new Set(items.map((i) => i.productId))];

    for (const pid of productIds) {
      const prodDoc = await adminDb.collection("products").doc(pid).get();
      const prodData = prodDoc.data();
      if (prodData) {
        productCategories[pid] = prodData.categoryId;
      }
    }

    if (!categoriesMatch(promo, items, productCategories)) {
      return {
        valid: false,
        error: "This promotion does not apply to items in your cart",
      };
    }
  }

  // Fetch shipping for free_shipping type
  let shippingAmount = 0;
  if (promo.type === "free_shipping") {
    const settingsDoc = await adminDb
      .collection("settings")
      .doc("general")
      .get();
    const settingsData = settingsDoc.data();
    shippingAmount = settingsData?.flatRateShipping ?? 999;
  }

  const discount = calculateDiscount(promo, items, subtotal, shippingAmount);

  return { valid: true, discount, promotion: promo };
}

export async function getAutoPromotion(
  items: CartItem[],
  subtotal: number
): Promise<{ discount: number; promotion: Promotion | null }> {
  if (items.length === 0) {
    return { discount: 0, promotion: null };
  }

  const snapshot = await adminDb
    .collection("promotions")
    .where("active", "==", true)
    .where("applyMode", "==", "auto")
    .get();

  const now = new Date();
  const validPromos: Promotion[] = [];

  for (const doc of snapshot.docs) {
    const promo = docToPromotion(doc);
    if (!promo) continue;
    if (!isPromotionValid(promo, subtotal)) continue;

    const start =
      promo.startDate instanceof Date
        ? promo.startDate
        : new Date(promo.startDate);
    const end =
      promo.endDate instanceof Date ? promo.endDate : new Date(promo.endDate);

    if (now >= start && now <= end) {
      validPromos.push(promo);
    }
  }

  if (validPromos.length === 0) {
    return { discount: 0, promotion: null };
  }

  // Fetch shipping amount for free_shipping promotions
  let shippingAmount = 0;
  const hasFreeShipping = validPromos.some((p) => p.type === "free_shipping");
  if (hasFreeShipping) {
    const settingsDoc = await adminDb
      .collection("settings")
      .doc("general")
      .get();
    const settingsData = settingsDoc.data();
    shippingAmount = settingsData?.flatRateShipping ?? 999;
  }

  // Check category matching for all promos
  const productIds = [...new Set(items.map((i) => i.productId))];
  const productCategories: Record<string, string> = {};
  for (const pid of productIds) {
    const prodDoc = await adminDb.collection("products").doc(pid).get();
    const prodData = prodDoc.data();
    if (prodData) {
      productCategories[pid] = prodData.categoryId;
    }
  }

  // Find the promotion with the highest discount
  let bestPromo: Promotion | null = null;
  let bestDiscount = 0;

  for (const promo of validPromos) {
    if (!categoriesMatch(promo, items, productCategories)) continue;

    const discount = calculateDiscount(promo, items, subtotal, shippingAmount);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestPromo = promo;
    }
  }

  return { discount: bestDiscount, promotion: bestPromo };
}
