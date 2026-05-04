"use client";

// features/variants/components/VariantBuilder.tsx
// Komponen untuk input varian + stok SEBELUM produk disimpan
// Pure local state — tidak memanggil API sampai parent submit

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Star,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn, formatNumber, parseNumber } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PendingVariant {
  localId: string;
  color: string;
  colorCode: string;
  basePrice: number;
  comparisonPrice?: number;
  discountPercent: number;
  image?: { url: string; key: string } | File;
  bigsizeSizes: string[];
  bigsizePrice?: number;
  stockPerSize: Record<string, number>;
}

// Konversi PendingVariant → format yang dikirim ke API
export function pendingVariantToSkus(v: PendingVariant) {
  return Object.entries(v.stockPerSize).map(([size, stock]) => {
    const isBigsize = v.bigsizeSizes.includes(size);
    return {
      size,
      stock: stock || 0,
      priceOverride: isBigsize && v.bigsizePrice ? v.bigsizePrice : null,
    };
  });
}

// ─── Schema form varian ─────────────────────────────────────────────────────

const variantFormSchema = z.object({
  color: z.string().min(1, "Nama warna wajib"),
  colorCode: z
    .string()
    .max(5, "Maks 5 karakter")
    .regex(/^[A-Z0-9]*$/, "Hanya huruf kapital & angka")
    .optional()
    .nullable(),
  basePrice: z.coerce.number().min(1000, "Min Rp 1.000"),
  comparisonPrice: z.coerce.number().min(0).optional().nullable(),
  discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  bigsizePrice: z.preprocess(
    (val) => (val === "" || val == null ? null : Number(val)),
    z.number().min(1000, "Minimal Rp 1.000").optional().nullable(),
  ),
});

type VariantFormValues = z.infer<typeof variantFormSchema>;

const fmt = (n: number) =>
  n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

// ─── Komponen: Stock Grid per Ukuran ───────────────────────────────────────

export function StockGrid({
  sizes,
  stockPerSize,
  bigsizeSizes,
  onChange,
  onToggleBigsize,
}: {
  sizes: string[];
  stockPerSize: Record<string, number>;
  bigsizeSizes: string[];
  onChange: (size: string, val: number) => void;
  onToggleBigsize: (size: string) => void;
}) {
  if (sizes.length === 0) {
    return (
      <p className="text-xs text-stone-400 italic text-center py-3">
        Pilih Size Template di atas untuk mengisi stok per ukuran
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-xs">Stok & Pengaturan Bigsize</Label>
        {bigsizeSizes.length > 0 && (
          <Badge
            variant="outline"
            className="text-xs text-amber-700 border-amber-300 bg-amber-50"
          >
            {bigsizeSizes.length} ukuran ditandai Bigsize ✦
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isBig = bigsizeSizes.includes(size);
          return (
            <div
              key={size}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-stone-100 bg-white shadow-sm"
            >
              <span
                className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                  isBig
                    ? "bg-amber-100 text-amber-800 font-bold"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {size}
                {isBig ? "✦" : ""}
              </span>
              <Input
                type="number"
                min={0}
                value={stockPerSize[size] ?? 0}
                onChange={(e) => onChange(size, parseInt(e.target.value) || 0)}
                className="w-14 h-8 text-center text-sm p-1"
              />
              <label className="text-[10px] flex items-center gap-1 mt-0.5 text-amber-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBig}
                  onChange={() => onToggleBigsize(size)}
                  className="accent-amber-600"
                />
                Bigsize?
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Komponen: Inline Form Tambah Varian ───────────────────────────────────

function AddVariantInlineForm({
  sizes,
  productCode,
  initialData,
  onAdd,
  onCancel,
}: {
  sizes: string[];
  productCode: string;
  initialData?: PendingVariant;
  onAdd: (v: PendingVariant) => void;
  onCancel: () => void;
}) {
  const [stockPerSize, setStockPerSize] = useState<Record<string, number>>(
    initialData?.stockPerSize || Object.fromEntries(sizes.map((s) => [s, 0])),
  );

  const [bigsizeSizes, setBigsizeSizes] = useState<string[]>(
    initialData?.bigsizeSizes || [],
  );
  const [variantImage, setVariantImage] = useState<
    { url: string; key: string } | File | null
  >(initialData?.image || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.image && !(initialData.image instanceof File)
      ? (initialData.image as any).url
      : null,
  );
  const [isCompressing, setIsCompressing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema) as any,
    defaultValues: initialData
      ? {
          color: initialData.color,
          colorCode: initialData.colorCode,
          basePrice: initialData.basePrice,
          comparisonPrice: initialData.comparisonPrice,
          discountPercent: initialData.discountPercent,
          bigsizePrice: initialData.bigsizePrice,
        }
      : {
          color: "",
          colorCode: null,
          basePrice: 0,
          comparisonPrice: 0,
          discountPercent: 0,
          bigsizePrice: null,
        },
  });

  const watchColor = watch("color");
  const watchColorCode = watch("colorCode");
  const watchBasePrice = watch("basePrice") || 0;
  const watchComparisonPrice = watch("comparisonPrice") || 0;
  const watchDiscount = watch("discountPercent") || 0;

  // Auto-calculate discount percentage when prices change
  useEffect(() => {
    if (watchComparisonPrice > 0 && watchBasePrice > 0) {
      if (watchComparisonPrice > watchBasePrice) {
        const pct = Math.round(
          ((watchComparisonPrice - watchBasePrice) / watchComparisonPrice) *
            100,
        );
        if (pct !== watchDiscount) {
          setValue("discountPercent", pct);
        }
      } else {
        setValue("discountPercent", 0);
      }
    }
  }, [watchBasePrice, watchComparisonPrice]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Preview variantCode real-time
  const suffix = watchColorCode?.trim()
    ? watchColorCode.toUpperCase().slice(0, 5)
    : watchColor
      ? watchColor
          .toUpperCase()
          .replace(/\s+/g, "")
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 3)
      : "???";
  const previewCode = `${productCode}-${suffix}`;

  const onSubmit = (data: VariantFormValues) => {
    onAdd({
      localId: initialData?.localId || crypto.randomUUID(),
      color: data.color,
      colorCode: data.colorCode?.toUpperCase() || suffix,
      basePrice: data.basePrice,
      comparisonPrice: data.comparisonPrice || undefined,
      discountPercent: data.discountPercent || 0,
      image: variantImage || undefined,
      bigsizeSizes,
      bigsizePrice: data.bigsizePrice || undefined,
      stockPerSize,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);

      // 1. Kompresi & Konversi ke WebP di Browser
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Simpan file hasil kompresi ke state lokal
      setVariantImage(compressedFile);

      // 3. Buat preview lokal
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error("Gagal memproses gambar:", err);
      toast.error("Gagal memproses gambar. Coba file lain.");
    } finally {
      setIsCompressing(false);
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

  return (
    <div className="border-2 border-[#3C3025]/20 border-dashed rounded-xl p-5 space-y-5 bg-stone-50/50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-700">
          {initialData ? "Edit Varian Warna" : "Tambah Warna Baru"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400">
            Kode: {previewCode}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Kolom 1: Upload Gambar Varian */}
        <div className="md:col-span-1 space-y-2">
          <Label className="text-xs font-bold text-stone-500 uppercase tracking-widest">
            Foto Warna
          </Label>
          <div
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all bg-white",
              variantImage ? "border-green-200" : "border-stone-200",
            )}
          >
            {variantImage ? (
              <>
                <img
                  src={
                    previewUrl ||
                    (variantImage && !(variantImage instanceof Blob)
                      ? (variantImage as any).url
                      : "")
                  }
                  className="w-full h-full object-cover"
                  alt="Variant"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVariantImage(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-stone-50 transition-colors">
                {isCompressing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                ) : (
                  <Plus className="w-5 h-5 text-stone-300" />
                )}
                <span className="text-[9px] text-stone-400 mt-2 text-center px-2">
                  {isCompressing
                    ? "Memproses WebP..."
                    : "Klik untuk upload foto warna"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isCompressing}
                />
              </label>
            )}
          </div>
        </div>

        {/* Kolom 2: Form Input */}
        <div className="md:col-span-3 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
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
            <div className="space-y-1">
              <Label className="text-xs">
                Kode{" "}
                <span className="text-[9px] font-normal text-stone-400">
                  (opt)
                </span>
              </Label>
              <Input
                {...register("colorCode")}
                placeholder="HTM"
                maxLength={5}
                className="h-9 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
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
            <div className="space-y-1">
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
              {errors.basePrice && (
                <p className="text-xs text-red-500">
                  {errors.basePrice.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-stone-400">Potongan (%)</Label>
              <div className="h-9 flex items-center px-3 bg-stone-100 rounded-md border border-stone-200 text-sm font-bold text-amber-600">
                {watchDiscount}% OFF
              </div>
              <input type="hidden" {...register("discountPercent")} />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Harga Khusus Bigsize (Opsional)</Label>
          <Controller
            control={control}
            name="bigsizePrice"
            render={({ field }) => (
              <Input
                type="text"
                value={field.value ? formatNumber(field.value) : ""}
                onChange={(e) => field.onChange(parseNumber(e.target.value))}
                placeholder="Rp"
                className="h-9 border-amber-300 bg-amber-50"
              />
            )}
          />
          {errors.bigsizePrice && (
            <p className="text-xs text-red-500">
              {errors.bigsizePrice.message}
            </p>
          )}
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9"
            onClick={onCancel}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 bg-[#3C3025] hover:bg-[#5a4a38] text-white px-6 font-bold"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
          >
            {initialData ? "Simpan Perubahan" : "Konfirmasi Warna"}
          </Button>
        </div>
      </div>

      {/* Stok per Ukuran */}
      <div className="pt-2">
        <StockGrid
          sizes={sizes}
          stockPerSize={stockPerSize}
          bigsizeSizes={bigsizeSizes}
          onChange={handleStockChange}
          onToggleBigsize={handleToggleBigsize}
        />
      </div>
    </div>
  );
}

// ─── Komponen: Pending Variant Card ────────────────────────────────────────

function PendingVariantCard({
  sizes,
  variant,
  onEdit,
  onRemove,
}: {
  sizes: string[];
  variant: PendingVariant;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalStock = Object.values(variant.stockPerSize).reduce(
    (a, b) => a + b,
    0,
  );
  const sizeCount = Object.keys(variant.stockPerSize).filter(
    (s) => (variant.stockPerSize[s] || 0) > 0,
  ).length;

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div
        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-stone-400" />
          )}
          {/* Thumbnail Image */}
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden">
            {variant.image ? (
              <img
                src={
                  variant.image instanceof Blob
                    ? URL.createObjectURL(variant.image)
                    : variant.image.url
                }
                className="w-full h-full object-cover"
                alt={variant.color}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">
                <Plus className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 truncate">
              {variant.color}
            </span>
            <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-mono text-stone-500">
              {variant.colorCode}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-green-700">
              Rp {variant.basePrice.toLocaleString()}
            </span>
            {variant.comparisonPrice &&
              variant.comparisonPrice > variant.basePrice && (
                <>
                  <span className="text-[10px] text-stone-400 line-through">
                    Rp {variant.comparisonPrice.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded">
                    -{variant.discountPercent}%
                  </span>
                </>
              )}
          </div>
        </div>

        <div className="text-right flex-shrink-0 pr-2">
          <div className="text-[10px] font-bold text-stone-900">
            {totalStock} Psg
          </div>
          <div className="text-[9px] text-stone-400">{sizeCount} ukuran</div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:text-blue-500 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:text-red-500 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expand: tampilkan grid stok */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-stone-50/50 border-t border-stone-100">
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const stock = variant.stockPerSize[size] || 0;
              const isBig = variant.bigsizeSizes.includes(size);
              return (
                <div key={size} className="flex flex-col items-center gap-0.5">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                      isBig
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {size}
                    {isBig ? "✦" : ""}
                  </span>
                  <span className="text-xs font-semibold text-stone-700">
                    {stock}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main: VariantBuilder ──────────────────────────────────────────────────

interface VariantBuilderProps {
  /** Ukuran dari size template yang dipilih */
  sizes: string[];
  /** Kode produk induk untuk preview variantCode */
  productCode: string;
  /** Callback state saat variants berubah */
  onChange: (variants: PendingVariant[]) => void;
}

export function VariantBuilder({
  sizes,
  productCode,
  onChange,
}: VariantBuilderProps) {
  const [variants, setVariants] = useState<PendingVariant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);

  const addVariant = (v: PendingVariant) => {
    // Kalau sedang edit, replace. Kalau baru, tambah.
    const updated = editingLocalId
      ? variants.map((existing) =>
          existing.localId === v.localId ? v : existing,
        )
      : [...variants, v];

    setVariants(updated);
    onChange(updated);
    setShowForm(false);
    setEditingLocalId(null);
  };

  const removeVariant = (localId: string) => {
    const updated = variants.filter((v) => v.localId !== localId);
    setVariants(updated);
    onChange(updated);
  };

  const startEdit = (localId: string) => {
    setEditingLocalId(localId);
    setShowForm(true);
  };

  const totalStock = variants.reduce(
    (sum, v) => sum + Object.values(v.stockPerSize).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-800 flex items-center gap-2">
            <Star className="w-4 h-4" /> Varian Warna & Stok
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {variants.length > 0
              ? `${variants.length} warna · ${totalStock} pasang total`
              : "Tambahkan minimal 1 warna"}
          </p>
        </div>
        {!showForm && (
          <Button
            type="button"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={sizes.length === 0}
            className={`text-white ${sizes.length > 0 ? "bg-[#3C3025] hover:bg-[#5a4a38]" : "bg-stone-300 cursor-not-allowed"}`}
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Warna
          </Button>
        )}
      </div>

      {/* Info jika belum ada size template */}
      {sizes.length === 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          ⚠️ Pilih <strong>Size Template</strong> di atas terlebih dahulu agar
          ukuran muncul di sini.
        </div>
      )}

      {/* Daftar Varian Pending */}
      {variants.map((v) => {
        // Jika sedang diedit, tidak usah tampilkan card-nya
        if (showForm && editingLocalId === v.localId) return null;
        return (
          <PendingVariantCard
            key={v.localId}
            sizes={sizes}
            variant={v}
            onEdit={() => startEdit(v.localId)}
            onRemove={() => removeVariant(v.localId)}
          />
        );
      })}

      {/* Form Tambah/Edit */}
      {showForm && (
        <AddVariantInlineForm
          sizes={sizes}
          productCode={productCode || "FDZ-???"}
          initialData={variants.find((v) => v.localId === editingLocalId)}
          onAdd={addVariant}
          onCancel={() => {
            setShowForm(false);
            setEditingLocalId(null);
          }}
        />
      )}

      {/* Empty state */}
      {!showForm && variants.length === 0 && (
        <div className="text-center py-8 border border-dashed border-stone-200 rounded-xl text-stone-400">
          <p className="text-sm">Belum ada varian warna.</p>
          <p className="text-xs mt-1">
            Klik &quot;Tambah Warna&quot; untuk mulai.
          </p>
        </div>
      )}
    </div>
  );
}
