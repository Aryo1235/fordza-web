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
import { useSizeTemplatesAdmin } from "@/features/size-templates";

// Import schema & types dari feature sendiri
import { productSchema, type ProductSchemaValues } from "../schemas";

export type ProductFormValues = ProductSchemaValues;

interface ProductFormProps {
  initialData?: ProductFormValues & { id?: string };
  onSubmit: (data: ProductFormValues) => void;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
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
      price: 0,
      stock: 0,
      productType: "shoes",
      gender: "Unisex",
      material: "",
      closureType: "",
      outsole: "",
      origin: "",
      notes: "",
      careInstructions: "",
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
            <Label>Kategori</Label>
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <Select
                  value={field.value?.[0] || ""}
                  onValueChange={(val) => field.onChange(val ? [val] : [])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Pilih Kategori --" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryIds && <p className="text-xs text-red-500">{errors.categoryIds.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipe Produk</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Harga (Rp)</Label>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <Input
                    type="text"
                    value={formatNumber(field.value)}
                    onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    placeholder="0"
                  />
                )}
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stok</Label>
              <Controller
                control={control}
                name="stock"
                render={({ field }) => (
                  <Input
                    type="text"
                    value={formatNumber(field.value)}
                    onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    placeholder="0"
                  />
                )}
              />
              {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
            </div>
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
              <Label>Material / Bahan</Label>
              <Input {...register("material")} placeholder="Cth: Leather" />
            </div>
            <div className="space-y-1.5">
              <Label>Penutup (Closure)</Label>
              <Input {...register("closureType")} placeholder="Cth: Laces/Slip-on" />
            </div>
            <div className="space-y-1.5">
              <Label>Outsole (Sol)</Label>
              <Input {...register("outsole")} placeholder="Cth: Rubber" />
            </div>
            <div className="space-y-1.5">
              <Label>Asal / Pembuatan</Label>
              <Input {...register("origin")} placeholder="Cth: Lokal" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Catatan Tambahan</Label>
              <Input {...register("notes")} placeholder="Opsional" />
            </div>
            <div className="space-y-1.5">
              <Label>Perawatan</Label>
              <Input {...register("careInstructions")} placeholder="Opsional" />
            </div>
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

          <div className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="space-y-0.5">
                <Label className="text-base">Tampil di Toko</Label>
                <p className="text-sm text-muted-foreground">Aktifkan agar produk terlihat (Bukan Draft).</p>
              </div>
              <Controller control={control} name="isActive" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
            </div>
            {errors.isActive && <p className="text-xs text-red-500 font-medium">{errors.isActive.message}</p>}
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">Lebih Populer</Label>
              <p className="text-sm text-muted-foreground">Tandai jika ini produk unggulan.</p>
            </div>
            <Controller control={control} name="isPopular" render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )} />
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">Paling Laris</Label>
              <p className="text-sm text-muted-foreground">Beri predikat "Best Seller".</p>
            </div>
            <Controller control={control} name="isBestseller" render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )} />
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base">Produk Baru</Label>
              <p className="text-sm text-muted-foreground">Beri label "New Arrival".</p>
            </div>
            <Controller control={control} name="isNew" render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )} />
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
          {initialData?.id ? "Simpan Perubahan" : "Simpan Produk"}
        </Button>
      </div>
    </form>
  );
}
