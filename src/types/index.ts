export type Locale = "es" | "en" | "zh-HK";

export type TranslatedField = Record<Locale, string>;

export interface Address {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  isDefault?: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "customer" | "admin";
  addresses: Address[];
  preferredLocale: Locale;
  createdAt: Date;
  updatedAt: Date;
}

export type Gender = "men" | "women" | "unisex";

export interface Product {
  id: string;
  name: TranslatedField;
  description: TranslatedField;
  slug: string;
  categoryId: string;
  basePrice: number; // cents
  images: string[];
  sizes: string[];
  stock: Record<string, number>;
  status: "active" | "draft";
  gender: Gender;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: TranslatedField;
  slug: string;
  description: TranslatedField;
  image: string;
  order: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number; // cents
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number; // cents
  shipping: number; // cents
  discount: number; // cents
  total: number; // cents
  paymentStatus: "pending" | "paid" | "refunded";
  fulfillmentStatus: "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: Omit<Address, "isDefault">;
  stripeSessionId: string;
  promotionCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Promotion {
  id: string;
  code: string | null;
  type: "percentage" | "fixed" | "free_shipping";
  applyMode: "manual" | "auto";
  value: number;
  minOrderAmount: number | null;
  applicableCategories: string[] | null;
  banner: TranslatedField | null;
  showBanner: boolean;
  startDate: Date;
  endDate: Date;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
}

export interface ChatbotKBEntry {
  id: string;
  title: string;
  content: string;
  category: "products" | "policies" | "faq" | "sizing";
  active: boolean;
  updatedAt: Date;
}

export interface WishlistDoc {
  productIds: string[];
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number; // cents
  image: string;
}

export interface CartDoc {
  userId: string | null;
  items: CartItem[];
  updatedAt: Date;
}

export interface Settings {
  flatRateShipping: number; // cents
  currency: string;
  defaultLocale: Locale;
}

export interface ChatbotRateLimit {
  count: number;
  windowStart: Date;
}
