"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { TranslationEditor } from "@/components/admin/products/translation-editor";
import type { Promotion, TranslatedField, Category } from "@/types";

interface PromotionFormProps {
  initialData?: Promotion;
  onSave: (data: Partial<Promotion>) => Promise<void>;
}

const emptyTranslation: TranslatedField = { en: "", es: "", "zh-HK": "" };

export function PromotionForm({ initialData, onSave }: PromotionFormProps) {
  const [applyMode, setApplyMode] = useState<"manual" | "auto">(
    initialData?.applyMode || "manual"
  );
  const [code, setCode] = useState(initialData?.code || "");
  const [type, setType] = useState<"percentage" | "fixed" | "free_shipping">(
    initialData?.type || "percentage"
  );
  const [value, setValue] = useState(
    initialData?.value?.toString() || ""
  );
  const [minOrderAmount, setMinOrderAmount] = useState(
    initialData?.minOrderAmount !== null && initialData?.minOrderAmount !== undefined
      ? (initialData.minOrderAmount / 100).toString()
      : ""
  );
  const [applicableCategories, setApplicableCategories] = useState<string[]>(
    initialData?.applicableCategories || []
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : ""
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split("T")[0]
      : ""
  );
  const [maxUses, setMaxUses] = useState(
    initialData?.maxUses?.toString() || ""
  );
  const [banner, setBanner] = useState<TranslatedField>(
    initialData?.banner || { ...emptyTranslation }
  );
  const [showBanner, setShowBanner] = useState(
    initialData?.showBanner || false
  );
  const [active, setActive] = useState(
    initialData?.active !== undefined ? initialData.active : true
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, []);

  function toggleCategory(catId: string) {
    setApplicableCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const data: Partial<Promotion> = {
        applyMode,
        code: applyMode === "manual" ? code.trim().toUpperCase() || null : null,
        type,
        value: type === "free_shipping" ? 0 : parseFloat(value) || 0,
        minOrderAmount: minOrderAmount
          ? Math.round(parseFloat(minOrderAmount) * 100)
          : null,
        applicableCategories:
          applicableCategories.length > 0 ? applicableCategories : null,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        banner:
          banner.en || banner.es || banner["zh-HK"] ? banner : null,
        showBanner,
        active,
      };

      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save promotion");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Apply Mode */}
      <div>
        <label className="mb-2 block text-sm text-muted">Apply Mode</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setApplyMode("manual")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              applyMode === "manual"
                ? "bg-accent text-background"
                : "border border-border bg-background text-muted hover:text-accent"
            }`}
          >
            Manual (Code)
          </button>
          <button
            type="button"
            onClick={() => setApplyMode("auto")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              applyMode === "auto"
                ? "bg-accent text-background"
                : "border border-border bg-background text-muted hover:text-accent"
            }`}
          >
            Automatic
          </button>
        </div>
      </div>

      {/* Code (manual only) */}
      {applyMode === "manual" && (
        <div>
          <label className="mb-2 block text-sm text-muted">
            Promotion Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER25"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent uppercase placeholder:text-muted/50 focus:border-brand focus:outline-none"
          />
        </div>
      )}

      {/* Type */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Discount Type
        </label>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as "percentage" | "fixed" | "free_shipping")
          }
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount ($)</option>
          <option value="free_shipping">Free Shipping</option>
        </select>
      </div>

      {/* Value */}
      {type !== "free_shipping" && (
        <div>
          <label className="mb-2 block text-sm text-muted">
            {type === "percentage" ? "Discount (%)" : "Discount ($)"}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min="0"
            step={type === "percentage" ? "1" : "0.01"}
            max={type === "percentage" ? "100" : undefined}
            placeholder={type === "percentage" ? "e.g. 25" : "e.g. 10.00"}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
          />
        </div>
      )}

      {/* Min Order Amount */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Minimum Order Amount ($)
        </label>
        <input
          type="number"
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
          min="0"
          step="0.01"
          placeholder="Leave empty for no minimum"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
      </div>

      {/* Applicable Categories */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Applicable Categories
        </label>
        <p className="mb-2 text-xs text-muted/70">
          Leave all unselected to apply to all categories.
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                applicableCategories.includes(cat.id)
                  ? "bg-accent text-background"
                  : "border border-border bg-background text-muted hover:text-accent"
              }`}
            >
              {cat.name.en}
            </button>
          ))}
          {categories.length === 0 && (
            <span className="text-xs text-muted/50">Loading categories...</span>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-muted">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Max Uses */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Max Uses
        </label>
        <input
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          min="0"
          placeholder="Leave empty for unlimited"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
      </div>

      {/* Banner Text */}
      <TranslationEditor
        value={banner}
        onChange={setBanner}
        fieldType="input"
        label="Banner Text"
      />

      {/* Show Banner Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-accent">
            Show Banner
          </label>
          <p className="text-xs text-muted">
            Display promotional banner on the storefront
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBanner(!showBanner)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            showBanner ? "bg-success" : "bg-border"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              showBanner ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-accent">Active</label>
          <p className="text-xs text-muted">
            Enable or disable this promotion
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
        {saving ? "Saving..." : "Save Promotion"}
      </button>
    </form>
  );
}
