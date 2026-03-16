"use client";

import { useState, useRef } from "react";
import { X, Upload, Save, Loader2 } from "lucide-react";
import { TranslationEditor } from "@/components/admin/products/translation-editor";
import { uploadImage, deleteImage } from "@/lib/firebase/storage";
import Image from "next/image";
import type { Category, TranslatedField } from "@/types";

interface CategoryFormProps {
  initialData?: Category;
  onSave: (data: Partial<Category>) => Promise<void>;
  onClose: () => void;
}

export function CategoryForm({
  initialData,
  onSave,
  onClose,
}: CategoryFormProps) {
  const [name, setName] = useState<TranslatedField>(
    initialData?.name || { en: "", es: "", "zh-HK": "" }
  );
  const [description, setDescription] = useState<TranslatedField>(
    initialData?.description || { en: "", es: "", "zh-HK": "" }
  );
  const [image, setImage] = useState(initialData?.image || "");
  const [order, setOrder] = useState(initialData?.order ?? 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const path = `categories/${Date.now()}-${file.name}`;
      const url = await uploadImage(file, path);
      setImage(url);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (image) {
      try {
        await deleteImage(image);
      } catch (error) {
        console.error("Failed to delete image:", error);
      }
      setImage("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.en.trim()) {
      alert("English name is required");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name,
        description,
        image,
        order,
      });
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-overlay" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted transition-colors hover:bg-background hover:text-accent"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-xl font-bold font-heading">
          {initialData ? "Edit Category" : "New Category"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <TranslationEditor
            label="Category Name"
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

          {/* Image */}
          <div>
            <label className="mb-2 block text-sm text-muted">Image</label>
            {image ? (
              <div className="group relative inline-block">
                <Image
                  src={image}
                  alt="Category"
                  width={120}
                  height={120}
                  className="h-24 w-24 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-muted"
              >
                {uploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted" />
                    <p className="mt-1 text-xs text-muted">Click to upload</p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                e.target.value = "";
              }}
              className="hidden"
            />
          </div>

          {/* Display order */}
          <div>
            <label className="mb-2 block text-sm text-muted">
              Display Order
            </label>
            <input
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-accent focus:border-brand focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:bg-background hover:text-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
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
