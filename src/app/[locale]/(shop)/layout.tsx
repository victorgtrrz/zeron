import type { ReactNode } from "react";
import { PromoBanner } from "@/components/layout/promo-banner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-accent">
      <div className="sticky top-0 z-50">
        <PromoBanner />
        <Header />
      </div>
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
}
