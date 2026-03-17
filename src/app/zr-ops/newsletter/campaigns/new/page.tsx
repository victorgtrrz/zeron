import { CampaignFormWrapper } from "@/components/admin/newsletter/campaign-form-wrapper";

export default function NewCampaignPage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">New Campaign</h2>
      <CampaignFormWrapper mode="create" />
    </div>
  );
}
