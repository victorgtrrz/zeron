"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const cities = [
  { nameKey: "Santander & Madrid", tKey: "citySantander" as const },
  { nameKey: "Barcelona", tKey: "cityBarcelona" as const },
  { nameKey: "Boston & Dublin", tKey: "cityBostonDublin" as const },
  { nameKey: "London", tKey: "cityLondon" as const },
  { nameKey: "Wellington", tKey: "cityWellington" as const },
];

export function BrandStory() {
  const t = useTranslations("brandStory");
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="grain-overlay relative overflow-hidden bg-surface py-24 md:py-36"
    >
      {/* Large decorative background text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="select-none font-heading text-[10rem] leading-none tracking-widest text-accent/[0.02] sm:text-[16rem] lg:text-[22rem]">
          ZERON
        </span>
      </div>

      {/* Decorative vertical lines */}
      <div className="absolute left-[10%] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />
      <div className="absolute right-[10%] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Section label */}
        <div
          className={`mb-8 flex items-center gap-4 transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="h-px w-8 bg-highlight" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-highlight">
            {t("label")}
          </span>
        </div>

        {/* Heading */}
        <h2
          className={`mb-14 max-w-3xl font-heading text-4xl tracking-wider text-accent transition-all duration-700 delay-100 md:text-6xl lg:text-7xl ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          {t("headingLine1")}
          <br />
          <span className="text-highlight">{t("headingLine2")}</span>
        </h2>

        {/* Story content */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <div
            className={`space-y-6 transition-all duration-700 delay-200 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <p className="text-base leading-[1.8] text-muted md:text-lg">
              {t("p1")}
            </p>
            <p className="text-base leading-[1.8] text-muted md:text-lg">
              {t("p2")}
            </p>
            <p className="text-base leading-[1.8] text-muted md:text-lg">
              {t("p3")}
            </p>

            {/* Cities list */}
            <ul className="space-y-2 border-l border-highlight/30 pl-5">
              {cities.map((city) => (
                <li key={city.tKey} className="text-sm leading-relaxed text-muted">
                  <span className="text-accent">{city.nameKey},</span>{" "}
                  {t(city.tKey)}
                </li>
              ))}
            </ul>

            <p className="text-base leading-[1.8] text-muted md:text-lg">
              {t("p4")}
            </p>
          </div>

          <div
            className={`space-y-6 transition-all duration-700 delay-300 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <p className="text-base leading-[1.8] text-muted md:text-lg">
              {t("p5")}
            </p>
            <p className="text-base leading-[1.8] text-muted md:text-lg">
              {t("p6")}
            </p>
            <p className="text-base leading-[1.8] text-muted md:text-lg">
              {t("p7")}
            </p>

            {/* Sign-off */}
            <div className="mt-8 border-t border-border pt-8">
              <p className="font-heading text-xl tracking-wider text-accent">
                {t("signoff")}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px w-12 bg-highlight/50" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-highlight/70">
                  {t("authors")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
