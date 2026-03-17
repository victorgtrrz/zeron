"use client";

import { useState, useEffect } from "react";
import { TranslationEditor } from "./translation-editor";
import { ImageUpload } from "./image-upload";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Product, TranslatedField, Category, Gender } from "@/types";

interface ProductFormProps {
  initialData?: Product;
  onSave: (data: Partial<Product>) => Promise<void>;
}

const availableSizes = ["S", "M", "L", "XL"];

export function ProductForm({ initialData, onSave }: ProductFormProps) {
  const [name, setName] = useState<TranslatedField>(
    initialData?.name || { en: "", es: "", "zh-HK": "" }
  );
  const [description, setDescription] = useState<TranslatedField>(
    initialData?.description || { en: "", es: "", "zh-HK": "" }
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [basePrice, setBasePrice] = useState(
    initialData ? (initialData.basePrice / 100).toFixed(2) : ""
  );
  const [sizes, setSizes] = useState<string[]>(initialData?.sizes || []);
  const [stock, setStock] = useState<Record<string, number>>(
    initialData?.stock || {}
  );
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [gender, setGender] = useState<Gender>(
    initialData?.gender || "unisex"
  );
  const [status, setStatus] = useState<"active" | "draft">(
    initialData?.status || "draft"
  );
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  function handleSizeToggle(size: string) {
    if (sizes.includes(size)) {
      setSizes(sizes.filter((s) => s !== size));
      const newStock = { ...stock };
      delete newStock[size];
      setStock(newStock);
    } else {
      setSizes([...sizes, size]);
      setStock({ ...stock, [size]: 0 });
    }
  }

  function handleStockChange(size: string, value: string) {
    const num = parseInt(value, 10);
    setStock({ ...stock, [size]: isNaN(num) ? 0 : num });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.en.trim()) {
      toast("English name is required", "warning");
      return;
    }

    setSaving(true);

    try {
      const priceInCents = Math.round(parseFloat(basePrice || "0") * 100);
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        name,
        description,
        categoryId,
        basePrice: priceInCents,
        sizes,
        stock,
        tags: tagArray,
        gender,
        status,
        images,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <TranslationEditor
        label="Product Name"
        value={name}
        onChange={setName}
        fieldType="input"
      />

      {/* Description */}
      <TranslationEditor
        label="Description"
        value={description}
        onChange={setDescription}
        fieldType="textarea"
      />

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm text-muted">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name.en}
            </option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div>
        <label className="mb-2 block text-sm text-muted">Gender</label>
        <div className="flex flex-wrap gap-2">
          {(["men", "women", "unisex"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                gender === g
                  ? "border-accent bg-accent text-background"
                  : "border-border bg-background text-muted hover:border-muted"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Base Price */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Base Price (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-8 pr-4 text-sm text-accent focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <label className="mb-2 block text-sm text-muted">Sizes</label>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeToggle(size)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                sizes.includes(size)
                  ? "border-accent bg-accent text-background"
                  : "border-border bg-background text-muted hover:border-muted"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Stock per size */}
      {sizes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm text-muted">
            Stock per Size
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sizes.map((size) => (
              <div key={size}>
                <label className="mb-1 block text-xs text-muted">{size}</label>
                <input
                  type="number"
                  min="0"
                  value={stock[size] || 0}
                  onChange={(e) => handleStockChange(size, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="mb-2 block text-sm text-muted">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="streetwear, new-arrival, limited"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent placeholder:text-muted/50 focus:border-brand focus:outline-none"
        />
        {tags && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-brand/20 px-2.5 py-0.5 text-xs text-accent"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-sm text-muted">Status</label>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "active" | "draft")
          }
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* Images */}
      <ImageUpload
        value={images}
        onChange={setImages}
        productId={initialData?.id}
      />

      {/* Save button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}
