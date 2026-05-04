"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { useState } from "react";
import { toast } from "sonner";
import { categorySchema, type CategorySchemaValues } from "../schemas";

export type CategoryFormValues = CategorySchemaValues;

interface CategoryFormProps {
  initialData?: CategoryFormValues & {
    id?: string;
    imageUrl?: string;
  };
  onSubmit: (data: CategoryFormValues, file: File | null) => void;
  isLoading?: boolean;
}

export function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDbImageRemoved, setIsDbImageRemoved] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: initialData || {
      name: "",
      shortDescription: "",
      order: 1,
    },
  });

  const handleUploadTemp = async (uploadedFile: File) => {
    setFile(uploadedFile);
  };

  const handleRemoveTemp = async () => {
    setFile(null);
    setIsDbImageRemoved(true); // Tandai gambar DB sebagai dihapus jika ada
  };

  const submitWrapper = (data: CategoryFormValues) => {
    if (!initialData && !file) {
      toast.error("Gambar kategori wajib diunggah untuk kategori baru!");
      return;
    }
    if (initialData && isDbImageRemoved && !file) {
      toast.error("Gambar kategori wajib diganti! Unggah gambar baru.");
      return;
    }
    onSubmit(data, file);
  };

  // Preview logic
  const previewImages = [];
  if (file) {
    previewImages.push({ id: "temp", url: URL.createObjectURL(file) });
  } else if (initialData?.imageUrl && !isDbImageRemoved) {
    previewImages.push({ id: "db-image", url: initialData.imageUrl });
  }

  return (
    <form onSubmit={handleSubmit(submitWrapper)} className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Kategori</Label>
            <Input {...register("name")} placeholder="Cth: Sepatu Formal" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Deskripsi Singkat</Label>
            <Textarea
              {...register("shortDescription")}
              placeholder="Deskripsi singkat untuk kategori ini"
              className="h-24"
            />
            {errors.shortDescription && (
              <p className="text-xs text-red-500">{errors.shortDescription.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Urutan Tampil (Order)</Label>
            <Input type="number" min={1} {...register("order")} placeholder="1" />
            <p className="text-xs text-muted-foreground">Angka lebih kecil tampil lebih dulu (misal: 1 paling atas)</p>
            {errors.order && <p className="text-xs text-red-500">{errors.order.message}</p>}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Gambar Kategori</Label>
            <ImageUpload 
              images={previewImages}
              onUpload={handleUploadTemp}
              onRemove={handleRemoveTemp}
              maxFiles={1}
            />
            {!initialData?.id && <p className="text-xs text-red-500 mt-1">* Wajib diisi</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Simpan Perubahan" : "Simpan Kategori"}
        </Button>
      </div>
    </form>
  );
}
