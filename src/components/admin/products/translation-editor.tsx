"use client";

import { useState } from "react";
import type { TranslatedField } from "@/types";

interface TranslationEditorProps {
  value: TranslatedField;
  onChange: (value: TranslatedField) => void;
  fieldType: "input" | "textarea";
  label?: string;
}

const tabs = [
  { key: "en" as const, label: "EN" },
  { key: "es" as const, label: "ES" },
  { key: "zh-HK" as const, label: "繁中" },
];

export function TranslationEditor({
  value,
  onChange,
  fieldType,
  label,
}: TranslationEditorProps) {
  const [activeTab, setActiveTab] = useState<"en" | "es" | "zh-HK">("en");

  function handleChange(locale: "en" | "es" | "zh-HK", text: string) {
    onChange({ ...value, [locale]: text });
  }

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-muted">{label}</label>
      )}

      {/* Tabs */}
      <div className="mb-2 flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input for active tab */}
      {fieldType === "input" ? (
        <input
          type="text"
          value={value[activeTab] || ""}
          onChange={(e) => handleChange(activeTab, e.target.value)}
          placeholder={`Enter text in ${tabs.find((t) => t.key === activeTab)?.label}`}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
      ) : (
        <textarea
          value={value[activeTab] || ""}
          onChange={(e) => handleChange(activeTab, e.target.value)}
          placeholder={`Enter text in ${tabs.find((t) => t.key === activeTab)?.label}`}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
      )}
    </div>
  );
}
