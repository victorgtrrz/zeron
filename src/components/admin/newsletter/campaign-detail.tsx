"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Send } from "lucide-react";
import { HtmlPreview } from "@/components/admin/newsletter/html-preview";

interface CampaignData {
  id: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string | null;
}

function formatDate(date: string | null): string {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "sent":
      return "bg-success/20 text-success";
    case "sending":
      return "bg-brand/20 text-accent";
    case "scheduled":
      return "bg-warning/20 text-warning";
    case "failed":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted/20 text-muted";
  }
}

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/admin/newsletter/campaigns/${campaignId}`
        );
        if (res.ok) {
          setCampaign(await res.json());
        }
      } catch (error) {
        console.error("Failed to load campaign:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId]);

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!campaign) return <p className="text-muted">Campaign not found</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/zr-ops/newsletter/campaigns"
            className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to campaigns
          </Link>
          <h2 className="text-3xl font-bold font-heading">{campaign.subject}</h2>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <Link
              href={`/zr-ops/newsletter/campaigns/${campaignId}/edit`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Status & stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Status</p>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(campaign.status)}`}
          >
            {campaign.status}
          </span>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Recipients</p>
          <p className="mt-1 text-lg font-bold text-accent">
            {campaign.recipientCount}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Delivered</p>
          <p className="mt-1 text-lg font-bold text-success">
            {campaign.successCount}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Failed</p>
          <p className="mt-1 text-lg font-bold text-destructive">
            {campaign.failureCount}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-6 text-sm text-muted">
        <span>Created: {formatDate(campaign.createdAt)}</span>
        {campaign.scheduledAt && (
          <span>Scheduled: {formatDate(campaign.scheduledAt)}</span>
        )}
        {campaign.sentAt && (
          <span>Sent: {formatDate(campaign.sentAt)}</span>
        )}
      </div>

      {/* Email preview */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted">Email Preview</h3>
        <HtmlPreview html={campaign.body} className="h-[600px]" />
      </div>
    </div>
  );
}
