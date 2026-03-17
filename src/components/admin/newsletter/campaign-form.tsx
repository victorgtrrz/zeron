"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Clock, Save, Eye, EyeOff } from "lucide-react";
import { HtmlPreview } from "@/components/admin/newsletter/html-preview";

interface CampaignFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    subject: string;
    body: string;
  };
  templates?: { id: string; name: string; subject: string; body: string }[];
}

export function CampaignForm({ mode, initialData, templates = [] }: CampaignFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialData?.subject ?? "");
  const [body, setBody] = useState(initialData?.body ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!subject || !body) {
      setError("Subject and body are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url =
        mode === "edit"
          ? `/api/admin/newsletter/campaigns/${initialData!.id}`
          : "/api/admin/newsletter/campaigns";

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      if (mode === "create") {
        const data = await res.json();
        router.push(`/zr-ops/newsletter/campaigns/${data.id}`);
      } else {
        router.push(`/zr-ops/newsletter/campaigns/${initialData!.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNow() {
    if (!confirm("Send this campaign to all subscribers now?")) return;

    // Save first if creating
    if (mode === "create") {
      await handleSaveAndSend();
      return;
    }

    setSending(true);
    setError("");

    try {
      // Save latest changes first
      await fetch(`/api/admin/newsletter/campaigns/${initialData!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      const res = await fetch(
        `/api/admin/newsletter/campaigns/${initialData!.id}/send`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Failed to send");

      router.push(`/zr-ops/newsletter/campaigns/${initialData!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveAndSend() {
    if (!subject || !body) {
      setError("Subject and body are required");
      return;
    }

    setSending(true);
    setError("");

    try {
      const createRes = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (!createRes.ok) throw new Error("Failed to create");
      const { id } = await createRes.json();

      const sendRes = await fetch(
        `/api/admin/newsletter/campaigns/${id}/send`,
        { method: "POST" }
      );

      if (!sendRes.ok) throw new Error("Failed to send");

      router.push(`/zr-ops/newsletter/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleSchedule() {
    if (!scheduleDate) {
      setError("Please select a date and time");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let campaignId = initialData?.id;

      // Save first if creating or editing
      if (mode === "create") {
        const createRes = await fetch("/api/admin/newsletter/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body }),
        });
        if (!createRes.ok) throw new Error("Failed to create");
        const data = await createRes.json();
        campaignId = data.id;
      } else {
        await fetch(`/api/admin/newsletter/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body }),
        });
      }

      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaignId}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: new Date(scheduleDate).toISOString() }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule");
      }

      router.push(`/zr-ops/newsletter/campaigns/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setSaving(false);
    }
  }

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Template selector */}
      {templates.length > 0 && mode === "create" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Start from template
          </label>
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-accent"
            defaultValue=""
          >
            <option value="">— Blank campaign —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
        />
      </div>

      {/* Body editor + preview */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-muted">Body (HTML)</label>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Show Preview
              </>
            )}
          </button>
        </div>

        <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : ""}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<html>...</html>"
            rows={20}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-xs text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
          />
          {showPreview && (
            <HtmlPreview html={body} className="h-[500px]" />
          )}
        </div>
      </div>

      {/* Schedule input */}
      {showSchedule && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-muted">
              Schedule for
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-accent focus:border-highlight focus:outline-none"
            />
          </div>
          <button
            onClick={handleSchedule}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-warning/20 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning/30 disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            {saving ? "Scheduling..." : "Confirm Schedule"}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Draft"}
        </button>

        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="flex items-center gap-2 rounded-lg border border-warning/50 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning/10"
        >
          <Clock className="h-4 w-4" />
          Schedule
        </button>

        <button
          onClick={handleSendNow}
          disabled={sending}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send Now"}
        </button>
      </div>
    </div>
  );
}
