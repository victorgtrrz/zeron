"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Hero() {
  const tHero = useTranslations("hero");
  const tCommon = useTranslations("common");

  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/hero_image.webp"
        alt="Zeron streetwear"
        fill
        className="object-cover"
        priority
        quality={90}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="animate-fade-in-up relative z-10 flex flex-col items-center px-4 text-center">
        <Image
          src="/zeron_logo.webp"
          alt="Zeron"
          width={80}
          height={80}
          className="mb-6 h-20 w-auto"
        />

        <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-7xl">
          {tHero("tagline")}
        </h1>

        <p className="mt-4 max-w-lg text-base text-white/80 sm:text-lg md:text-xl">
          {tHero("subtitle")}
        </p>

        <Link
          href="/shop"
          className="mt-8 inline-flex items-center rounded-md bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-transform duration-200 hover:scale-105"
        >
          {tCommon("shopNow")}
        </Link>
      </div>
    </section>
  );
}
