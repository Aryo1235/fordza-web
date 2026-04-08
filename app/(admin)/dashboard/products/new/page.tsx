"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ProductForm, type ProductFormValues, useCreateProduct } from "@/features/products";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const [files, setFiles] = useState<File[]>([]);

  // Convert Files to object URL preview format
  const previewImages = files.map((f, i) => ({
    id: `${f.name}-${i}`,
    url: URL.createObjectURL(f),
  }));

  const handleUploadTemp = async (file: File) => {
    setFiles((prev) => [...prev, file]);
  };

  const handleRemoveTemp = async (id: string) => {
    setFiles((prev) => prev.filter((f, i) => `${f.name}-${i}` !== id));
  };

  const onSubmit = (data: ProductFormValues) => {
    const formData = new FormData();
    
    // Append primitive data
    Object.entries(data).forEach(([key, value]) => {
      if (key === "categoryIds") return; // Handled below
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    data.categoryIds.forEach((id) => formData.append("categoryIds", id));

    // Append images
    files.forEach((file) => {
      formData.append("images", file);
    });

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Produk berhasil dibuat!");
        router.push("/dashboard/products");
      },
      onError: () => {
        toast.error("Gagal membuat produk. Pastikan form sudah benar.");
      }
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Tambah Produk Baru" 
        description="Buat produk baru yang akan ditampilkan di etalase toko."
      />

      <div className="space-y-8">
        {/* Gallery Section */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-[#3C3025]">Galeri Produk</h3>
          <p className="text-sm text-muted-foreground mb-4">Tambahkan foto produk terbaik Anda di sini. Maksimal 4 foto.</p>
          <ImageUpload 
            images={previewImages}
            onUpload={handleUploadTemp}
            onRemove={handleRemoveTemp}
            maxFiles={4}
          />
        </div>

        {/* Form Section */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-[#3C3025]">Detail Produk</h3>
          <ProductForm 
            onSubmit={onSubmit} 
            isLoading={createMutation.isPending} 
          />
        </div>
      </div>
    </div>
  );
}
