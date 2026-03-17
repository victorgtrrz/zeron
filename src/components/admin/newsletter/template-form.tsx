"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, EyeOff } from "lucide-react";
import { HtmlPreview } from "@/components/admin/newsletter/html-preview";

interface TemplateFormProps {
  mode: "create" | "edit";
  templateId?: string;
}

export function TemplateForm({ mode, templateId }: TemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "edit" && templateId) {
      fetch(`/api/admin/newsletter/templates/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.name);
          setSubject(data.subject);
          setBody(data.body);
        })
        .catch((err) => console.error("Failed to load template:", err))
        .finally(() => setLoading(false));
    }
  }, [mode, templateId]);

  async function handleSave() {
    if (!name || !subject || !body) {
      setError("All fields are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url =
        mode === "edit"
          ? `/api/admin/newsletter/templates/${templateId}`
          : "/api/admin/newsletter/templates";

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/zr-ops/newsletter/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Template Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Product Launch, Weekly Digest..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
        />
      </div>

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

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
      </button>
    </div>
  );
}
