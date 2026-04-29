"use client";

// features/products/components/ProductForm.tsx
// Form tambah/edit produk — dipindah dari components/admin/ProductForm.tsx

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { formatNumber, parseNumber } from "@/lib/utils";

// Import hooks dari feature lain
import { useAllCategoriesAdmin } from "@/features/categories";
import { useSizeTemplatesAdmin } from "@/features/admin/size-templates";

// Import schema & types dari feature sendiri
import { productSchema, type ProductSchemaValues } from "../schemas";

export type ProductFormValues = ProductSchemaValues;

interface ProductFormProps {
  initialData?: ProductFormValues & { id?: string };
  onSubmit: (data: ProductFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string; // Override teks tombol simpan
}

export function ProductForm({ initialData, onSubmit, isLoading, submitLabel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData || {
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
      categoryIds: [],
      sizeTemplateId: "",
      isPopular: false,
      isBestseller: false,
      isNew: true,
    },
  });

  // Fetch Kategori & Templates menggunakan hooks resmi
  const { data: categoriesData } = useAllCategoriesAdmin();
  const { data: templatesData } = useSizeTemplatesAdmin();

  const categories = categoriesData?.data || [];
  const templates = templatesData?.data || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col gap-8">
        {/* Bagian Atas: Info Dasar */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Kode Produk (SKU)</Label>
            <Input {...register("productCode")} placeholder="Cth: FDZ-SHOE-001" />
            {errors.productCode && <p className="text-xs text-red-500">{errors.productCode.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Nama Produk</Label>
            <Input {...register("name")} placeholder="Cth: Sepatu Pantofel" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Deskripsi Singkat</Label>
            <Input {...register("shortDescription")} placeholder="Cth: Sepatu kulit pria elegan" />
            {errors.shortDescription && <p className="text-xs text-red-500">{errors.shortDescription.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Kategori <span className="text-red-500">*</span></Label>
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <>
                  <Select
                    value={field.value?.[0] || ""}
                    onValueChange={(val) => {
                      const current = field.value || [];
                      if (val && !current.includes(val)) {
                        field.onChange([...current, val]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Tambah Kategori --" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((id: string) => {
                        const cat = categories.find((c: any) => c.id === id);
                        return (
                          <div key={id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-xs text-stone-700 border border-stone-200">
                            {cat?.name || id}
                            <button
                              type="button"
                              className="ml-1 text-stone-400 hover:text-red-500"
                              onClick={() => field.onChange(field.value.filter((i: string) => i !== id))}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            />
            {errors.categoryIds && <p className="text-xs text-red-500">{errors.categoryIds.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipe Produk <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="productType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shoes">Sepatu (Shoes)</SelectItem>
                      <SelectItem value="apparel">Pakaian (Apparel)</SelectItem>
                      <SelectItem value="accessories">Aksesoris (Accessories)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                      <SelectItem value="Man">Pria (Man)</SelectItem>
                      <SelectItem value="Woman">Wanita (Woman)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Info: Harga & Stok dikelola di Varian */}
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <span className="font-semibold">ℹ️ Harga & Stok</span> dikelola per warna di bagian{" "}
            <span className="font-semibold">"Manajemen Varian"</span> setelah produk disimpan.
          </div>
        </div>

        {/* Garis Pemisah */}
        <div className="border-t border-border pt-6"></div>

        {/* Bagian Bawah: Detail Lanjut */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Deskripsi Lengkap</Label>
            <Textarea
              {...register("description")}
              placeholder="Jelaskan bahan, fitur, dll"
              className="h-24"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Material Utama (Global) <span className="text-red-500">*</span></Label>
              <Input {...register("material")} placeholder="Cth: Genuine Leather / Suede" />
              {errors.material && <p className="text-xs text-red-500">{errors.material.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Material Sol (Outsole)</Label>
              <Input {...register("outsole")} placeholder="Cth: Rubber / TPR / Leather" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipe Penutup / Konstruksi</Label>
              <Input {...register("closureType")} placeholder="Cth: Laces / Slip-on / Stitching" />
            </div>
            <div className="space-y-1.5">
              <Label>Asal / Pembuatan</Label>
              <Input {...register("origin")} placeholder="Cth: Lokal Indonesia" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan (Opsional)</Label>
            <Input {...register("notes")} placeholder="Cth: Cocok untuk acara formal, size cenderung kecil, dll" />
          </div>

          <div className="space-y-1.5">
            <Label>Template Ukuran (Opsional)</Label>
            <Controller
              control={control}
              name="sizeTemplateId"
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Tidak Pakai Template --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Tidak Pakai Template --</SelectItem>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="pt-6 border-t border-stone-100 grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase text-stone-500">Tampil di Toko</Label>
                <p className="text-[9px] text-stone-400 italic font-mono">PUBLISHED</p>
              </div>
              <Controller control={control} name="isActive" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
              )} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase text-stone-500">Lebih Populer</Label>
                <p className="text-[9px] text-stone-400 italic font-mono">TRENDING</p>
              </div>
              <Controller control={control} name="isPopular" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
              )} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase text-stone-500">Paling Laris</Label>
                <p className="text-[9px] text-stone-400 italic font-mono">BEST SELLER</p>
              </div>
              <Controller control={control} name="isBestseller" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
              )} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase text-stone-500">Produk Baru</Label>
                <p className="text-[9px] text-stone-400 italic font-mono">NEW ARRIVAL</p>
              </div>
              <Controller control={control} name="isNew" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
              )} />
            </div>
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
          {submitLabel ?? (initialData?.id ? "Simpan Perubahan" : "Simpan Produk")}
        </Button>
      </div>
    </form>
  );
}
