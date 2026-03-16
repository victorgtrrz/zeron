import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
  type WhereFilterOp,
  type OrderByDirection,
} from "firebase/firestore";
import { getClientDb } from "./client";
import type {
  Product,
  Category,
  Order,
  User,
  Promotion,
  CartDoc,
  CartItem,
  WishlistDoc,
  Settings,
  ChatbotKBEntry,
} from "@/types";

// ---- Helpers ----

function timestampToDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
}

function docToType<T>(snapshot: { id: string; data: () => Record<string, unknown> | undefined }): T | null {
  const data = snapshot.data();
  if (!data) return null;

  const converted: Record<string, unknown> = { id: snapshot.id };
  for (const [key, value] of Object.entries(data)) {
    converted[key] = value instanceof Timestamp ? value.toDate() : value;
  }
  return converted as T;
}

// ---- Products ----

export interface ProductFilters {
  categoryId?: string;
  status?: string;
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "name-asc";
  limitCount?: number;
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(getClientDb(), "products", id));
  return docToType<Product>(snap);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(collection(getClientDb(), "products"), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docToType<Product>(snap.docs[0]);
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const constraints: Parameters<typeof query>[1][] = [];

  if (filters.status) {
    constraints.push(where("status", "==", filters.status));
  } else {
    constraints.push(where("status", "==", "active"));
  }

  if (filters.categoryId) {
    constraints.push(where("categoryId", "==", filters.categoryId));
  }

  // Sort
  switch (filters.sort) {
    case "price-asc":
      constraints.push(orderBy("basePrice", "asc"));
      break;
    case "price-desc":
      constraints.push(orderBy("basePrice", "desc"));
      break;
    case "name-asc":
      constraints.push(orderBy("name.en", "asc"));
      break;
    default:
      constraints.push(orderBy("createdAt", "desc"));
  }

  if (filters.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  const q = query(collection(getClientDb(), "products"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToType<Product>(d)!);
}

// ---- Categories ----

export async function getCategories(): Promise<Category[]> {
  const q = query(collection(getClientDb(), "categories"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToType<Category>(d)!);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const q = query(collection(getClientDb(), "categories"), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docToType<Category>(snap.docs[0]);
}

// ---- Orders ----

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(getClientDb(), "orders", id));
  return docToType<Order>(snap);
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(getClientDb(), "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToType<Order>(d)!);
}

// ---- Users ----

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(getClientDb(), "users", uid));
  return docToType<User>(snap);
}

export async function createUser(uid: string, data: Partial<User>): Promise<void> {
  await setDoc(doc(getClientDb(), "users", uid), {
    ...data,
    role: "customer",
    addresses: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(getClientDb(), "users", uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ---- Promotions ----

export async function getActivePromotions(): Promise<Promotion[]> {
  const now = Timestamp.now();
  const q = query(
    collection(getClientDb(), "promotions"),
    where("active", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToType<Promotion>(d)!)
    .filter((p) => {
      const start = p.startDate instanceof Date ? p.startDate : new Date();
      const end = p.endDate instanceof Date ? p.endDate : new Date();
      const nowDate = new Date();
      return nowDate >= start && nowDate <= end;
    });
}

export async function getBannerPromotions(): Promise<Promotion[]> {
  const promos = await getActivePromotions();
  return promos.filter((p) => p.showBanner && p.banner);
}

// ---- Settings ----

export async function getSettings(): Promise<Settings> {
  const snap = await getDoc(doc(getClientDb(), "settings", "general"));
  const data = snap.data();
  if (!data) {
    return { flatRateShipping: 999, currency: "usd", defaultLocale: "es" };
  }
  return data as Settings;
}

// ---- Cart ----

export async function getCart(visitorId: string): Promise<CartDoc | null> {
  const snap = await getDoc(doc(getClientDb(), "carts", visitorId));
  return docToType<CartDoc>(snap);
}

export async function updateCart(
  visitorId: string,
  items: CartItem[],
  userId?: string | null
): Promise<void> {
  await setDoc(doc(getClientDb(), "carts", visitorId), {
    items,
    userId: userId ?? null,
    updatedAt: Timestamp.now(),
  });
}

// ---- Wishlist ----

export async function getWishlist(userId: string): Promise<WishlistDoc | null> {
  const snap = await getDoc(doc(getClientDb(), "wishlists", userId));
  return docToType<WishlistDoc>(snap);
}

export async function toggleWishlistItem(
  userId: string,
  productId: string
): Promise<boolean> {
  const wishlistRef = doc(getClientDb(), "wishlists", userId);
  const snap = await getDoc(wishlistRef);

  if (!snap.exists()) {
    await setDoc(wishlistRef, {
      productIds: [productId],
      updatedAt: Timestamp.now(),
    });
    return true; // added
  }

  const data = snap.data();
  const ids: string[] = data.productIds || [];

  if (ids.includes(productId)) {
    await updateDoc(wishlistRef, {
      productIds: arrayRemove(productId),
      updatedAt: Timestamp.now(),
    });
    return false; // removed
  } else {
    await updateDoc(wishlistRef, {
      productIds: arrayUnion(productId),
      updatedAt: Timestamp.now(),
    });
    return true; // added
  }
}
