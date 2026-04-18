"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function extractErrorMessage(error: unknown, fallback: string) {
  const maybeMessage = (error as any)?.response?.data?.message;
  if (typeof maybeMessage === "string" && maybeMessage.trim())
    return maybeMessage;

  const message = (error as any)?.message;
  if (typeof message === "string" && message.trim()) return message;

  return fallback;
}

interface ImageUploadProps {
  images: { id: string; url: string }[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({
  images,
  onUpload,
  onRemove,
  maxFiles = 5,
  className,
}: ImageUploadProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= maxFiles) {
      toast.error(`Maksimal ${maxFiles} gambar diperbolehkan`);
      return;
    }

    try {
      setIsCompressing(true);
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      };
      const compressedFile = await imageCompression(file, options);
      await onUpload(compressedFile);
    } catch (error) {
      console.error(error);
      toast.error(
        extractErrorMessage(
          error,
          "Gagal mengunggah gambar. Pastikan format didukung.",
        ),
      );
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setLoadingId(id);
      await onRemove(id);
    } catch (error) {
      console.error(error);
      toast.error(extractErrorMessage(error, "Gagal menghapus gambar"));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className={cn("flex flex-col h-full space-y-4", className)}>
      {/* List Gambar */}
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            maxFiles === 1
              ? "grid-cols-1"
              : "grid-cols-2",
          )}
        >
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                "group relative h-32 w-full overflow-hidden rounded-lg bg-gray-100 border border-border",
                maxFiles === 1 ? "aspect-video" : "aspect-square",
              )}
            >
              <img
                src={img.url}
                alt="Upload preview"
                className="h-32 w-full object-contain bg-black/5"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(img.id)}
                  disabled={loadingId === img.id}
                >
                  {loadingId === img.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxFiles && (
        <div
          onClick={() => !isCompressing && fileInputRef.current?.click()}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors min-h-[180px] mt-auto",
            maxFiles === 1 ? "aspect-video" : "",
            isCompressing
              ? "border-muted-foreground/30 bg-muted/50 cursor-not-allowed"
              : "border-muted-foreground/30 hover:border-[#3C3025] hover:bg-secondary cursor-pointer",
          )}
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Mengompres & Mengunggah...
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground text-center px-4">
                {images.length === 0 ? "Unggah Gambar Utama" : "Tambah Gambar Lain"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                JPG, PNG, WebP
              </p>
            </>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground">
        Tampil {images.length} dari maksimal {maxFiles} gambar
      </p>
    </div>
  );
}
