"use client";

// app/(admin)/dashboard/products/new/page.tsx
// 1 form, 1 save — product + semua varian + SKU dikirim sekaligus

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VariantBuilder,
  type PendingVariant,
  pendingVariantToSkus,
} from "@/features/variants";
import { useAllCategoriesAdmin } from "@/features/categories";
import { useSizeTemplatesAdmin } from "@/features/size-templates";
import { useCreateProduct } from "@/features/products";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Star, Package, Settings, Info } from "lucide-react";
import {
  productSchema,
  type ProductSchemaValues,
} from "@/features/products/schemas";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function NewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();

  const [files, setFiles] = useState<File[]>([]);
  const [pendingVariants, setPendingVariants] = useState<PendingVariant[]>([]);

  const { data: categoriesData } = useAllCategoriesAdmin();
  const { data: templatesData } = useSizeTemplatesAdmin();
  const categories = categoriesData?.data || [];
  const templates = templatesData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProductSchemaValues>({
    resolver: zodResolver(productSchema) as any,
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
      categoryIds: [],
      sizeTemplateId: "",
      isPopular: false,
      isBestseller: false,
      isNew: true,
      images: [],
      variants: [],
    },
  });

  const watchProductCode = watch("productCode") || "";
  const watchSizeTemplateId = watch("sizeTemplateId") || "";
  const selectedTemplate = templates.find(
    (t: any) => t.id === watchSizeTemplateId,
  );
  const sizes: string[] = selectedTemplate?.sizes || [];

  // Gambar sementara
  const previewImages = files.map((f, i) => ({
    id: `${f.name}-${i}`,
    url: URL.createObjectURL(f),
  }));

  const onSubmit = (data: any) => {
    // Validasi Wajib: Minimal 1 gambar produk
    if (files.length === 0) {
      toast.error("Minimal 1 foto produk utama harus diunggah!");
      return;
    }

    // Validasi Wajib: Minimal harus ada 1 varian
    if (pendingVariants.length === 0) {
      toast.error(
        "Minimal 1 varian warna harus ditambahkan agar produk memiliki harga & stok!",
      );
      return;
    }

    // 🛑 3. VALIDASI BARU: Cek apakah ada varian yang belum diupload gambarnya
    const variantWithoutImage = pendingVariants.find((v) => !v.image);
    if (variantWithoutImage) {
      toast.error(
        `Wajib mengunggah gambar untuk varian warna: ${variantWithoutImage.color}`,
      );
      return; // Hentikan proses submit ke backend!
    }

    const formData = new FormData();

    // Basic fields
    formData.append("productCode", data.productCode);
    formData.append("name", data.name);
    formData.append("shortDescription", data.shortDescription);
    formData.append("productType", data.productType);
    formData.append("gender", data.gender);
    formData.append("isActive", String(data.isActive));
    formData.append("isPopular", String(data.isPopular ?? false));
    formData.append("isBestseller", String(data.isBestseller ?? false));
    formData.append("isNew", String(data.isNew ?? true));

    if (data.description) formData.append("description", data.description);
    if (data.material) formData.append("material", data.material);
    if (data.outsole) formData.append("outsole", data.outsole);
    if (data.closureType) formData.append("closureType", data.closureType);
    if (data.origin) formData.append("origin", data.origin);
    if (data.notes) formData.append("notes", data.notes);
    if (data.sizeTemplateId)
      formData.append("sizeTemplateId", data.sizeTemplateId);

    data.categoryIds.forEach((id: string) =>
      formData.append("categoryIds", id),
    );
    files.forEach((file) => formData.append("images", file));

    // Konversi varian → format API
    const variantsPayload = pendingVariants.map((v, index) => {
      // PERUBAHAN DI SINI: Ganti File menjadi Blob
      const isNewFile = v.image instanceof Blob;

      if (isNewFile) {
        // PERUBAHAN DI SINI: Cast sebagai Blob
        formData.append(`variant_images_${index}`, v.image as Blob);
      }

      return {
        color: v.color,
        colorCode: v.colorCode,
        basePrice: v.basePrice,
        comparisonPrice: v.comparisonPrice,
        discountPercent: v.discountPercent,
        skus: pendingVariantToSkus(v),
        // Kita beri tahu backend index mana yang punya gambar file
        imageFileIndex: isNewFile ? index : null,
        existingImage: !isNewFile ? v.image : null,
      };
    });
    formData.append("variants", JSON.stringify(variantsPayload));

    createMutation.mutate(formData, {
      onSuccess: (result: any) => {
        toast.success("Produk berhasil disimpan!");
        router.push("/dashboard/products");
      },
      onError: (err: any) => {
        toast.error(err?.message || "Gagal membuat produk");
      },
    });
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <PageHeader
        title="Tambah Produk Baru"
        description="Isi semua informasi produk dan varian warna, lalu simpan sekaligus."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        {/* ROW 1: Identitas (8) & Galeri (4) - PINNED TO TOP */}

        {/* Blok 1: Identitas & Spesifikasi (Kiri - Col 8) */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-6 flex-1">
            <div className="flex items-center gap-2 mb-2 pb-4 border-b border-stone-50">
              <div className="w-1.5 h-6 bg-[#3C3025] rounded-full" />
              <h3 className="text-base font-bold text-stone-800">
                Identitas & Spesifikasi Utama
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-600">
                  Nama Produk <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("name")}
                  placeholder="Nama Sepatu"
                  className="bg-stone-50/30 border-stone-100 h-10"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-600">
                  Kode Produk <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("productCode")}
                  placeholder="FDZ-SHOE-001"
                  className="bg-stone-50/30 border-stone-100 h-10"
                />
                {errors.productCode && (
                  <p className="text-xs text-red-500">
                    {errors.productCode.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-stone-600">
                  Tagline / Deskripsi Singkat{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("shortDescription")}
                  placeholder="Jelaskan keunggulan produk dalam 1 kalimat pendek"
                  className="bg-stone-50/30 border-stone-100 h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-stone-50/50 border border-stone-100">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-stone-400">
                  Kategori
                </Label>
                <Controller
                  control={control}
                  name="categoryIds"
                  render={({ field }) => (
                    <Select
                      value={field.value?.[0] || ""}
                      onValueChange={(v) => field.onChange(v ? [v] : [])}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Pilih..." />
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-stone-400">
                  Tipe
                </Label>
                <Controller
                  control={control}
                  name="productType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
            </div>

            {/* Tech Specs: Pola "Dua Kanan Dua Kiri" */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-stone-50">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-stone-400">
                  Material Utama <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("material")}
                  placeholder="Cth: Genuine Leather"
                  className="bg-stone-50/30 border-stone-100 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-stone-400">
                  Material Sol (Outsole)
                </Label>
                <Input
                  {...register("outsole")}
                  placeholder="Cth: Rubber TPR"
                  className="bg-stone-50/30 border-stone-100 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-stone-400">
                  Tipe Penutup
                </Label>
                <Input
                  {...register("closureType")}
                  placeholder="Cth: Tali / Laces"
                  className="bg-stone-50/30 border-stone-100 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-stone-400">
                  Negara Asal
                </Label>
                <Input
                  {...register("origin")}
                  placeholder="Cth: Indonesia"
                  className="bg-stone-50/30 border-stone-100 h-10"
                />
              </div>
            </div>

            {/* Size Template: Menonjol (Biru) */}
            <div className="space-y-1.5 pt-4">
              <Label className="text-xs font-bold text-blue-600">
                Standard Size Template <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="sizeTemplateId"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="border-blue-100 bg-blue-50/30 h-11">
                      <SelectValue placeholder="Pilih standar ukuran (Wajib untuk membuat varian)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sizeTemplateId && (
                <p className="text-[10px] text-red-500">
                  {errors.sizeTemplateId.message}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-stone-50 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50/50 border border-stone-100">
                <Label className="text-[9px] font-bold uppercase text-stone-400">
                  New
                </Label>
                <Controller
                  control={control}
                  name="isNew"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="scale-75"
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50/50 border border-stone-100">
                <Label className="text-[9px] font-bold uppercase text-stone-400">
                  Hot
                </Label>
                <Controller
                  control={control}
                  name="isBestseller"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="scale-75"
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50/50 border border-stone-100">
                <Label className="text-[9px] font-bold uppercase text-stone-400">
                  Pop
                </Label>
                <Controller
                  control={control}
                  name="isPopular"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="scale-75"
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50/50 border border-stone-100 font-bold">
                <Label className="text-[9px] font-bold uppercase text-blue-600">
                  Live
                </Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="scale-75"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Blok 2: Galeri Media (Kanan - Col 4) - SYNC HEIGHT */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4 text-stone-400" /> Galeri Foto
              </h3>
              <Badge
                variant="outline"
                className="text-stone-400 border-stone-200"
              >
                Maks 4
              </Badge>
            </div>

            <div className="flex-1 flex flex-col ">
              <ImageUpload
                images={previewImages}
                onUpload={async (f) => setFiles((p) => [...p, f])}
                onRemove={async (id) =>
                  setFiles((p) => p.filter((f, i) => `${f.name}-${i}` !== id))
                }
                maxFiles={4}
                className="flex-1"
              />
            </div>

            {/* Photo Guidelines: Pengisi Ruang Vertikal sesuai permintaan Anda */}
            <div className="mt-4 pt-4 border-t border-stone-50 space-y-3">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Tips Foto Produk
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/30 border border-amber-100/30">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 text-xs">
                    ☀️
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-stone-700">
                      Pencahayaan Terang
                    </p>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      Gunakan cahaya alami / studio agar detail material
                      terlihat jelas.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/30 border border-blue-100/30">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 text-xs">
                    📷
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-stone-700">
                      Sudut 45 Derajat
                    </p>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      Ambil foto dari sudut samping depan untuk dimensi sepatu
                      yang pas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Flipped Bento - Catatan (4) & Deskripsi (8) */}

        {/* Blok 3: Catatan Produk (Kiri - Col 4) - SYNC HEIGHT */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm h-full flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-50">
              <div className="w-1.5 h-0 bg-amber-500 rounded-full" />
              <h3 className="text-base font-bold text-stone-800">
                Catatan Produk
              </h3>
            </div>
            <div className="flex-1 flex flex-col">
              <Label className="text-xs font-semibold text-stone-400 mb-2 block uppercase tracking-wider">
                Tampil ke Pelanggan
              </Label>
              <Textarea
                {...register("notes")}
                placeholder="Catatan khusus gaya / tips perawatan yang akan tampil di halaman produk..."
                className="bg-amber-50/30 border-amber-100 focus:ring-amber-200 flex-1 min-h-[200px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Blok 4: Deskripsi Lengkap (Kanan - Col 8) - SYNC HEIGHT */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex flex-col h-full flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-stone-50 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-0 bg-[#3C3025] rounded-full" />
                <h3 className="text-base font-bold text-stone-800">
                  Deskripsi Lengkap Produk
                </h3>
              </div>
              <Badge className="bg-stone-50 text-stone-400 border-none text-[10px]">
                HTML Content
              </Badge>
            </div>
            <div className="flex-1 min-h-[250px] flex flex-col">
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ceritakan detail produk, keunggulan, dan panduan ukuran di sini..."
                    className="flex-1"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* ROW 3: Inventori (Full 12) */}
        <div className="lg:col-span-12">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-stone-50">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
              <h3 className="text-base font-bold text-stone-800">
                Konfigurasi Varian Warna & Stok Dasar
              </h3>
            </div>
            <VariantBuilder
              sizes={sizes}
              productCode={watchProductCode}
              onChange={setPendingVariants}
            />
          </div>
        </div>

        <div className="lg:col-span-12 flex items-center justify-end gap-3 pb-8 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="text-stone-400 hover:bg-stone-50"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-[#3C3025] hover:bg-[#5a4a38] text-white px-10 h-12 font-bold shadow-xl shadow-stone-200 transition-all active:scale-95"
          >
            {createMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Simpan Produk & Semua Varian
          </Button>
        </div>
      </form>
    </div>
  );
}
