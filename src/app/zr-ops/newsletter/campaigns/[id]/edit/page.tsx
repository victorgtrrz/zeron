import { CampaignFormWrapper } from "@/components/admin/newsletter/campaign-form-wrapper";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">Edit Campaign</h2>
      <CampaignFormWrapper mode="edit" campaignId={id} />
    </div>
  );
}
