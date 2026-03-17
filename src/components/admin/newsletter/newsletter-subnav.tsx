"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Send, FileText } from "lucide-react";

const tabs = [
  { href: "/zr-ops/newsletter", label: "Subscribers", icon: Users },
  { href: "/zr-ops/newsletter/campaigns", label: "Campaigns", icon: Send },
  { href: "/zr-ops/newsletter/templates", label: "Templates", icon: FileText },
];

export function NewsletterSubnav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/zr-ops/newsletter") {
      return pathname === "/zr-ops/newsletter" || pathname === "/zr-ops/newsletter/";
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-border bg-surface">
      <div className="flex gap-1 px-6">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
