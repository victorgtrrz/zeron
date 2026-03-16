"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { KBTable } from "@/components/admin/chatbot-kb/kb-table";
import { KBForm } from "@/components/admin/chatbot-kb/kb-form";
import type { ChatbotKBEntry } from "@/types";

export default function ChatbotKBPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleCreateSave(data: Partial<ChatbotKBEntry>) {
    const res = await fetch("/api/admin/chatbot-kb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create entry");
    }

    setShowCreateForm(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <AdminHeader title="Chatbot Knowledge Base" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold font-heading">Knowledge Base</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>
        <KBTable key={refreshKey} />
      </div>

      {showCreateForm && (
        <KBForm
          onSave={handleCreateSave}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </>
  );
}
