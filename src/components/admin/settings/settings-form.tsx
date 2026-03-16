"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import type { Settings, Locale } from "@/types";

export function SettingsForm() {
  const [flatRateShipping, setFlatRateShipping] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [defaultLocale, setDefaultLocale] = useState<Locale>("es");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data: Settings = await res.json();
          setFlatRateShipping(
            (data.flatRateShipping / 100).toFixed(2)
          );
          setCurrency(data.currency || "USD");
          setDefaultLocale(data.defaultLocale || "es");
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const shippingCents = Math.round(parseFloat(flatRateShipping) * 100);

      if (isNaN(shippingCents) || shippingCents < 0) {
        throw new Error("Invalid shipping amount");
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatRateShipping: shippingCents,
          defaultLocale,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update settings");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-success/50 bg-success/10 px-4 py-3 text-sm text-success">
          Settings saved successfully.
        </div>
      )}

      {/* Flat Rate Shipping */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Flat Rate Shipping ($)
        </label>
        <p className="mb-2 text-xs text-muted/70">
          This amount will be charged for shipping on every order. Stored as
          cents internally.
        </p>
        <input
          type="number"
          value={flatRateShipping}
          onChange={(e) => setFlatRateShipping(e.target.value)}
          min="0"
          step="0.01"
          placeholder="e.g. 9.99"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
      </div>

      {/* Currency (read-only) */}
      <div>
        <label className="mb-2 block text-sm text-muted">Currency</label>
        <input
          type="text"
          value={currency}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-muted"
        />
        <p className="mt-1 text-xs text-muted/70">
          Currency is fixed to USD and cannot be changed.
        </p>
      </div>

      {/* Default Locale */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Default Locale
        </label>
        <select
          value={defaultLocale}
          onChange={(e) => setDefaultLocale(e.target.value as Locale)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="es">Spanish (es)</option>
          <option value="en">English (en)</option>
          <option value="zh-HK">Traditional Chinese (zh-HK)</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
