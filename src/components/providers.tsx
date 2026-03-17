"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { AuthModalProvider } from "@/lib/auth-modal-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { ToastProvider } from "@/components/ui/toast";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <AuthModalProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                {children}
                <AuthModal />
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
