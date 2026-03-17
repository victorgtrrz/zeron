"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  BarChart3,
  Percent,
  MessageSquare,
  Settings,
  ArrowLeft,
  MoreHorizontal,
  Mail,
} from "lucide-react";

const navLinks = [
  { href: "/zr-ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/zr-ops/products", label: "Products", icon: Package },
  { href: "/zr-ops/categories", label: "Categories", icon: Tags },
  { href: "/zr-ops/orders", label: "Orders", icon: ShoppingCart },
  { href: "/zr-ops/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/zr-ops/promotions", label: "Promotions", icon: Percent },
  { href: "/zr-ops/newsletter", label: "Newsletter", icon: Mail },
  { href: "/zr-ops/chatbot-kb", label: "Chatbot KB", icon: MessageSquare },
  { href: "/zr-ops/settings", label: "Settings", icon: Settings },
];

const bottomLinks = [
  { href: "/zr-ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/zr-ops/products", label: "Products", icon: Package },
  { href: "/zr-ops/orders", label: "Orders", icon: ShoppingCart },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/zr-ops") {
      return pathname === "/zr-ops" || pathname === "/zr-ops/";
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Top bar on mobile */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-md p-2 text-accent transition-colors hover:bg-background"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/zr-ops">
          <Image
            src="/zeron_logo.webp"
            alt="Zeron"
            width={100}
            height={32}
            className="h-6 w-auto"
          />
        </Link>

        <div className="w-9" />
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 backdrop-overlay"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface animate-slide-in-left">
            {/* Drawer header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Image
                src="/zeron_logo.webp"
                alt="Zeron"
                width={100}
                height={32}
                className="h-6 w-auto"
              />
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-md p-1.5 text-accent transition-colors hover:bg-background"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer nav links */}
            <nav className="px-3 py-4">
              <ul className="space-y-1">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
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
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to store
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Bottom quick-access bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-border bg-surface md:hidden">
        {bottomLinks.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 p-2 text-xs ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}

        {/* More dropdown */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 p-2 text-xs ${
              moreOpen ? "text-accent" : "text-muted"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>

          {moreOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMoreOpen(false)}
              />
              <div className="absolute bottom-14 right-0 z-20 w-48 rounded-xl border border-border bg-surface p-2 shadow-lg">
                {navLinks
                  .filter(
                    (l) =>
                      !bottomLinks.some((bl) => bl.href === l.href)
                  )
                  .map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-accent"
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
