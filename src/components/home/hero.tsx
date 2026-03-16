"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

export function Hero() {
  const tHero = useTranslations("hero");
  const tCommon = useTranslations("common");
  const bgRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effect — disabled on mobile/tablet for performance
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    if (!mq.matches) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          if (bgRef.current) {
            bgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px) scale(1.1)`;
          }
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="grain-overlay relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Background image with parallax */}
      <div ref={bgRef} className="absolute inset-0 scale-110">
        <Image
          src="/hero_image.webp"
          alt="Zeron streetwear"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* Decorative geometric lines */}
      <div className="absolute left-8 top-1/4 hidden h-32 w-px bg-gradient-to-b from-transparent via-highlight/40 to-transparent md:block" />
      <div className="absolute right-8 bottom-1/4 hidden h-32 w-px bg-gradient-to-b from-transparent via-highlight/40 to-transparent md:block" />
      <div className="absolute left-6 top-[calc(25%+8rem)] hidden h-px w-6 bg-highlight/40 md:block" />
      <div className="absolute right-6 bottom-[calc(25%+8rem)] hidden h-px w-6 bg-highlight/40 md:block" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Logo */}
        <div className="opacity-0 animate-fade-in-up stagger-1">
          <Image
            src="/zeron_logo.webp"
            alt="Zeron"
            width={80}
            height={80}
            className="mb-6 h-20 w-auto"
          />
        </div>

        {/* Heading with reveal animation */}
        <h1 className="opacity-0 animate-text-reveal stagger-2 font-heading text-5xl tracking-wider text-white sm:text-7xl md:text-9xl">
          {tHero("tagline")}
        </h1>

        {/* Decorative line under heading */}
        <div
          className="stagger-3 mt-4 h-px w-24 origin-left bg-highlight"
          style={{ animation: "line-expand 0.6s cubic-bezier(0.77, 0, 0.175, 1) 0.5s forwards", transform: "scaleX(0)" }}
        />

        {/* Subtitle */}
        <p className="opacity-0 animate-fade-in-up stagger-4 mt-6 max-w-lg text-sm uppercase tracking-[0.2em] text-white/70 sm:text-base">
          {tHero("subtitle")}
        </p>

        {/* CTA Button with glow */}
        <div className="opacity-0 animate-fade-in-up stagger-5 mt-10">
          <Link
            href="/shop"
            className="glow-button inline-flex items-center rounded-none border border-highlight bg-highlight/10 px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-sm transition-all duration-300 hover:bg-highlight/20"
          >
            {tCommon("shopNow")}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 opacity-0 animate-fade-in stagger-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Scroll</span>
          <ChevronDown className="h-4 w-4 text-white/40 animate-bounce-down" />
        </div>
      </div>

      {/* Corner decorative elements */}
      <div className="absolute left-4 top-4 z-10 hidden md:block">
        <div className="h-8 w-px bg-white/20" />
        <div className="mt-[-1px] h-px w-8 bg-white/20" />
      </div>
      <div className="absolute right-4 bottom-4 z-10 hidden md:block">
        <div className="ml-auto h-8 w-px bg-white/20" />
        <div className="mt-[-1px] ml-auto h-px w-8 bg-white/20" style={{ direction: "rtl" }} />
      </div>
    </section>
  );
}
