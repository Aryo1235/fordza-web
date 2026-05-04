"use client";

// features/variants/components/VariantManager.tsx
// UI Admin untuk mengelola Varian + SKU sebuah produk
// Menampilkan daftar varian (per warna) + tabel SKU (per ukuran) di bawah masing-masing varian

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Loader2,
  Package,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useCreateSku,
  useDeleteSku,
} from "../hooks";
import {
  variantSchema,
  skuSchema,
  type VariantSchemaValues,
  type SkuSchemaValues,
} from "../schemas";
import type { ProductVariant, ProductSku } from "../types";
import { StockGrid } from "./VariantBuilder";
import { deleteFileFromS3 } from "@/actions/upload";
import { formatNumber, parseNumber } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

// ─── Sub-komponen: Row SKU ─────────────────────────────────

function SkuRow({ sku, basePrice }: { sku: ProductSku; basePrice: number }) {
  const effectivePrice = sku.priceOverride ?? basePrice;
  const deleteSku = useDeleteSku(sku.variantId);

  const handleDelete = () => {
    if (!confirm(`Hapus ukuran ${sku.size}?`)) return;
    deleteSku.mutate(sku.id, {
      onSuccess: () => toast.success(`Ukuran ${sku.size} dihapus`),
      onError: () => toast.error("Gagal menghapus ukuran"),
    });
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-stone-50 transition-colors group">
      <Badge
        variant="outline"
        className="w-12 justify-center font-bold text-stone-700"
      >
        {sku.size}
      </Badge>
      <span className="text-sm text-stone-600 w-20">
        <span className="font-semibold text-stone-800">{sku.stock}</span> psg
      </span>
      <span className="text-sm flex-1">
        {sku.priceOverride ? (
          <span className="text-amber-700 font-semibold">
            {fmt(effectivePrice)} ✦ bigsize
          </span>
        ) : (
          <span className="text-stone-400 italic text-xs">
            pakai harga dasar
          </span>
        )}
      </span>
      {!sku.isActive && (
        <Badge
          variant="destructive"
          className="text-[10px] px-1.5 py-0 h-4 uppercase mr-2"
        >
          Nonaktif
        </Badge>
      )}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6 text-stone-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
        onClick={handleDelete}
        disabled={deleteSku.isPending}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

// ─── Sub-komponen: Tambah SKU ──────────────────────────────

function AddSkuForm({
  variantId,
  basePrice,
  productId,
  sizeTemplates,
}: {
  variantId: string;
  basePrice: number;
  productId: string;
  sizeTemplates?: string[];
}) {
  const [open, setOpen] = useState(false);
  const createSku = useCreateSku(productId);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SkuSchemaValues>({
    resolver: zodResolver(skuSchema) as any,
    defaultValues: { size: "", stock: 0, priceOverride: null, isActive: true },
  });

  const onSubmit = (data: SkuSchemaValues) => {
    createSku.mutate(
      { variantId, payload: data },
      {
        onSuccess: () => {
          toast.success(`Ukuran ${data.size} ditambahkan`);
          reset();
          setOpen(false);
        },
        onError: (err) => toast.error(err.message || "Gagal menambah ukuran"),
      },
    );
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-stone-400 hover:text-[#3C3025] border border-dashed border-stone-200 mt-1 h-8"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-3 h-3 mr-1" /> Tambah Ukuran
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-2 p-3 border border-stone-200 rounded-md space-y-3 bg-stone-50"
    >
      <p className="text-xs font-semibold text-stone-600">Tambah Ukuran Baru</p>
      <div className="flex gap-2">
        <div className="space-y-1 w-24">
          <Label className="text-xs">Ukuran</Label>
          <Input
            {...register("size")}
            placeholder="cth: 42"
            className="h-8 text-sm"
          />
          {errors.size && (
            <p className="text-xs text-red-500">{errors.size.message}</p>
          )}
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Stok (psg)</Label>
          <Input
            type="number"
            {...register("stock")}
            placeholder="0"
            className="h-8 text-sm"
          />
          {errors.stock && (
            <p className="text-xs text-red-500">{errors.stock.message}</p>
          )}
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Harga Override</Label>
          <Controller
            control={control}
            name="priceOverride"
            render={({ field }) => (
              <Input
                type="text"
                value={field.value ? formatNumber(field.value) : ""}
                onChange={(e) => field.onChange(parseNumber(e.target.value))}
                placeholder={`Default ${fmt(basePrice)}`}
                className="h-8 text-sm"
              />
            )}
          />
          <p className="text-xs text-stone-400">Kosongkan jika harga sama</p>
        </div>
      </div>
      {sizeTemplates && sizeTemplates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-stone-400">Pilihan cepat:</span>
          {sizeTemplates.map((s) => (
            <button
              key={s}
              type="button"
              className="text-xs border border-stone-200 px-2 py-0.5 rounded hover:bg-stone-100"
              onClick={() =>
                ((
                  document.querySelector(
                    "input[name='size']",
                  ) as HTMLInputElement
                ).value = s)
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={createSku.isPending}
          className="bg-[#3C3025] h-8 text-xs"
        >
          {createSku.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Simpan Ukuran"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          onClick={() => setOpen(false)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}

// ─── Sub-komponen: Variant Card ────────────────────────────

function VariantCard({
  variant,
  productId,
  productCode,
  sizeTemplates,
}: {
  variant: ProductVariant;
  productId: string;
  productCode?: string;
  sizeTemplates?: string[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const deleteVariant = useDeleteVariant(productId);

  const totalStock = variant.skus.reduce((s, sku) => s + sku.stock, 0);

  const onDelete = () => {
    if (
      !confirm(
        `Hapus varian "${variant.color}"? Semua ukuran (${variant.skus.length} SKU) akan ikut terhapus.`,
      )
    )
      return;

    // 1. Hapus file fisik dari S3 jika ada
    const cleanupS3 = async () => {
      if (variant.images && variant.images.length > 0) {
        for (const img of variant.images) {
          if (img.key) await deleteFileFromS3(img.key);
        }
      }
    };

    deleteVariant.mutate(variant.id, {
      onSuccess: async () => {
        await cleanupS3();
        toast.success(`Varian "${variant.color}" dihapus`);
      },
      onError: () => toast.error("Gagal menghapus varian"),
    });
  };

  if (isEditing) {
    return (
      <EditVariantForm
        variant={variant}
        productId={productId}
        productCode={productCode}
        sizeTemplates={sizeTemplates}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header Varian */}
      <div
        className="flex items-center gap-3 p-4 bg-white cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-stone-400" />
        )}

        {/* Swatch warna / Image */}
        <div className="w-10 h-10 rounded-lg border border-stone-200 shadow-sm flex-shrink-0 relative overflow-hidden bg-stone-100">
          {variant.images && variant.images.length > 0 ? (
            <img
              src={variant.images[0].url}
              className="w-full h-full object-cover"
              alt={variant.color}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-400 to-stone-600 opacity-20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-stone-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-stone-800 flex items-center gap-1.5 truncate">
            {variant.color}
            {(variant as any).finalPrice < variant.basePrice && (
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                PROMO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
              {variant.variantCode}
            </code>
            {(variant as any).promoName && (
               <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded border border-amber-100 truncate max-w-[100px]">
                  {(variant as any).promoName}
               </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="flex flex-col items-end">
              <p className="text-sm font-bold text-zinc-900 leading-none">
                {fmt(Number((variant as any).finalPrice || variant.basePrice))}
              </p>
              {(variant as any).finalPrice < variant.basePrice && (
                <p className="text-[10px] text-stone-400 line-through mt-0.5 opacity-70">
                  {fmt(Number(variant.basePrice))}
                </p>
              )}
            </div>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-stone-900 font-bold bg-stone-100 px-1.5 rounded">
              {totalStock} Psg
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:text-blue-600 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:text-red-500 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={deleteVariant.isPending}
          >
            {deleteVariant.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Body: Daftar SKU */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-stone-50/50 border-t border-stone-100 flex-1 flex flex-col space-y-1">
          {variant.skus.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-2 italic">
              Belum ada ukuran.
            </p>
          ) : (
            variant.skus
              .sort((a, b) => Number(a.size) - Number(b.size))
              .map((sku) => (
                <SkuRow key={sku.id} sku={sku} basePrice={variant.basePrice} />
              ))
          )}

          <AddSkuForm
            variantId={variant.id}
            basePrice={variant.basePrice}
            productId={productId}
            sizeTemplates={sizeTemplates}
          />
        </div>
      )}
    </div>
  );
}

// ─── Sub-komponen: Tambah Variant Form ───────────────────────

function AddVariantForm({
  productId,
  onClose,
  productCode,
  sizeTemplates = [],
}: {
  productId: string;
  onClose: () => void;
  productCode?: string;
  sizeTemplates?: string[];
}) {
  const createVariant = useCreateVariant(productId);
  const [stockPerSize, setStockPerSize] = useState<Record<string, number>>(
    Object.fromEntries(sizeTemplates.map((s) => [s, 0])),
  );
  const [bigsizeSizes, setBigsizeSizes] = useState<string[]>([]);
  const [bigsizePrice, setBigsizePrice] = useState<number | "">("");
  const [variantImage, setVariantImage] = useState<{
    url: string;
    key: string;
  } | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<VariantSchemaValues>({
    resolver: zodResolver(variantSchema) as any,
    defaultValues: {
      color: "",
      colorCode: null,
      basePrice: 0,
      comparisonPrice: null,
      isActive: true,
      images: [],
    },
  });

  const watchColor = watch("color");
  const watchColorCode = watch("colorCode");
  const watchBasePrice = watch("basePrice") || 0;
  const watchComparisonPrice = watch("comparisonPrice") || 0;

  const calculatedDiscount = useMemo(() => {
    if (!watchBasePrice || !watchComparisonPrice) return 0;
    const bp = Number(watchBasePrice);
    const cp = Number(watchComparisonPrice);
    if (cp <= bp) return 0;
    return Math.round(((cp - bp) / cp) * 100);
  }, [watchBasePrice, watchComparisonPrice]);

  const previewSuffix =
    watchColorCode && watchColorCode.trim()
      ? watchColorCode.toUpperCase().slice(0, 5)
      : watchColor
        ? watchColor
            .toUpperCase()
            .replace(/\s+/g, "")
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 3)
        : "???";
  const previewCode = productCode
    ? `${productCode}-${previewSuffix}`
    : `...-${previewSuffix}`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);

      // 1. Kompresi lokal (mengurangi ukuran file)
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      };
      const compressedBlob = await imageCompression(file, options);

      // 2. Bungkus kembali Blob menjadi File agar S3 / backend menerimanya
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, "") + ".webp",
        { type: "image/webp" },
      );

      // 3. Eksekusi upload ke S3
      const { uploadFileToS3 } = await import("@/actions/upload");
      const formData = new FormData();
      formData.append("file", compressedFile);

      const folder = `products/${productId}/variants`;
      const res = await uploadFileToS3(formData, folder);

      if (res.success && res.url) {
        setVariantImage({ url: res.url, key: res.fileName! });
      } else {
        toast.error(res.message || "Gagal upload gambar");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat memproses gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStockChange = (size: string, val: number) => {
    setStockPerSize((prev) => ({ ...prev, [size]: val }));
  };

  const handleToggleBigsize = (size: string) => {
    setBigsizeSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const onSubmit = (data: VariantSchemaValues) => {
    // 1. Ambil colorCode untuk dipakai menyusun variantCode,
    // tapi jangan masukkan ke dalam 'validData' yang akan dikirim ke Prisma
    const { colorCode, ...validData } = data;

    const skus = sizeTemplates.map((size) => ({
      size,
      stock: stockPerSize[size] || 0,
      priceOverride:
        bigsizeSizes.includes(size) && bigsizePrice !== ""
          ? Number(bigsizePrice)
          : null,
      isActive: true,
    }));

    const payload: any = {
      ...validData, // Mengirim color, basePrice, comparisonPrice, isActive (YANG ADA DI DB)
      basePrice: Number(data.basePrice) || 0,
      comparisonPrice: data.comparisonPrice
        ? Number(data.comparisonPrice)
        : null,
      images: variantImage ? [variantImage] : [],
      skus,
      // ColorCode digunakan di sini untuk mengisi kolom variantCode yang asli
      variantCode: `${productCode}-${colorCode || "VAR"}`,
    };

    createVariant.mutate(payload, {
      onSuccess: async () => {
        if (keyToDelete) {
          await deleteFileFromS3(keyToDelete);
        }
        toast.success(`Varian "${data.color}" berhasil dibuat`);
        reset();
        onClose();
      },
      onError: (err) => toast.error(err.message || "Gagal membuat varian"),
    });
  };
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border border-stone-200 rounded-xl p-5 bg-white space-y-5 shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-stone-700 flex items-center gap-2 uppercase tracking-tight">
          <Plus className="w-4 h-4" /> Tambah Varian Produk
        </div>
        <Badge variant="secondary" className="font-mono text-[10px]">
          {previewCode}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Foto Varian */}
        <div className="md:col-span-1 space-y-2">
          <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Foto Warna
          </Label>
          <div className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center relative overflow-hidden bg-stone-50 transition-all">
            {variantImage ? (
              <>
                <img
                  src={variantImage.url}
                  className="w-full h-full object-cover"
                  alt="Variant"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (variantImage?.key) setKeyToDelete(variantImage.key);
                    setVariantImage(null);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-stone-100">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                ) : (
                  <Plus className="w-5 h-5 text-stone-300" />
                )}
                <span className="text-[9px] text-stone-400 mt-2">
                  Upload Foto
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Input Data */}
        <div className="md:col-span-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Nama Warna <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("color")}
                placeholder="Cth: Hitam, Coklat Muda"
                className="h-9"
              />
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Kode Custom <span className="text-zinc-400">(opt)</span>
              </Label>
              <Input
                {...register("colorCode")}
                placeholder="HTM"
                maxLength={5}
                className="uppercase h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-400">
                Harga Reguler (Coret)
              </Label>
              <Controller
                control={control}
                name="comparisonPrice"
                render={({ field }) => (
                  <Input
                    type="text"
                    value={field.value ? formatNumber(field.value) : ""}
                    onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    placeholder="Rp"
                    className="h-9 border-stone-200 bg-stone-50"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-green-700">
                Harga Jual (Promo) *
              </Label>
              <Controller
                control={control}
                name="basePrice"
                render={({ field }) => (
                  <Input
                    type="text"
                    value={field.value ? formatNumber(field.value) : ""}
                    onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    placeholder="Rp"
                    className="h-9 border-green-200 bg-green-50/50"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400">Potongan (%)</Label>
              <div className="h-9 flex items-center px-3 bg-stone-100 rounded-md border border-stone-200 text-sm font-bold text-amber-600">
                {calculatedDiscount}% OFF
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100">
        <StockGrid
          sizes={sizeTemplates}
          stockPerSize={stockPerSize}
          bigsizeSizes={bigsizeSizes}
          onChange={handleStockChange}
          onToggleBigsize={handleToggleBigsize}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
        <div className="space-y-1">
          <Label className="text-xs">Harga Khusus Bigsize</Label>
          <Input
            type="number"
            value={bigsizePrice}
            onChange={(e) =>
              setBigsizePrice(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            placeholder="Rp"
            className="h-9 border-amber-200 bg-amber-50"
          />
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-9"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createVariant.isPending}
            className="h-9 bg-[#3C3025] hover:bg-stone-800 text-white px-8 font-bold"
          >
            {createVariant.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              "Simpan Varian"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Sub-komponen: Edit Variant Form ───────────────────────

function EditVariantForm({
  variant,
  productId,
  onClose,
  productCode,
  sizeTemplates = [],
}: {
  variant: ProductVariant;
  productId: string;
  onClose: () => void;
  productCode?: string;
  sizeTemplates?: string[];
}) {
  const updateVariant = useUpdateVariant(productId);

  const [stockPerSize, setStockPerSize] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      variant.skus.forEach((sku) => {
        initial[sku.size] = sku.stock;
      });
      return initial;
    },
  );

  const allAvailableSizes = useMemo(() => {
    const fromSkus = variant.skus.map((s) => s.size);
    const combined = Array.from(new Set([...sizeTemplates, ...fromSkus]));
    return combined.sort((a, b) => Number(a) - Number(b));
  }, [sizeTemplates, variant.skus]);

  const [bigsizeSizes, setBigsizeSizes] = useState<string[]>(() =>
    variant.skus
      .filter((sku) => sku.priceOverride !== null)
      .map((sku) => sku.size),
  );

  const [bigsizePrice, setBigsizePrice] = useState<number | "">(() => {
    const firstBigsize = variant.skus.find((sku) => sku.priceOverride !== null);
    return firstBigsize?.priceOverride ?? "";
  });

  const [variantImage, setVariantImage] = useState<{
    url: string;
    key: string;
  } | null>(() =>
    variant.images && variant.images.length > 0
      ? { url: variant.images[0].url, key: variant.images[0].key }
      : null,
  );
  // Lacak key yang perlu dihapus dari S3 jika perubahan disimpan
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, watch } = useForm<VariantSchemaValues>({
    resolver: zodResolver(variantSchema) as any,
    defaultValues: {
      color: variant.color,
      colorCode: variant.variantCode.split("-").pop() || "",
      basePrice: variant.basePrice,
      comparisonPrice: variant.comparisonPrice,
      isActive: variant.isActive,
    },
  });

  const watchColor = watch("color");
  const watchColorCode = watch("colorCode");
  const watchBasePrice = watch("basePrice");
  const watchComparisonPrice = watch("comparisonPrice");

  const calculatedDiscount = useMemo(() => {
    if (!watchBasePrice || !watchComparisonPrice) return 0;
    const bp = Number(watchBasePrice);
    const cp = Number(watchComparisonPrice);
    if (cp <= bp) return 0;
    return Math.round(((cp - bp) / cp) * 100);
  }, [watchBasePrice, watchComparisonPrice]);

  const previewCode = productCode
    ? `${productCode}-${watchColorCode || "???"}`
    : `...-${watchColorCode || "???"}`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);

      // 1. Kompresi lokal (mengurangi ukuran file)
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      };
      const compressedBlob = await imageCompression(file, options);

      // 2. Bungkus kembali Blob menjadi File agar S3 / backend menerimanya
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, "") + ".webp",
        { type: "image/webp" },
      );

      // 3. Eksekusi upload ke S3
      const { uploadFileToS3 } = await import("@/actions/upload");
      const formData = new FormData();
      formData.append("file", compressedFile);

      const folder = `products/${productId}/variants`;
      const res = await uploadFileToS3(formData, folder);

      if (res.success && res.url) {
        setVariantImage({ url: res.url, key: res.fileName! });
      } else {
        toast.error(res.message || "Gagal upload gambar");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat memproses gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStockChange = (size: string, val: number) => {
    setStockPerSize((prev) => ({ ...prev, [size]: val }));
  };

  const handleToggleBigsize = (size: string) => {
    setBigsizeSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const onSubmit = (data: VariantSchemaValues) => {
    // 1. Pisahkan colorCode (data UI) dari data yang dikenal Database (validData)
    const { colorCode, ...validData } = data;

    const skus = allAvailableSizes.map((size) => {
      const existingSku = variant.skus.find((s) => s.size === size);
      return {
        size,
        stock:
          stockPerSize[size] === undefined
            ? (existingSku?.stock ?? 0)
            : stockPerSize[size],
        priceOverride:
          bigsizeSizes.includes(size) && bigsizePrice !== ""
            ? Number(bigsizePrice)
            : null,
        isActive: true,
      };
    });

    const payload: any = {
      ...validData, // Hanya mengirim field yang ada di tabel Prisma
      basePrice: Number(data.basePrice),
      comparisonPrice: data.comparisonPrice
        ? Number(data.comparisonPrice)
        : null,
      images: variantImage ? [variantImage] : [],
      skus,
      // Susun ulang variantCode agar perubahan kode warna ikut tersimpan
      variantCode: `${productCode}-${colorCode || "VAR"}`,
    };

    updateVariant.mutate(
      { variantId: variant.id, payload },
      {
        onSuccess: async () => {
          // Jika ada pergantian/penghapusan gambar, hapus file lama dari S3
          if (keyToDelete) {
             await deleteFileFromS3(keyToDelete);
          }
          toast.success(`Varian "${data.color}" diperbarui`);
          onClose();
        },
        onError: (err) => toast.error(err.message || "Gagal memperbarui"),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-2 border-blue-200 rounded-2xl p-6 bg-white shadow-2xl m-2 space-y-6"
    >
      <div className="flex items-center justify-between border-b pb-4 border-stone-100">
        <div className="text-sm font-bold text-blue-900 flex items-center gap-2">
          <Pencil className="w-4 h-4" /> Edit Varian & Harga Warna
        </div>
        <Badge className="bg-blue-50 text-blue-600 border-blue-100">
          {previewCode}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Gallery Image */}
        <div className="md:col-span-1 space-y-2">
          <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Foto Khusus Warna
          </Label>
          <div className="aspect-square rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center relative overflow-hidden bg-blue-50/30">
            {variantImage ? (
              <>
                <img
                  src={variantImage.url}
                  className="w-full h-full object-cover"
                  alt="Variant"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (variantImage?.key) setKeyToDelete(variantImage.key);
                    setVariantImage(null);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-blue-50 transition-colors">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                ) : (
                  <Plus className="w-5 h-5 text-blue-300" />
                )}
                <span className="text-[9px] text-blue-400 mt-2 font-bold uppercase tracking-tighter">
                  Ganti Foto
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="md:col-span-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nama Warna</Label>
              <Input {...register("color")} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Kode</Label>
              <Input
                {...register("colorCode")}
                maxLength={5}
                className="uppercase h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-stone-400 font-bold">Harga Coret</Label>
              <Input
                type="number"
                {...register("comparisonPrice")}
                className="h-9 bg-stone-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-green-700 font-bold">Harga Promo *</Label>
              <Input
                type="number"
                {...register("basePrice")}
                className="h-9 border-green-200 bg-green-50/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-600 font-bold">Hemat (%)</Label>
              <div className="h-9 flex items-center px-3 bg-amber-50 rounded-md border border-amber-100 text-sm font-bold text-amber-700">
                {calculatedDiscount}% OFF
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100">
        <StockGrid
          sizes={allAvailableSizes}
          stockPerSize={stockPerSize}
          bigsizeSizes={bigsizeSizes}
          onChange={handleStockChange}
          onToggleBigsize={handleToggleBigsize}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
        <div className="space-y-1">
          <Label className="text-xs">Harga Khusus Bigsize</Label>
          <Input
            type="number"
            value={bigsizePrice}
            onChange={(e) =>
              setBigsizePrice(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            placeholder="Rp"
            className="h-9 border-amber-200 bg-amber-50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          className="h-10"
          onClick={onClose}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={updateVariant.isPending}
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold shadow-lg shadow-blue-100"
        >
          {updateVariant.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            "Simpan Perubahan"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Main: VariantManager ──────────────────────────────────

interface VariantManagerProps {
  productId: string;
  productCode?: string; // Untuk generate preview variantCode di form
  /** Ukuran dari SizeTemplate yang dipilih — untuk quick-fill form tambah SKU */
  sizeTemplates?: string[];
}

export function VariantManager({
  productId,
  productCode,
  sizeTemplates,
}: VariantManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: variants, isLoading } = useVariants(productId);

  const totalStock = (variants ?? []).reduce(
    (sum: number, v: ProductVariant) =>
      sum + v.skus.reduce((s: number, sku: ProductSku) => s + sku.stock, 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-stone-800 flex items-center gap-2">
            <Package className="w-4 h-4" /> Manajemen Varian
            <Badge
              variant="secondary"
              className="bg-stone-50 text-stone-400 text-[10px] ml-2"
            >
              Auto Save
            </Badge>
          </div>
          {!isLoading && (
            <div className="text-xs text-stone-400 mt-0.5">
              {(variants ?? []).length} varian · {totalStock} pasang total stok
            </div>
          )}
        </div>
        {!showAddForm && (
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-[#3C3025] hover:bg-[#5a4a38] text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Varian
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Memuat varian...</span>
        </div>
      )}

      {/* Form Tambah Varian */}
      {showAddForm && (
        <AddVariantForm
          productId={productId}
          productCode={productCode}
          sizeTemplates={sizeTemplates}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Daftar Varian */}
      {!isLoading && (variants ?? []).length === 0 && !showAddForm && (
        <div className="text-center py-10 border border-dashed border-stone-200 rounded-xl text-stone-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada varian.</p>
          <p className="text-xs mt-1">
            Klik &quot;Tambah Varian&quot; untuk membuat varian pertama.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {(variants ?? []).map((variant: ProductVariant) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            productId={productId}
            productCode={productCode}
            sizeTemplates={sizeTemplates}
          />
        ))}
      </div>
    </div>
  );
}
