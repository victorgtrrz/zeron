/**
 * Zeron — Firestore seed script
 *
 * Populates categories, products, settings, promotions, and chatbot KB entries.
 * Run with:  npx tsx scripts/seed.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from project root
config({ path: resolve(__dirname, "../.env.local") });

import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

// ── Initialize Admin SDK ──

function initAdmin() {
  if (getApps().length) return;

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  initializeApp({ credential: cert(serviceAccount) });
}

initAdmin();
const db = getFirestore();

// ── Helpers ──

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStock(): Record<string, number> {
  return {
    S: randomInt(5, 20),
    M: randomInt(5, 20),
    L: randomInt(5, 20),
    XL: randomInt(5, 20),
  };
}

const IMG = (text: string) =>
  `https://placehold.co/600x600/141414/e5e5e5?text=${encodeURIComponent(text)}`;

const now = Timestamp.now();

// ── Categories ──

interface SeedCategory {
  name: { es: string; en: string; "zh-HK": string };
  slug: string;
  description: { es: string; en: string; "zh-HK": string };
  image: string;
  order: number;
}

const categories: SeedCategory[] = [
  {
    name: { es: "Camisetas", en: "T-Shirts", "zh-HK": "T恤" },
    slug: "tshirts",
    description: {
      es: "Camisetas urbanas de alta calidad con diseños exclusivos.",
      en: "Premium urban t-shirts with exclusive designs.",
      "zh-HK": "高品質城市T恤，獨家設計。",
    },
    image: IMG("TSHIRTS"),
    order: 1,
  },
  {
    name: { es: "Pantalones", en: "Pants", "zh-HK": "褲子" },
    slug: "pants",
    description: {
      es: "Pantalones streetwear con cortes modernos y telas premium.",
      en: "Streetwear pants with modern cuts and premium fabrics.",
      "zh-HK": "街頭風格褲子，現代剪裁，優質面料。",
    },
    image: IMG("PANTS"),
    order: 2,
  },
  {
    name: { es: "Sudaderas", en: "Hoodies", "zh-HK": "衛衣" },
    slug: "hoodies",
    description: {
      es: "Sudaderas oversized para un look urbano y cómodo.",
      en: "Oversized hoodies for a comfortable urban look.",
      "zh-HK": "寬鬆衛衣，舒適都市風格。",
    },
    image: IMG("HOODIES"),
    order: 3,
  },
  {
    name: { es: "Accesorios", en: "Accessories", "zh-HK": "配飾" },
    slug: "accessories",
    description: {
      es: "Accesorios esenciales para completar tu estilo.",
      en: "Essential accessories to complete your look.",
      "zh-HK": "必備配飾，完善你的造型。",
    },
    image: IMG("ACCESSORIES"),
    order: 4,
  },
];

// ── Products ──

interface SeedProduct {
  name: { es: string; en: string; "zh-HK": string };
  description: { es: string; en: string; "zh-HK": string };
  slug: string;
  categorySlug: string;
  basePrice: number; // cents
  tags: string[];
}

const products: SeedProduct[] = [
  // ── T-Shirts (3) ──
  {
    name: {
      es: "Camiseta Shadow Graphic",
      en: "Shadow Graphic Tee",
      "zh-HK": "暗影圖案T恤",
    },
    description: {
      es: "Camiseta de algodón 100% con estampado gráfico frontal y ajuste oversized. Perfecta para el día a día.",
      en: "100% cotton tee with front graphic print and oversized fit. Perfect for everyday wear.",
      "zh-HK": "100%棉T恤，正面圖案印花，寬鬆剪裁。適合日常穿著。",
    },
    slug: "shadow-graphic-tee",
    categorySlug: "tshirts",
    basePrice: 3500,
    tags: ["graphic", "oversized", "cotton"],
  },
  {
    name: {
      es: "Camiseta Midnight Essential",
      en: "Midnight Essential Tee",
      "zh-HK": "午夜基礎T恤",
    },
    description: {
      es: "Camiseta básica en negro profundo con logo bordado en el pecho. Tela de gramaje pesado.",
      en: "Essential tee in deep black with embroidered chest logo. Heavyweight fabric.",
      "zh-HK": "深黑色基本款T恤，胸前刺繡標誌。重磅面料。",
    },
    slug: "midnight-essential-tee",
    categorySlug: "tshirts",
    basePrice: 2800,
    tags: ["essential", "embroidered", "heavyweight"],
  },
  {
    name: {
      es: "Camiseta Neon District",
      en: "Neon District Tee",
      "zh-HK": "霓虹街區T恤",
    },
    description: {
      es: "Camiseta con estampado de neón reflectante en la espalda. Corte regular, algodón orgánico.",
      en: "Tee with reflective neon back print. Regular fit, organic cotton.",
      "zh-HK": "背面反光霓虹印花T恤。常規剪裁，有機棉。",
    },
    slug: "neon-district-tee",
    categorySlug: "tshirts",
    basePrice: 3200,
    tags: ["neon", "reflective", "organic"],
  },

  // ── Pants (3) ──
  {
    name: {
      es: "Pantalón Cargo Phantom",
      en: "Phantom Cargo Pants",
      "zh-HK": "幻影工裝褲",
    },
    description: {
      es: "Pantalón cargo con múltiples bolsillos y cintura ajustable. Tela ripstop resistente.",
      en: "Cargo pants with multiple pockets and adjustable waist. Durable ripstop fabric.",
      "zh-HK": "多口袋工裝褲，可調節腰圍。耐用防撕裂面料。",
    },
    slug: "phantom-cargo-pants",
    categorySlug: "pants",
    basePrice: 6500,
    tags: ["cargo", "ripstop", "utility"],
  },
  {
    name: {
      es: "Jogger Urban Stealth",
      en: "Urban Stealth Jogger",
      "zh-HK": "都市隱形慢跑褲",
    },
    description: {
      es: "Jogger slim con puños elásticos y cremalleras laterales. Mezcla de algodón y poliéster.",
      en: "Slim jogger with elastic cuffs and side zippers. Cotton-polyester blend.",
      "zh-HK": "修身慢跑褲，彈力束腳和側拉鏈。棉聚酯混紡。",
    },
    slug: "urban-stealth-jogger",
    categorySlug: "pants",
    basePrice: 5500,
    tags: ["jogger", "slim", "zippered"],
  },
  {
    name: {
      es: "Pantalón Wide Leg Noir",
      en: "Noir Wide Leg Pants",
      "zh-HK": "黑色闊腿褲",
    },
    description: {
      es: "Pantalón de pierna ancha con silueta relajada y cintura alta. Denim japonés de primera calidad.",
      en: "Wide leg pants with relaxed silhouette and high waist. Premium Japanese denim.",
      "zh-HK": "寬腿褲，放鬆廓形，高腰設計。優質日本牛仔布。",
    },
    slug: "noir-wide-leg-pants",
    categorySlug: "pants",
    basePrice: 7800,
    tags: ["wide-leg", "denim", "japanese"],
  },

  // ── Hoodies (3) ──
  {
    name: {
      es: "Sudadera Eclipse Heavyweight",
      en: "Eclipse Heavyweight Hoodie",
      "zh-HK": "日蝕重磅衛衣",
    },
    description: {
      es: "Sudadera oversized de 450 gsm con capucha doble y bolsillo canguro. Calidez extrema.",
      en: "Oversized 450 gsm hoodie with double hood and kangaroo pocket. Extreme warmth.",
      "zh-HK": "450克重寬鬆衛衣，雙層帽子和袋鼠口袋。極致保暖。",
    },
    slug: "eclipse-heavyweight-hoodie",
    categorySlug: "hoodies",
    basePrice: 7500,
    tags: ["heavyweight", "oversized", "450gsm"],
  },
  {
    name: {
      es: "Sudadera Zip-Up Vortex",
      en: "Vortex Zip-Up Hoodie",
      "zh-HK": "漩渦拉鏈衛衣",
    },
    description: {
      es: "Sudadera con cremallera completa, forro de algodón cepillado y logo reflectante en la espalda.",
      en: "Full zip hoodie with brushed cotton lining and reflective back logo.",
      "zh-HK": "全拉鏈衛衣，磨毛棉內裡，背面反光標誌。",
    },
    slug: "vortex-zip-up-hoodie",
    categorySlug: "hoodies",
    basePrice: 6800,
    tags: ["zip-up", "reflective", "brushed-cotton"],
  },
  {
    name: {
      es: "Sudadera Cropped Haze",
      en: "Haze Cropped Hoodie",
      "zh-HK": "霧霾短版衛衣",
    },
    description: {
      es: "Sudadera cropped con corte boxy y estampado minimalista. Ideal para looks en capas.",
      en: "Cropped hoodie with boxy cut and minimalist print. Ideal for layered looks.",
      "zh-HK": "短版寬鬆衛衣，極簡印花。適合疊穿造型。",
    },
    slug: "haze-cropped-hoodie",
    categorySlug: "hoodies",
    basePrice: 5800,
    tags: ["cropped", "boxy", "minimalist"],
  },

  // ── Accessories (3) ──
  {
    name: {
      es: "Gorra Snapback Zero",
      en: "Zero Snapback Cap",
      "zh-HK": "Zero棒球帽",
    },
    description: {
      es: "Gorra snapback con logo bordado en 3D y cierre ajustable. Talla única.",
      en: "Snapback cap with 3D embroidered logo and adjustable closure. One size.",
      "zh-HK": "3D刺繡標誌棒球帽，可調節扣合。均碼。",
    },
    slug: "zero-snapback-cap",
    categorySlug: "accessories",
    basePrice: 2500,
    tags: ["cap", "snapback", "embroidered"],
  },
  {
    name: {
      es: "Bolso Crossbody Stealth",
      en: "Stealth Crossbody Bag",
      "zh-HK": "隱身斜挎包",
    },
    description: {
      es: "Bolso crossbody compacto con compartimentos múltiples y correa ajustable. Nylon balístico.",
      en: "Compact crossbody bag with multiple compartments and adjustable strap. Ballistic nylon.",
      "zh-HK": "緊湊型斜挎包，多隔層，可調節肩帶。彈道尼龍。",
    },
    slug: "stealth-crossbody-bag",
    categorySlug: "accessories",
    basePrice: 4200,
    tags: ["bag", "crossbody", "nylon"],
  },
  {
    name: {
      es: "Calcetines Pack Cipher (3 pares)",
      en: "Cipher Sock Pack (3 pairs)",
      "zh-HK": "Cipher襪子套裝（3雙）",
    },
    description: {
      es: "Set de 3 pares de calcetines acolchados con diseños exclusivos. Algodón peinado.",
      en: "Set of 3 pairs of cushioned socks with exclusive designs. Combed cotton.",
      "zh-HK": "3雙加墊襪子套裝，獨家設計。精梳棉。",
    },
    slug: "cipher-sock-pack",
    categorySlug: "accessories",
    basePrice: 2000,
    tags: ["socks", "pack", "cushioned"],
  },
];

// ── Promotions ──

const promotions = [
  {
    code: "ZERON10",
    type: "percentage" as const,
    applyMode: "manual" as const,
    value: 10,
    minOrderAmount: null,
    applicableCategories: null,
    banner: {
      es: "Usa el codigo ZERON10 para 10% de descuento",
      en: "Use code ZERON10 for 10% off",
      "zh-HK": "使用代碼 ZERON10 享九折優惠",
    },
    showBanner: true,
    startDate: Timestamp.fromDate(new Date("2025-01-01")),
    endDate: Timestamp.fromDate(new Date("2027-12-31")),
    maxUses: null,
    currentUses: 0,
    active: true,
  },
  {
    code: null,
    type: "free_shipping" as const,
    applyMode: "auto" as const,
    value: 0,
    minOrderAmount: 5000, // $50.00
    applicableCategories: null,
    banner: {
      es: "Envio gratis en pedidos superiores a $50",
      en: "Free shipping on orders over $50",
      "zh-HK": "訂單滿$50免運費",
    },
    showBanner: true,
    startDate: Timestamp.fromDate(new Date("2025-01-01")),
    endDate: Timestamp.fromDate(new Date("2027-12-31")),
    maxUses: null,
    currentUses: 0,
    active: true,
  },
];

// ── Chatbot KB ──

const kbEntries = [
  {
    title: "Sizing Guide",
    content: `Zeron uses the following size chart:
- S: Chest 36-38", Waist 28-30"
- M: Chest 38-40", Waist 30-32"
- L: Chest 40-42", Waist 32-34"
- XL: Chest 42-44", Waist 34-36"
Our hoodies and tees have an oversized fit — if you prefer a snug fit, size down one size. Pants are true to size.`,
    category: "sizing" as const,
    active: true,
  },
  {
    title: "Return Policy",
    content: `We accept returns within 30 days of delivery for unworn items with original tags. Items must be in their original packaging. Refunds are processed within 5-7 business days after we receive the return. Shipping costs for returns are the responsibility of the customer unless the item was defective or incorrect. Sale items are final sale and cannot be returned.`,
    category: "policies" as const,
    active: true,
  },
  {
    title: "Shipping Information",
    content: `Standard shipping: 5-8 business days ($9.99 flat rate). Free shipping on orders over $50. We ship to the US, EU, and select Asian markets. Orders are processed within 1-2 business days. Tracking information is sent via email once your order ships. Express shipping options are available at checkout for an additional fee.`,
    category: "policies" as const,
    active: true,
  },
  {
    title: "Brand Story",
    content: `Zeron was born in Barcelona in 2024 with a single mission: create streetwear without limits. We blend dark aesthetics with premium craftsmanship, sourcing fabrics from Japan and Portugal. Every piece is designed for the modern urban explorer who refuses to blend in. Our name — Zeron — represents the zero point where style meets substance. We believe in sustainable production, limited runs, and community over hype.`,
    category: "faq" as const,
    active: true,
  },
  {
    title: "Frequently Asked Questions",
    content: `Q: Do you offer international shipping? A: Yes, we ship to the US, EU, and select Asian markets.
Q: Can I change my order after placing it? A: Orders can be modified within 1 hour of placement by contacting support.
Q: Do you restock sold-out items? A: Some items are limited edition. Follow us on social media for restock announcements.
Q: What payment methods do you accept? A: We accept all major credit cards via Stripe.
Q: How do I track my order? A: You'll receive a tracking email once your order ships. You can also check order status in your account.`,
    category: "faq" as const,
    active: true,
  },
];

// ── Seed function ──

async function seed() {
  console.log("Starting Zeron seed...\n");

  // 1. Categories
  console.log("Seeding categories...");
  const categoryIdMap = new Map<string, string>();

  for (const cat of categories) {
    const ref = db.collection("categories").doc();
    await ref.set({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      order: cat.order,
    });
    categoryIdMap.set(cat.slug, ref.id);
    console.log(`  + Category: ${cat.name.en} (${ref.id})`);
  }

  // 2. Products
  console.log("\nSeeding products...");

  for (const prod of products) {
    const categoryId = categoryIdMap.get(prod.categorySlug);
    if (!categoryId) {
      console.error(`  ! Category not found for slug: ${prod.categorySlug}`);
      continue;
    }

    const ref = db.collection("products").doc();
    await ref.set({
      name: prod.name,
      description: prod.description,
      slug: prod.slug,
      categoryId,
      basePrice: prod.basePrice,
      images: [
        IMG(prod.name.en.split(" ")[0].toUpperCase()),
        IMG("ZERON"),
      ],
      sizes: ["S", "M", "L", "XL"],
      stock: randomStock(),
      status: "active",
      tags: prod.tags,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  + Product: ${prod.name.en} — $${(prod.basePrice / 100).toFixed(2)} (${ref.id})`);
  }

  // 3. Settings
  console.log("\nSeeding settings...");
  await db.collection("settings").doc("general").set({
    flatRateShipping: 999,
    currency: "usd",
    defaultLocale: "es",
  });
  console.log("  + settings/general");

  // 4. Promotions
  console.log("\nSeeding promotions...");

  for (const promo of promotions) {
    const ref = db.collection("promotions").doc();
    await ref.set(promo);
    console.log(`  + Promotion: ${promo.code ?? "auto: " + promo.type} (${ref.id})`);
  }

  // 5. Chatbot KB
  console.log("\nSeeding chatbot knowledge base...");

  for (const entry of kbEntries) {
    const ref = db.collection("chatbot_kb").doc();
    await ref.set({
      ...entry,
      updatedAt: now,
    });
    console.log(`  + KB: ${entry.title} (${ref.id})`);
  }

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
