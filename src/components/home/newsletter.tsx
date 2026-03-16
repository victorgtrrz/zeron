"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle } from "lucide-react";

export function Newsletter() {
  const t = useTranslations("newsletter");
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-border py-20 md:py-28"
    >
      {/* Decorative corner accents */}
      <div className="absolute left-6 top-6 hidden md:block">
        <div className="h-10 w-px bg-highlight/30" />
        <div className="mt-[-1px] h-px w-10 bg-highlight/30" />
      </div>
      <div className="absolute bottom-6 right-6 hidden md:block">
        <div className="ml-auto h-10 w-px bg-highlight/30" />
        <div className="mt-[-1px] h-px w-10 bg-highlight/30" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        {/* Label */}
        <span
          className={`mb-4 inline-block text-[11px] uppercase tracking-[0.3em] text-highlight transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {t("label")}
        </span>

        {/* Heading */}
        <h2
          className={`mb-4 font-heading text-3xl tracking-wider text-accent transition-all duration-700 delay-100 md:text-5xl ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {t("title")}
        </h2>

        {/* Description */}
        <p
          className={`mx-auto mb-10 max-w-md text-sm leading-relaxed text-muted transition-all duration-700 delay-200 md:text-base ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {t("description")}
        </p>

        {/* Form */}
        <div
          className={`transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {submitted ? (
            <div className="flex items-center justify-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-accent">
                {t("success")}
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:gap-0"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder")}
                required
                className="flex-1 border border-border bg-surface px-5 py-4 text-sm text-accent placeholder:text-muted focus:border-highlight focus:outline-none sm:border-r-0"
              />
              <button
                type="submit"
                className="group flex items-center justify-center gap-2 border border-highlight bg-highlight/10 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition-all duration-300 hover:bg-highlight/20"
              >
                {t("submit")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>
          )}
        </div>

        {/* Fine print */}
        <p
          className={`mt-6 text-[11px] text-muted/60 transition-all duration-700 delay-[400ms] ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
