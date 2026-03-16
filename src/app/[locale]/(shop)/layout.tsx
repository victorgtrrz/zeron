import type { ReactNode } from "react";
import { PromoBanner } from "@/components/layout/promo-banner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-accent">
      <PromoBanner />
      <Header />
      <main className="pt-16 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomBar />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
}
