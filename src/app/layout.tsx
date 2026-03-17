import type { Metadata } from "next";
import { Bebas_Neue, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zeron.store";

export const metadata: Metadata = {
  title: {
    default: "ZERON — Streetwear Without Limits",
    template: "%s | ZERON",
  },
  description: "Exclusive urban clothing collection. Streetwear without limits.",
  openGraph: {
    title: "ZERON — Streetwear Without Limits",
    description: "Exclusive urban clothing collection. Streetwear without limits.",
    images: [{ url: `${siteUrl}/og_image.webp` }],
    type: "website",
    siteName: "ZERON",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZERON — Streetwear Without Limits",
    description: "Exclusive urban clothing collection. Streetwear without limits.",
    images: [`${siteUrl}/og_image.webp`],
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}>) {
  const { locale } = await params;

  return (
    <html lang={locale || "es"} suppressHydrationWarning>
      <body
        className={`${bebasNeue.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
