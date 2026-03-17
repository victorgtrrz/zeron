import { AdminHeader } from "@/components/admin/admin-header";
import { SubscriberTable } from "@/components/admin/newsletter/subscriber-table";

export default function NewsletterPage() {
  return (
    <>
      <AdminHeader title="Newsletter" />
      <div className="p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">Subscribers</h2>
        <SubscriberTable />
      </div>
    </>
  );
}
