"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryForm, type CategoryFormValues, useCreateCategory } from "@/features/categories";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewCategoryPage() {
  const router = useRouter();
  const createMutation = useCreateCategory();

  const onSubmit = (data: CategoryFormValues, file: File | null) => {
    if (!file) {
      toast.error("Gambar wajib diunggah!");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("shortDescription", data.shortDescription || "");
    formData.append("order", String(data.order));
    formData.append("image", file); // Backend expects 'image'

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Kategori berhasil dibuat!");
        router.push("/dashboard/categories");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Gagal membuat kategori");
      }
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Tambah Kategori Baru" 
        description="Buat kategori produk baru."
      />
      
      <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
        <CategoryForm 
          onSubmit={onSubmit} 
          isLoading={createMutation.isPending} 
        />
      </div>
    </div>
  );
}
