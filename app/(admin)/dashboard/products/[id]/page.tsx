"use client";

import { use, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  type ProductSchemaValues,
} from "@/features/products/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllCategoriesAdmin } from "@/features/categories";
import { useSizeTemplatesAdmin } from "@/features/admin/size-templates";
import { Package, Save, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import {
  useProduct,
  useUpdateProduct,
  useAddProductImage,
  useDeleteProductImage,
} from "@/features/products";
import { VariantManager } from "@/features/variants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { deleteFileFromS3 } from "@/actions/upload";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: product, isLoading: isFetching } = useProduct(id);
  const updateMutation = useUpdateProduct();
  const addImageMutation = useAddProductImage();
  const delImageMutation = useDeleteProductImage();

  const { data: categoriesData } = useAllCategoriesAdmin();
  const { data: templatesData } = useSizeTemplatesAdmin();
  const categories = categoriesData?.data || [];
  const templates = templatesData?.data || [];

  // 🛠️ PAKET DATA REAKTIF: Memetakan data API ke struktur Form secara stabil
  const formValues = useMemo(() => {
    if (!product) return undefined;

    const catIds = Array.isArray(product.categories)
      ? product.categories
          .map((c: any) => c.category?.id || c.categoryId || (typeof c === 'string' ? c : null))
          .filter(Boolean)
      : [];

    const stId = product.detail?.sizeTemplateId || product.detail?.sizeTemplate?.id || "";

    return {
      productCode: product.productCode || "",
      name: product.name || "",
      shortDescription: product.shortDescription || "",
      description: product.detail?.description || "",
      productType: (product.productType?.toLowerCase() as any) || "shoes",
      gender: (product.gender as any) || "Unisex",
      material: product.detail?.material || "",
      outsole: product.detail?.outsole || "",
      closureType: product.detail?.closureType || "",
      origin: product.detail?.origin || "",
      notes: product.detail?.notes || "",
      isActive: !!product.isActive,
      isPopular: !!product.isPopular,
      isBestseller: !!product.isBestseller,
      isNew: !!product.isNew,
      categoryIds: catIds,
      sizeTemplateId: stId,
    };
  }, [product]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductSchemaValues>({
    resolver: zodResolver(productSchema) as any,
    // INI KUNCINYA: Form akan otomatis reset saat data product mendarat/berubah
    values: formValues,
    defaultValues: {
      productCode: "",
      name: "",
      shortDescription: "",
      description: "",
      productType: "shoes",
      gender: "Unisex",
      material: "",
      outsole: "",
      closureType: "",
      origin: "",
      notes: "",
      isActive: true,
      isPopular: false,
      isBestseller: false,
      isNew: true,
      categoryIds: [],
      sizeTemplateId: "",
    },
  });

  const watchSizeTemplateId = watch("sizeTemplateId") || "";
  const selectedTemplate = templates.find(
    (t: any) => t.id === watchSizeTemplateId,
  );

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("❌ Form Errors:", errors);
    }
  }, [errors]);

  const handleUploadImage = async (file: File | Blob) => {
    // Karena ImageUpload mengembalikan Blob hasil kompresi, kita bungkus jadi File
    const fileToUpload =
      file instanceof File
        ? file
        : new File([file], "product-image.webp", { type: "image/webp" });
    await addImageMutation.mutateAsync({ productId: id, file: fileToUpload });
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      const imageToDelete = product?.images.find((img: any) => img.id === imageId);
      
      if (imageToDelete) {
        // 1. Panggil mutasi hapus di Database (Prisma)
        await delImageMutation.mutateAsync({ productId: id, imageId });

        // 2. Panggil fungsi hapus di S3
        // Key asli disimpan di DB, jika tidak ada fallback ke URL parsing
        const fileKey = imageToDelete.key || imageToDelete.url.split(`${process.env.NEXT_PUBLIC_STORAGE_URL}/`).pop();
        if (fileKey) {
          await deleteFileFromS3(fileKey);
        }
        
        toast.success("Gambar berhasil dihapus");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Gagal menghapus gambar";
      toast.error(msg);
    }
  };

  const onSubmit = (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (["categoryIds", "images", "variants"].includes(key)) return;
      if (value !== undefined && value !== null)
        formData.append(key, String(value));
    });

    data.categoryIds.forEach((catId: string) =>
      formData.append("categoryIds", catId),
    );

    updateMutation.mutate(
      { id, formData },
      {
        onSuccess: () => {
          toast.success("Produk berhasil diperbarui!");
          router.push("/dashboard/products");
        },
        onError: (err: any) =>
          toast.error(err?.message || "Gagal mengupdate produk."),
      },
    );
  };

  // Loading terintegrasi: Tunggu Produk, Kategori, dan Template
  const isInitialLoading = isFetching || !product || !categoriesData || !templatesData;

  if (isInitialLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#3C3025]" />
        <p className="text-sm font-medium text-stone-500 animate-pulse">
           Menyiapkan data produk & referensi...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title="Edit Produk"
            description={`ID: ${product?.productCode}`}
          />
        </div>
        {isDirty && (
          <Badge className="bg-amber-100 text-amber-600 border-amber-200 animate-pulse">
            Perubahan Belum Disimpan
          </Badge>
        )}
      </div>

      {/* BANNER ERROR GLOBAL */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
          <p className="text-sm font-bold text-red-600 flex items-center gap-2">
             Ada kesalahan pada form:
          </p>
          <ul className="list-disc list-inside text-xs text-red-500">
            {Object.entries(errors).map(([key, err]: [string, any]) => (
              <li key={key}>{err?.message || `${key} tidak valid`}</li>
            ))}
          </ul>
        </div>
      )}

      {/* FORM UTAMA DIBERI ID */}
      <form id="product-edit-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-stone-800 border-b pb-4">
                Identitas & Spesifikasi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nama Produk *</Label>
                  <Input {...register("name")} className="bg-stone-50/30" />
                  {errors.name && (
                    <p className="text-[10px] text-red-500 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kode Produk *</Label>
                  <Input
                    {...register("productCode")}
                    className="bg-stone-50/30"
                  />
                  {errors.productCode && (
                    <p className="text-[10px] text-red-500 font-medium">
                      {errors.productCode.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Tagline / Deskripsi Singkat *
                  </Label>
                  <Input
                    {...register("shortDescription")}
                    className="bg-stone-50/30"
                  />
                  {errors.shortDescription && (
                    <p className="text-[10px] text-red-500 font-medium">
                      {errors.shortDescription.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50/50 border">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-stone-400">
                    Kategori
                  </Label>
                   <Controller
                    control={control}
                    name="categoryIds"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Select
                          key={`cat-${field.value?.[0]}-${categories.length}`}
                          value={field.value?.[0] || ""}
                          onValueChange={(v) => field.onChange(v ? [v] : [])}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c: any) => {
                              if (field.value?.includes(c.id)) {
                                console.log("✅ Match Found for Category:", c.name);
                              }
                              return (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {errors.categoryIds && (
                          <p className="text-[9px] text-red-500 font-medium">
                            Kategori wajib dipilih
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-stone-400">
                    Tipe
                  </Label>
                  <Controller
                    control={control}
                    name="productType"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shoes">Sepatu</SelectItem>
                          <SelectItem value="apparel">Pakaian</SelectItem>
                          <SelectItem value="accessories">Aksesori</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-stone-400">
                    Gender
                  </Label>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unisex">Unisex</SelectItem>
                          <SelectItem value="Man">Pria</SelectItem>
                          <SelectItem value="Woman">Wanita</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-stone-400">
                    Size Template
                  </Label>
                  <Controller
                    control={control}
                    name="sizeTemplateId"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Select
                          key={`tpl-${field.value}-${templates.length}`}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((t: any) => {
                              if (field.value === t.id) {
                                console.log("✅ Match Found for Template:", t.name);
                              }
                              return (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {errors.sizeTemplateId && (
                          <p className="text-[9px] text-red-500 font-medium">
                            Template wajib dipilih
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-stone-400">
                    Material
                  </Label>
                  <Input {...register("material")} className="h-10" />
                  {errors.material && (
                    <p className="text-[10px] text-red-500 font-medium">
                      {errors.material.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-stone-400">
                    Outsole
                  </Label>
                  <Input {...register("outsole")} className="h-10" />
                </div>
              </div>

              <div className="pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                {["isNew", "isBestseller", "isPopular", "isActive"].map(
                  (key) => (
                    <div key={key} className="space-y-1">
                      <div
                        className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border"
                      >
                        <Label className="text-[9px] font-bold uppercase text-stone-500">
                          {key.replace("is", "")}
                        </Label>
                        <Controller
                          control={control}
                          name={key as any}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="scale-75"
                            />
                          )}
                        />
                      </div>
                      {errors[key as keyof typeof errors] && (
                        <p className="text-[8px] text-red-500 leading-tight">
                          {(errors[key as keyof typeof errors] as any).message}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-stone-900 uppercase">
                  Galeri Foto
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  Auto Save
                </Badge>
              </div>
              <ImageUpload
                images={(product?.images || []).map((img: any) => ({
                  id: img.id,
                  url: img.url,
                }))}
                onUpload={handleUploadImage}
                onRemove={handleRemoveImage}
                maxFiles={4}
              />
            </div>
          </div>

          <div className="lg:col-span-12">
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <h3 className="text-base font-bold text-stone-800 mb-4">
                Deskripsi Lengkap
              </h3>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </form>
      {/* 🛑 FORM UTAMA BERAKHIR DI SINI 🛑 */}

      <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-base font-bold text-stone-800">
            Manajemen Varian & Stok
          </h3>
          <Badge variant="secondary" className="ml-2 text-[10px]">
            Auto Save
          </Badge>
        </div>
        {/* VARIANT MANAGER AMAN DI LUAR FORM UTAMA */}
        <VariantManager
          productId={id}
          productCode={product?.productCode}
          sizeTemplates={
            selectedTemplate?.sizes || product?.detail?.sizeTemplate?.sizes
          }
        />
      </div>

      <div className="flex items-center justify-end gap-3 pb-10">
        <Button variant="ghost" onClick={() => router.back()}>
          Batal
        </Button>
        {/* GUNAKAN ATRIBUT form="product-edit-form" */}
        <Button
          type="submit"
          form="product-edit-form"
          disabled={updateMutation.isPending}
          className="bg-[#3C3025] hover:bg-[#4a3d31] text-white px-10 h-12 font-bold"
        >
          {updateMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          <Save className="w-4 h-4 mr-2" /> Simpan Perubahan Utama
        </Button>
      </div>
    </div>
  );
}
