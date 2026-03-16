"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { ChatbotKBEntry } from "@/types";

interface KBFormProps {
  initialData?: ChatbotKBEntry;
  onSave: (data: Partial<ChatbotKBEntry>) => Promise<void>;
  onClose: () => void;
}

const categoryOptions = [
  { value: "products", label: "Products" },
  { value: "policies", label: "Policies" },
  { value: "faq", label: "FAQ" },
  { value: "sizing", label: "Sizing" },
] as const;

export function KBForm({ initialData, onSave, onClose }: KBFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState<
    "products" | "policies" | "faq" | "sizing"
  >(initialData?.category || "faq");
  const [content, setContent] = useState(initialData?.content || "");
  const [active, setActive] = useState(
    initialData?.active !== undefined ? initialData.active : true
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave({
        title: title.trim(),
        category,
        content: content.trim(),
        active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold font-heading text-accent">
            {initialData ? "Edit Entry" : "New Entry"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm text-muted">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm text-muted">Category</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as "products" | "policies" | "faq" | "sizing"
                )
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block text-sm text-muted">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Knowledge base content..."
              required
              rows={10}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-accent">Active</label>
              <p className="text-xs text-muted">
                Include this entry in chatbot responses
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                active ? "bg-success" : "bg-border"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
