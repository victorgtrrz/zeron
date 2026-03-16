import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import SignupForm from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SignupForm />;
}
