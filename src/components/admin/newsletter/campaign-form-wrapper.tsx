"use client";

import { useState, useEffect } from "react";
import { CampaignForm } from "@/components/admin/newsletter/campaign-form";

interface CampaignFormWrapperProps {
  mode: "create" | "edit";
  campaignId?: string;
}

export function CampaignFormWrapper({ mode, campaignId }: CampaignFormWrapperProps) {
  const [templates, setTemplates] = useState<
    { id: string; name: string; subject: string; body: string }[]
  >([]);
  const [initialData, setInitialData] = useState<{
    id: string;
    subject: string;
    body: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch templates for the selector
        const templatesRes = await fetch("/api/admin/newsletter/templates");
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates ?? []);
        }

        // Fetch campaign data if editing
        if (mode === "edit" && campaignId) {
          const campaignRes = await fetch(
            `/api/admin/newsletter/campaigns/${campaignId}`
          );
          if (campaignRes.ok) {
            const data = await campaignRes.json();
            setInitialData({
              id: data.id,
              subject: data.subject,
              body: data.body,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load form data:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [mode, campaignId]);

  if (loading) {
    return <p className="text-muted">Loading...</p>;
  }

  return (
    <CampaignForm
      mode={mode}
      initialData={initialData ?? undefined}
      templates={templates}
    />
  );
}
