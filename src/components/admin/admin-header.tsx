"use client";

import { ExternalLink, User } from "lucide-react";

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-lg font-bold font-heading">{title}</h1>

      <div className="flex items-center gap-4">
        {/* View store link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View store
        </a>

        {/* Admin avatar placeholder */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-accent">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden text-sm font-medium text-accent sm:block">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}
