import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact/contact-form";
import { Mail, MapPin, Clock } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: `${t("title")} — ZERON`,
    description: "Get in touch with the Zeron team.",
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-10 text-center font-heading text-3xl font-bold tracking-tight text-accent md:text-4xl">
        {t("title")}
      </h1>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Form */}
        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
            <ContactForm />
          </div>
        </div>

        {/* Store info */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
              <div>
                <h3 className="font-medium text-accent">Email</h3>
                <p className="mt-1 text-sm text-muted">hello@zeron.store</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
              <div>
                <h3 className="font-medium text-accent">Location</h3>
                <p className="mt-1 text-sm text-muted">
                  Barcelona, Spain
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
              <div>
                <h3 className="font-medium text-accent">Hours</h3>
                <p className="mt-1 text-sm text-muted">
                  Mon — Fri: 10:00 — 18:00 CET
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
