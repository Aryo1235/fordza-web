"use client";

import { use } from "react";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";
import { CategoryForm, type CategoryFormValues, useCategory, useUpdateCategory } from "@/features/categories";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: category, isLoading: isFetching } = useCategory(id);
  const updateMutation = useUpdateCategory();

  const onSubmit = (data: CategoryFormValues, file: File | null) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("shortDescription", data.shortDescription || "");
    formData.append("order", String(data.order));
    
    // Kirim gambar baru HANYA jika file diganti
    if (file) {
      formData.append("image", file);
    }

    updateMutation.mutate({ id, formData }, {
      onSuccess: () => {
        toast.success("Kategori berhasil diperbarui!");
        router.push("/dashboard/categories");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || "Gagal mengupdate kategori");
      }
    });
  };

  if (isFetching || !category) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3C3025]" />
      </div>
    );
  }

  const initialData = {
    id: category.id,
    name: category.name,
    shortDescription: category.shortDescription || "",
    order: category.order || 0,
    imageUrl: category.imageUrl, // buat preview
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <BreadcrumbsHeader
        title="Edit Kategori"
        breadcrumbs={[
          { label: "Kategori", href: "/dashboard/categories" },
          { label: category?.name || "", href: `/dashboard/categories/${id}/detail` },
          { label: "Edit Kategori" },
        ]}
      />
      
      <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
        <CategoryForm 
          initialData={initialData}
          onSubmit={onSubmit} 
          isLoading={updateMutation.isPending} 
        />
      </div>
    </div>
  );
}
