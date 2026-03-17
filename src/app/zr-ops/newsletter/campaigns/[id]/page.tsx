import { CampaignDetail } from "@/components/admin/newsletter/campaign-detail";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <CampaignDetail campaignId={id} />
    </div>
  );
}
