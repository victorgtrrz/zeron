import { AdminHeader } from "@/components/admin/admin-header";
import { SettingsForm } from "@/components/admin/settings/settings-form";

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Settings" />
      <div className="mx-auto max-w-2xl p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">Settings</h2>
        <div className="rounded-xl border border-border bg-surface p-6">
          <SettingsForm />
        </div>
      </div>
    </>
  );
}
