'use client';

// features/variants/components/VariantManager.tsx
// UI Admin untuk mengelola Varian + SKU sebuah produk
// Menampilkan daftar varian (per warna) + tabel SKU (per ukuran) di bawah masing-masing varian

import { useEffect, useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
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
import { formatNumber, parseNumber, formatRupiah } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

// ─── Sub-komponen: Row SKU ─────────────────────────────────

function SkuRow({
  sku,
  basePrice,
  productId,
  sizeTemplates = [],
}: {
  sku: ProductSku;
  basePrice: number;
  productId: string;
  sizeTemplates?: string[];
}) {
  const effectivePrice = sku.priceOverride ?? basePrice;
  const deleteSku = useDeleteSku(productId);
  const [showConfirm, setShowConfirm] = useState(false);

  const onConfirmDelete = () => {
    deleteSku.mutate(sku.id, {
      onSuccess: () => {
        toast.success(`Ukuran ${sku.size} dihapus`);
        setShowConfirm(false);
      },
      onError: () => {
        toast.error("Gagal menghapus ukuran");
        setShowConfirm(false);
      },
    });
  };

  const isDeletable = !sizeTemplates.includes(sku.size);

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
            {formatRupiah(effectivePrice)} ✦ bigsize
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
      {isDeletable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-stone-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
          onClick={() => setShowConfirm(true)}
          disabled={deleteSku.isPending}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={onConfirmDelete}
        isLoading={deleteSku.isPending}
        title="Hapus Ukuran?"
        description={`Apakah Anda yakin ingin menghapus ukuran ${sku.size}? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}

// ─── Sub-komponen: Tambah SKU ──────────────────────────────

function AddSkuForm({
  variantId,
  basePrice,
  productId,
  sizeTemplates,
  existingSizes = [],
  sizeTemplateType,
  productCustomSizes = [],
  productCustomMeasurements = {},
  onCustomSizeAdded,
}: {
  variantId: string;
  basePrice: number;
  productId: string;
  sizeTemplates?: string[];
  existingSizes?: string[];
  sizeTemplateType?: string;
  productCustomSizes?: string[];
  productCustomMeasurements?: Record<string, any>;
  onCustomSizeAdded?: (newCustomSizes: string[], newCustomMeasurements: Record<string, any>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [insoleLength, setInsoleLength] = useState("");
  const [insoleWidth, setInsoleWidth] = useState("");
  const [ld, setLd] = useState("");
  const [pb, setPb] = useState("");
  const [lingkar, setLingkar] = useState("");
  const [volume, setVolume] = useState("");
  const [berat, setBerat] = useState("");
  const [panjang, setPanjang] = useState("");
  const [lebar, setLebar] = useState("");
  const [tinggi, setTinggi] = useState("");
  const [panjangTali, setPanjangTali] = useState("");
  const [detail, setDetail] = useState("");
  const createSku = useCreateSku(productId);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SkuSchemaValues>({
    resolver: zodResolver(skuSchema) as any,
    defaultValues: { size: "", stock: "" as any, priceOverride: null, isActive: true },
  });

  const watchedSize = watch("size") || "";
  // Deteksi apakah ukuran yang diinput adalah ukuran baru di luar template + customSizes
  const allKnownSizes = [...(sizeTemplates || []), ...productCustomSizes];
  const tType = (sizeTemplateType || "").toLowerCase();
  const isNewCustomSize =
    watchedSize.trim().length > 0 &&
    !allKnownSizes.includes(watchedSize.trim());

  const onSubmit = (data: SkuSchemaValues) => {
    const isCustom = !allKnownSizes.includes(data.size.trim());
    createSku.mutate(
      { variantId, payload: data },
      {
        onSuccess: async () => {
          // Jika ukuran kustom baru, update ProductDetail
          if (isCustom && onCustomSizeAdded) {
            const meas: Record<string, string> = {};
            if (tType === "sepatu") {
              if (insoleLength) meas.insoleLength = insoleLength;
              if (insoleWidth) meas.insoleWidth = insoleWidth;
            } else if (tType === "apparel" || tType === "pakaian") {
              if (ld) meas.ld = ld;
              if (pb) meas.pb = pb;
            } else if (tType === "parfum") {
              if (volume) meas.volume = volume;
              if (berat) meas.berat = berat;
            } else if (tType === "aksesoris" || tType === "accessories" || tType === "gelang") {
              if (panjang) meas.panjang = panjang;
              if (lebar) meas.lebar = lebar;
              if (tinggi) meas.tinggi = tinggi;
              if (lingkar) meas.lingkar = lingkar;
              if (panjangTali) meas.panjangTali = panjangTali;
              if (detail) meas.detail = detail;
            } else {
              if (lingkar) meas.lingkar = lingkar;
            }
            const newCustomSizes = [...productCustomSizes, data.size.trim()];
            const newCustomMeasurements = { ...productCustomMeasurements, [data.size.trim()]: meas };
            onCustomSizeAdded(newCustomSizes, newCustomMeasurements);
          }
          toast.success(`Ukuran ${data.size} ditambahkan`);
          reset();
          setInsoleLength(""); setInsoleWidth(""); setLd(""); setPb(""); setLingkar(""); setVolume(""); setBerat("");
          setPanjang(""); setLebar(""); setTinggi(""); setPanjangTali(""); setDetail("");
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
    <div
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
                placeholder={`Default ${formatRupiah(basePrice)}`}
                className="h-8 text-sm"
              />
            )}
          />
          <p className="text-xs text-stone-400">Kosongkan jika harga sama</p>
        </div>
      </div>
      {(sizeTemplates?.length || existingSizes?.length) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Saran Ukuran:</span>

          {/* Logika Pintar: -1 dari terkecil dan +1 dari terbesar */}
          {(() => {
            const numericSizes = existingSizes
              .map(s => parseInt(s))
              .filter(n => !isNaN(n))
              .sort((a, b) => a - b);

            if (numericSizes.length === 0) return null;

            const prevSize = numericSizes[0] - 1;
            const nextSize = numericSizes[numericSizes.length - 1] + 1;

            return (
              <div className="flex gap-1.5">
                <button
                  key="prev-size-btn"
                  type="button"
                  className="text-[10px] bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full hover:bg-stone-200 font-bold text-stone-600 transition-colors"
                  onClick={() => setValue("size", prevSize.toString(), { shouldValidate: true })}
                >
                  {prevSize} (Bawah)
                </button>
                <button
                  key="next-size-btn"
                  type="button"
                  className="text-[10px] bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full hover:bg-stone-200 font-bold text-stone-600 transition-colors"
                  onClick={() => setValue("size", nextSize.toString(), { shouldValidate: true })}
                >
                  {nextSize} (Atas)
                </button>
              </div>
            );
          })()}

          {/* Template Default jika ada */}
          {sizeTemplates?.filter(s => !existingSizes.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              className="text-[10px] border border-stone-200 px-2 py-0.5 rounded hover:bg-stone-100 text-stone-500"
              onClick={() => setValue("size", s, { shouldValidate: true })}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {/* Input dimensi otomatis muncul jika ukuran baru di luar template */}
      {isNewCustomSize && (
        <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-lg space-y-2">
          <p className="text-[10px] font-bold text-orange-600 uppercase">
            Ukuran kustom — masukkan dimensi fisik (opsional)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {tType === "sepatu" && (
              <>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Panjang Insole (cm)</Label>
                  <Input value={insoleLength} onChange={e => setInsoleLength(e.target.value)} placeholder="Cth: 29" type="number" step="0.1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Lebar Insole (cm)</Label>
                  <Input value={insoleWidth} onChange={e => setInsoleWidth(e.target.value)} placeholder="Cth: 10" type="number" step="0.1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
              </>
            )}
            {["apparel", "pakaian"].includes(tType) && (
              <>
                <div className="space-y-0.5"><Label className="text-[10px] text-stone-500">LD (cm)</Label><Input value={ld} onChange={e => setLd(e.target.value)} placeholder="52" type="number" step="0.5" className="h-7 text-xs bg-white border-orange-200" /></div>
                <div className="space-y-0.5"><Label className="text-[10px] text-stone-500">PB (cm)</Label><Input value={pb} onChange={e => setPb(e.target.value)} placeholder="74" type="number" step="0.5" className="h-7 text-xs bg-white border-orange-200" /></div>
              </>
            )}
            {tType === "parfum" && (
              <>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Volume (ml)</Label>
                  <Input value={volume} onChange={e => setVolume(e.target.value)} placeholder="50" type="number" step="1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Berat (gr)</Label>
                  <Input value={berat} onChange={e => setBerat(e.target.value)} placeholder="150" type="number" step="1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
              </>
            )}
            {(tType === "aksesoris" || tType === "accessories" || tType === "gelang") && (
              <>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Panjang (cm)</Label>
                  <Input value={panjang} onChange={e => setPanjang(e.target.value)} placeholder="P" type="number" step="0.1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Lebar (cm)</Label>
                  <Input value={lebar} onChange={e => setLebar(e.target.value)} placeholder="L" type="number" step="0.1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Tinggi (cm)</Label>
                  <Input value={tinggi} onChange={e => setTinggi(e.target.value)} placeholder="T" type="number" step="0.1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Lingkar (cm)</Label>
                  <Input value={lingkar} onChange={e => setLingkar(e.target.value)} placeholder="Lingkar" type="number" step="0.1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-stone-500">Panjang Tali (cm)</Label>
                  <Input value={panjangTali} onChange={e => setPanjangTali(e.target.value)} placeholder="P. Tali" type="number" step="0.1" className="h-7 text-xs bg-white border-orange-200" />
                </div>
                <div className="space-y-0.5 col-span-2">
                  <Label className="text-[10px] text-stone-500">Keterangan Bebas</Label>
                  <Input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Cth: tali panjang 60cm" className="h-7 text-xs bg-white border-orange-200" />
                </div>
              </>
            )}
            {!["sepatu", "apparel", "pakaian", "parfum", "aksesoris", "accessories", "gelang"].includes(tType) && (
              <div className="space-y-0.5"><Label className="text-[10px] text-stone-500">Lingkar (cm)</Label><Input value={lingkar} onChange={e => setLingkar(e.target.value)} placeholder="18" type="number" step="0.5" className="h-7 text-xs bg-white border-orange-200" /></div>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={createSku.isPending}
          className="bg-[#3C3025] h-8 text-xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          }}
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
    </div>
  );
}

// ─── Sub-komponen: Variant Card ────────────────────────────

function VariantCard({
  variant,
  variants = [],
  productId,
  productCode,
  sizeTemplates,
  sizeTemplateType,
  productCustomSizes = [],
  productCustomMeasurements = {},
  onCustomSizeAdded,
}: {
  variant: ProductVariant;
  variants?: ProductVariant[];
  productId: string;
  productCode?: string;
  sizeTemplates?: string[];
  sizeTemplateType?: string;
  productCustomSizes?: string[];
  productCustomMeasurements?: Record<string, any>;
  onCustomSizeAdded?: (newSizes: string[], newMeasurements: Record<string, any>) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteVariant = useDeleteVariant(productId);

  const totalStock = variant.skus.reduce((s, sku) => s + sku.stock, 0);

  const onConfirmDelete = async () => {
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
        setShowConfirm(false);
      },
      onError: () => {
        toast.error("Gagal menghapus varian");
        setShowConfirm(false);
      },
    });
  };

  if (isEditing) {
    return (
      <EditVariantForm
        variant={variant}
        variants={variants}
        productId={productId}
        productCode={productCode}
        sizeTemplates={sizeTemplates}
        sizeTemplateType={sizeTemplateType}
        productCustomSizes={productCustomSizes}
        productCustomMeasurements={productCustomMeasurements}
        onCustomSizeAdded={onCustomSizeAdded}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header Varian */}
      <div
        className="flex flex-col items-start gap-2.5 p-4 bg-white cursor-pointer hover:bg-stone-50 transition-colors w-full"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Baris 1: Identitas Utama & Aksi */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
            )}

            {/* Swatch warna / Image */}
            <div className="w-10 h-10 rounded-lg border border-stone-200 shadow-sm shrink-0 relative overflow-hidden bg-stone-100">
              {variant.images && variant.images.length > 0 ? (
                <img
                  src={variant.images[0].url}
                  className="w-full h-full object-cover"
                  alt={variant.color}
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-stone-400 to-stone-600 opacity-20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-stone-400" />
                </div>
              )}
            </div>

            {/* Nama Warna & Badge PROMO */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#3C3025]">
                {variant.color}
              </span>
              {(variant as any).finalPrice < variant.basePrice && (
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
                  PROMO
                </span>
              )}
            </div>
          </div>

          {/* Tombol Aksi Edit / Hapus */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:text-blue-600 shrink-0"
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
              className="h-8 w-8 hover:text-red-500 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
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

        {/* Baris 2: Detail Komersial (SKU, Promo Tag, Harga, & Stok) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70 p-3 rounded-xl border border-stone-100/80 w-full mt-1">
          {/* Info SKU & Promo */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">SKU:</span>
              <code className="text-[10px] font-mono bg-white border border-stone-200/80 text-stone-600 px-1.5 py-0.5 rounded leading-none">
                {variant.variantCode}
              </code>
            </div>
            {(variant as any).promoName && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Promo:</span>
                <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 leading-none">
                  🏷️ {(variant as any).promoName}
                </span>
              </div>
            )}
          </div>

          {/* Info Harga & Stok */}
          <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/60">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Harga</span>
              <p className="text-sm font-bold text-zinc-900 leading-none">
                {formatRupiah(Number(variant.basePrice))}
              </p>
              {(variant as any).finalPrice < variant.basePrice && (
                <p className="text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-1 leading-none whitespace-nowrap">
                  Promo: {formatRupiah(Number((variant as any).finalPrice))}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Stok</span>
              <p className="text-[10px] text-stone-700 font-bold bg-stone-200/60 border border-stone-300/40 px-2 py-1 rounded whitespace-nowrap">
                {totalStock} Psg
              </p>
            </div>
          </div>
        </div>


      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={onConfirmDelete}
        isLoading={deleteVariant.isPending}
        title="Hapus Varian?"
        description={`Hapus varian "${variant.color}"? Semua ukuran (${variant.skus.length} SKU) akan ikut terhapus secara permanen.`}
      />

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
                <SkuRow
                  key={sku.id}
                  sku={sku}
                  basePrice={variant.basePrice}
                  productId={productId}
                  sizeTemplates={sizeTemplates}
                />
              ))
          )}
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
      ...data,
      basePrice: Number(data.basePrice) || 0,
      comparisonPrice: data.comparisonPrice
        ? Number(data.comparisonPrice)
        : null,
      images: variantImage ? [variantImage] : [],
      skus,
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
    <div
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

      <div className="flex flex-col gap-5">
        {/* Foto Varian */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Foto Warna
          </Label>
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center relative overflow-hidden bg-stone-50 transition-all">
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
        <div className="space-y-4">
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
                {...register("colorCode", { setValueAs: (v) => v?.toUpperCase() || null })}
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
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
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
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
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
        {bigsizeSizes.length > 0 ? (
          <div className="space-y-1">
            <Label className="text-xs">Harga Khusus Bigsize</Label>
            <Input
              type="text"
              value={bigsizePrice ? formatNumber(Number(bigsizePrice)) : ""}
              onChange={(e) => {
                const val = parseNumber(e.target.value);
                setBigsizePrice(val || "");
              }}
              placeholder="Rp"
              className="h-9 border-amber-200 bg-amber-50"
            />
          </div>
        ) : (
          <div />
        )}
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
            type="button"
            disabled={createVariant.isPending}
            className="h-9 bg-[#3C3025] hover:bg-stone-800 text-white px-8 font-bold"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(onSubmit)(e);
            }}
          >
            {createVariant.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              "Simpan Varian"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-komponen: Edit Variant Form ───────────────────────

function EditVariantForm({
  variant,
  variants = [],
  productId,
  onClose,
  productCode,
  sizeTemplates = [],
  sizeTemplateType,
  productCustomSizes: customSizes = [],
  productCustomMeasurements: customMeasurements = {},
  onCustomSizeAdded: handleCustomSizeAdded,
}: {
  variant: ProductVariant;
  variants?: ProductVariant[];
  productId: string;
  onClose: () => void;
  productCode?: string;
  sizeTemplates?: string[];
  sizeTemplateType?: string;
  productCustomSizes?: string[];
  productCustomMeasurements?: Record<string, any>;
  onCustomSizeAdded?: (newSizes: string[], newMeasurements: Record<string, any>) => void;
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

  const [isUploading, setIsUploading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const [deletingSize, setDeletingSize] = useState<string | null>(null);
  const [skuToDelete, setSkuToDelete] = useState<{ id: string; size: string } | null>(null);

  const { register, handleSubmit, watch, control, setValue } =
    useForm<VariantSchemaValues>({
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


  // Restore logic: deteksi perubahan agar status kembali ke 'idle'
  useEffect(() => {
    setSaveState("idle");
  }, [
    watchColor,
    watchColorCode,
    watchBasePrice,
    watchComparisonPrice,
    variantImage,
    bigsizePrice,
    bigsizeSizes,
    stockPerSize,
  ]);

  // LOGIKA BARU: Sync state ketika data SKU di database berubah (misal setelah tambah ukuran)
  useEffect(() => {
    const newStock: Record<string, number> = {};
    variant.skus.forEach((s) => {
      newStock[s.size] = s.stock;
    });
    setStockPerSize(newStock);

    const newBigsizes = variant.skus
      .filter((s) => s.priceOverride !== null)
      .map((s) => s.size);
    setBigsizeSizes(newBigsizes);

    const firstBigsize = variant.skus.find((s) => s.priceOverride !== null);
    if (firstBigsize) setBigsizePrice(firstBigsize.priceOverride!);
  }, [variant.skus]);

  const deleteSku = useDeleteSku(productId);

  const onConfirmDeleteSku = () => {
    if (!skuToDelete) return;

    setDeletingSize(skuToDelete.size);
    deleteSku.mutate(skuToDelete.id, {
      onSuccess: () => {
        setStockPerSize((prev) => {
          const next = { ...prev };
          delete next[skuToDelete.size];
          return next;
        });

        // Cek apakah ukuran ini kustom dan tidak digunakan di varian lain
        const isCustom = !sizeTemplates.includes(skuToDelete.size);
        const isSizeUsedElsewhere = (variants || []).some(
          (v) => v.id !== variant.id && v.skus.some((s) => s.size === skuToDelete.size)
        );

        if (isCustom && !isSizeUsedElsewhere && handleCustomSizeAdded) {
          const newCustomSizes = customSizes.filter((s) => s !== skuToDelete.size);
          const newCustomMeasurements = { ...customMeasurements };
          delete newCustomMeasurements[skuToDelete.size];
          handleCustomSizeAdded(newCustomSizes, newCustomMeasurements);
        }

        toast.success(`Ukuran ${skuToDelete.size} berhasil dihapus`);
        setSkuToDelete(null);
        setDeletingSize(null);
      },
      onError: (err) => {
        toast.error(err.message || "Gagal menghapus ukuran");
        setSkuToDelete(null);
        setDeletingSize(null);
      },
    });
  };

  const handleDeleteSku = (size: string) => {
    const targetSku = variant.skus.find((s) => s.size === size);
    if (!targetSku) {
      // Jika ukuran belum ada di DB (hanya di template), cukup hapus dari state lokal
      setStockPerSize((prev) => {
        const next = { ...prev };
        delete next[size];
        return next;
      });
      return;
    }

    setSkuToDelete({ id: targetSku.id, size });
  };

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
    // Hanya kirim SKU jika ukurannya ada di template standar atau memiliki stock terdefinisi di state
    const filteredSizes = allAvailableSizes.filter(
      (size) => sizeTemplates.includes(size) || stockPerSize[size] !== undefined
    );

    const skus = filteredSizes.map((size) => {
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
      ...data,
      basePrice: Number(data.basePrice),
      comparisonPrice: data.comparisonPrice
        ? Number(data.comparisonPrice)
        : null,
      images: variantImage ? [variantImage] : [],
      skus,
    };

    updateVariant.mutate(
      { variantId: variant.id, payload },
      {
        onSuccess: async () => {
          // Jika ada pergantian/penghapusan gambar, hapus file lama dari S3
          if (keyToDelete) {
            await deleteFileFromS3(keyToDelete);
          }
          setSaveState("saved");
          toast.success(`Varian "${data.color}" diperbarui`);
          onClose();
        },
        onError: (err) => toast.error(err.message || "Gagal memperbarui"),
      },
    );
  };

  return (
    <div
      className="border-2 border-blue-200 rounded-2xl p-6 bg-white shadow-2xl m-2 space-y-6"
    >
      <div className="flex items-center justify-between border-b pb-4 border-stone-100">
        <div className="text-sm font-bold text-blue-900 flex items-center gap-2">
          <Pencil className="w-4 h-4" /> Edit Varian (Simpan Mandiri)
        </div>
        <div className="flex items-center gap-2">
          {saveState === "saved" && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
              Tersimpan
            </Badge>
          )}
          <Badge className="bg-blue-50 text-blue-600 border-blue-100">
            {previewCode}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Gallery Image */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Foto Khusus Warna
          </Label>
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center relative overflow-hidden bg-blue-50/30">
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nama Warna</Label>
              <Input {...register("color")} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Kode</Label>
              <Input
                {...register("colorCode", { setValueAs: (v) => v?.toUpperCase() || null })}
                maxLength={5}
                className="uppercase h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-stone-400 font-bold">Harga Coret</Label>
              <Controller
                control={control}
                name="comparisonPrice"
                render={({ field }) => (
                  <Input
                    type="text"
                    value={field.value ? formatNumber(field.value) : ""}
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
                    placeholder="Rp"
                    className="h-9 bg-stone-50"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-green-700 font-bold">Harga Promo *</Label>
              <Controller
                control={control}
                name="basePrice"
                render={({ field }) => (
                  <Input
                    type="text"
                    value={field.value ? formatNumber(field.value) : ""}
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
                    placeholder="Rp"
                    className="h-9 border-green-200 bg-green-50/30"
                  />
                )}
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
          onDelete={handleDeleteSku}
          deletingSize={deletingSize}
          sizeTemplates={sizeTemplates}
        />

        {/* Form Tambah Ukuran (Hanya di mode Edit) */}
        <div className="mt-4 pt-4 border-t border-stone-50">
          <AddSkuForm
            variantId={variant.id}
            basePrice={variant.basePrice}
            productId={productId}
            sizeTemplates={sizeTemplates}
            existingSizes={variant.skus.map((s) => s.size)}
            sizeTemplateType={sizeTemplateType}
            productCustomSizes={customSizes}
            productCustomMeasurements={customMeasurements}
            onCustomSizeAdded={handleCustomSizeAdded}
          />
        </div>
      </div>

      {bigsizeSizes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
          <div className="space-y-1">
            <Label className="text-xs">Harga Khusus Bigsize</Label>
            <Input
              type="text"
              value={bigsizePrice ? formatNumber(Number(bigsizePrice)) : ""}
              onChange={(e) => {
                const val = parseNumber(e.target.value);
                setBigsizePrice(val || "");
              }}
              placeholder="Rp"
              className="h-9 border-amber-200 bg-amber-50"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col items-end pt-4 border-t border-stone-100 gap-4">
        <div className="flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-lg border border-stone-200">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <>
                <Switch
                  id="variant-active-switch"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor="variant-active-switch"
                  className="text-sm font-bold text-stone-700 cursor-pointer"
                >
                  {field.value
                    ? "Varian Aktif (Tampil)"
                    : "Varian Disembunyikan"}
                </Label>
              </>
            )}
          />
        </div>
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            className="h-10"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={updateVariant.isPending}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold shadow-lg shadow-blue-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(onSubmit)(e);
            }}
          >
            {updateVariant.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              "Simpan Varian"
            )}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!skuToDelete}
        onOpenChange={(open) => {
          if (!open) setSkuToDelete(null);
        }}
        onConfirm={onConfirmDeleteSku}
        isLoading={deleteSku.isPending}
        title="Hapus Ukuran?"
        description={`Apakah Anda yakin ingin menghapus ukuran ${skuToDelete?.size}? Tindakan ini permanen.`}
      />
    </div>
  );
}

// ─── Main: VariantManager ──────────────────────────────────

interface VariantManagerProps {
  productId: string;
  productCode?: string; // Untuk generate preview variantCode di form
  /** Ukuran dari SizeTemplate yang dipilih - untuk quick-fill form tambah SKU */
  sizeTemplates?: string[];
  /** Tipe template (sepatu/apparel/aksesoris) untuk input dimensi kustom */
  sizeTemplateType?: string;
  /** Ukuran kustom yang sudah tersimpan di ProductDetail */
  productCustomSizes?: string[];
  /** Dimensi fisik ukuran kustom yang sudah tersimpan di ProductDetail */
  productCustomMeasurements?: Record<string, any>;
  onCustomSizeAdded?: (newSizes: string[], newMeasurements: Record<string, any>) => void;
}

export function VariantManager({
  productId,
  productCode,
  sizeTemplates,
  sizeTemplateType,
  productCustomSizes = [],
  productCustomMeasurements = {},
  onCustomSizeAdded,
}: VariantManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [customSizes, setCustomSizes] = useState<string[]>(productCustomSizes);
  const [customMeasurements, setCustomMeasurements] = useState<Record<string, any>>(productCustomMeasurements);
  const { data: variants, isLoading } = useVariants(productId);

  // Sync dengan props ketika data produk dimuat ulang
  useEffect(() => {
    setCustomSizes(productCustomSizes);
    setCustomMeasurements(productCustomMeasurements);
  }, [JSON.stringify(productCustomSizes), JSON.stringify(productCustomMeasurements)]);

  const handleCustomSizeAdded = async (newSizes: string[], newMeasurements: Record<string, any>) => {
    setCustomSizes(newSizes);
    setCustomMeasurements(newMeasurements);
    if (onCustomSizeAdded) {
      onCustomSizeAdded(newSizes, newMeasurements);
    }
    // Simpan ke backend
    const fd = new FormData();
    fd.append("customSizes", JSON.stringify(newSizes));
    fd.append("customMeasurements", JSON.stringify(newMeasurements));
    try {
      await fetch(`/api/admin/products/${productId}`, { method: "PUT", body: fd });
      toast.success("Ukuran kustom disimpan ke produk");
    } catch {
      toast.error("Gagal menyimpan ukuran kustom ke produk");
    }
  };

  // Gabungan ukuran template + kustom (untuk saran di AddSkuForm)
  const allSizesForForm = [...(sizeTemplates || []), ...customSizes.filter(s => !(sizeTemplates || []).includes(s))];

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
              Save per Varian
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
            variants={variants ?? []}
            productId={productId}
            productCode={productCode}
            sizeTemplates={sizeTemplates}
            sizeTemplateType={sizeTemplateType}
            productCustomSizes={customSizes}
            productCustomMeasurements={customMeasurements}
            onCustomSizeAdded={handleCustomSizeAdded}
          />
        ))}
      </div>
    </div>
  );
}
