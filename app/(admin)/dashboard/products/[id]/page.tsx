"use client";

import { use, useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { 
  ProductForm, type ProductFormValues,
  useProduct, 
  useUpdateProduct, 
  useAddProductImage, 
  useDeleteProductImage 
} from "@/features/products";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: product, isLoading: isFetching } = useProduct(id);
  const updateMutation = useUpdateProduct();
  const addImageMutation = useAddProductImage();
  const delImageMutation = useDeleteProductImage();

  const [initialData, setInitialData] = useState<ProductFormValues | null>(null);

  // Set initial data when product loads
  useEffect(() => {
    if (product) {
        setInitialData({
          productCode: product.productCode || "",
          name: product.name,
          shortDescription: product.shortDescription || "",
          description: product.detail?.description || "",
          price: product.price,
          stock: product.stock || 0,
          productType: product.productType || "shoes",
          gender: product.gender || "Unisex",
          material: product.detail?.material || "",
          closureType: product.detail?.closureType || "",
          outsole: product.detail?.outsole || "",
          origin: product.detail?.origin || "",
          notes: product.detail?.notes || "",
          careInstructions: product.detail?.careInstructions || "",
          isActive: product.isActive,
          isPopular: product.isPopular || false,
          isBestseller: product.isBestseller || false,
          isNew: product.isNew || false,
          categoryIds: product.categories.map((c: any) => c.category?.id).filter(Boolean) || [],
          sizeTemplateId: product.detail?.sizeTemplate?.id || product.detail?.sizeTemplateId || "",
      });
    }
  }, [product]);

  const handleUploadImage = async (file: File) => {
    await addImageMutation.mutateAsync({ productId: id, file });
  };

  const handleRemoveImage = async (imageId: string) => {
    await delImageMutation.mutateAsync({ productId: id, imageId });
  };

  const onSubmit = (data: ProductFormValues) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === "categoryIds") return; // Handled below
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    data.categoryIds.forEach((id) => formData.append("categoryIds", id));

    updateMutation.mutate({ id, formData }, {
      onSuccess: () => {
        toast.success("Produk berhasil diperbarui!");
        router.push("/dashboard/products");
      },
      onError: () => {
        toast.error("Gagal mengupdate produk.");
      }
    });
  };

  if (isFetching || !initialData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3C3025]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Edit Produk" 
        description={`Mengubah data produk ${product.name}`}
      />

      <div className="space-y-8">
        {/* Gallery Section */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-[#3C3025]">Galeri Produk (Otomatis Tersimpan)</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Perubahan gambar pada halaman edit akan *langsung tersimpan*, tidak perlu menekan tombol Simpan di bawah.
          </p>
          <ImageUpload 
            images={(product.images || []).map((img: any) => ({
              id: img.id,
              url: img.url
            }))}
            onUpload={handleUploadImage}
            onRemove={handleRemoveImage}
            maxFiles={4}
          />
        </div>

        {/* Form Section */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-[#3C3025]">Detail Spesifikasi Produk</h3>
          <ProductForm 
            initialData={initialData}
            onSubmit={onSubmit} 
            isLoading={updateMutation.isPending} 
          />
        </div>
      </div>
    </div>
  );
}
