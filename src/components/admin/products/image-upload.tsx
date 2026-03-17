"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, GripVertical } from "lucide-react";
import { uploadImage, deleteImage } from "@/lib/firebase/storage";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  productId?: string;
}

function SortableImage({
  url,
  idx,
  onRemove,
}: {
  url: string;
  idx: number;
  onRemove: (url: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <Image
        src={url}
        alt={`Product image ${idx + 1}`}
        width={80}
        height={80}
        className={`h-20 w-20 rounded-lg border object-cover transition-shadow ${
          idx === 0
            ? "border-highlight shadow-[0_0_0_1px_var(--highlight)]"
            : "border-border"
        }`}
      />
      {idx === 0 && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-highlight px-1.5 py-0.5 text-[10px] font-medium text-background">
          Cover
        </span>
      )}
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-0.5 left-0.5 flex h-5 w-5 cursor-grab items-center justify-center rounded bg-black/60 text-white opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function ImageUpload({ value, onChange, productId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const maxImages = 8;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - value.length;

      if (remaining <= 0) {
        toast("Maximum 8 images allowed", "warning");
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
        toast("Failed to upload one or more images");
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, productId, toast]
  );

  function handleFileDrop(e: React.DragEvent) {
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = value.indexOf(active.id as string);
    const newIndex = value.indexOf(over.id as string);
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  return (
    <div>
      <label className="mb-2 block text-sm text-muted">
        Images ({value.length}/{maxImages})
        {value.length > 1 && (
          <span className="ml-2 text-xs text-muted/60">
            — drag to reorder, first image is the cover
          </span>
        )}
      </label>

      {/* Sortable thumbnails */}
      {value.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="mb-3 flex flex-wrap gap-2">
              {value.map((url, idx) => (
                <SortableImage
                  key={url}
                  url={url}
                  idx={idx}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Drop zone */}
      {value.length < maxImages && (
        <div
          onDrop={handleFileDrop}
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
