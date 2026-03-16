import type { ReactNode } from "react";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image
            src="/zeron_logo.webp"
            alt="Zeron"
            width={120}
            height={40}
            priority
            className="h-auto w-auto dark:brightness-100 brightness-0"
          />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
