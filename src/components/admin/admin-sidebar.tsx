"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  BarChart3,
  Percent,
  MessageSquare,
  Settings,
  ArrowLeft,
} from "lucide-react";

const navLinks = [
  { href: "/zr-ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/zr-ops/products", label: "Products", icon: Package },
  { href: "/zr-ops/categories", label: "Categories", icon: Tags },
  { href: "/zr-ops/orders", label: "Orders", icon: ShoppingCart },
  { href: "/zr-ops/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/zr-ops/promotions", label: "Promotions", icon: Percent },
  { href: "/zr-ops/chatbot-kb", label: "Chatbot KB", icon: MessageSquare },
  { href: "/zr-ops/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/zr-ops") {
      return pathname === "/zr-ops" || pathname === "/zr-ops/";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-surface md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-border px-6">
        <Link href="/zr-ops">
          <Image
            src="/zeron_logo.webp"
            alt="Zeron"
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-l-2 border-brand bg-background text-accent"
                      : "text-muted hover:bg-background hover:text-accent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back to store */}
      <div className="border-t border-border p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>
      </div>
    </aside>
  );
}
