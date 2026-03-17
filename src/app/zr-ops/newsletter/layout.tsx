import { AdminHeader } from "@/components/admin/admin-header";
import { NewsletterSubnav } from "@/components/admin/newsletter/newsletter-subnav";

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminHeader title="Newsletter" />
      <NewsletterSubnav />
      {children}
    </>
  );
}
