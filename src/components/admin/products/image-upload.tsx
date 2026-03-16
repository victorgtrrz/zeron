"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { uploadImage, deleteImage } from "@/lib/firebase/storage";
import Image from "next/image";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  productId?: string;
}

export function ImageUpload({ value, onChange, productId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxImages = 8;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - value.length;

      if (remaining <= 0) {
        alert("Maximum 8 images allowed");
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      setUploading(true);

      try {
        const uploadPromises = toUpload.map(async (file) => {
          const id = productId || "temp-" + Date.now();
          const path = `products/${id}/${Date.now()}-${file.name}`;
          return uploadImage(file, path);
        });

        const urls = await Promise.all(uploadPromises);
        onChange([...value, ...urls]);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload one or more images");
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, productId]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleRemove(url: string) {
    try {
      await deleteImage(url);
    } catch (error) {
      console.error("Failed to delete image from storage:", error);
    }
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div>
      <label className="mb-2 block text-sm text-muted">
        Images ({value.length}/{maxImages})
      </label>

      {/* Thumbnails row */}
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((url, idx) => (
            <div key={idx} className="group relative">
              <Image
                src={url}
                alt={`Product image ${idx + 1}`}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {value.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-brand bg-brand/5"
              : "border-border hover:border-muted"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
              <p className="text-sm text-muted">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                {dragOver ? (
                  <ImageIcon className="h-5 w-5 text-brand" />
                ) : (
                  <Upload className="h-5 w-5 text-muted" />
                )}
              </div>
              <p className="mt-2 text-sm text-muted">
                Drag & drop images here or click to browse
              </p>
              <p className="mt-1 text-xs text-muted/60">
                PNG, JPG, WebP up to 5MB each
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
