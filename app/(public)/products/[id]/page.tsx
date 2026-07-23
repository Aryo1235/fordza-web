"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { use } from "react";
import { RelatedProducts, ProductTestimonials, usePublicProduct, type Product } from "@/features/products";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";
import { FadeUpSection } from "@/components/shared/animations";

/* ── Animation variants ── */
const galleryVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const infoVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const infoItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: product, isLoading: loading } = usePublicProduct(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const getMeasurementText = (size: string, sizeTemplate: any, customMeasurements?: any) => {
    // Cek customMeasurements dulu (ukuran kustom per-produk)
    const measSource = (customMeasurements?.[size]) || (sizeTemplate?.measurements?.[size]);
    if (!measSource) return null;
    const meas = measSource;

    const tType = (sizeTemplate?.type || "").toLowerCase();
    if (tType === "sepatu" || tType === "shoes") {
      const length = meas.insoleLength || meas.insole || "";
      const width = meas.insoleWidth || "";
      if (length && width) return `${length}x${width} cm`;
      if (length) return `${length} cm`;
      return null;
    }
    if (tType === "apparel" || tType === "pakaian") {
      const ld = meas.ld || "";
      const pb = meas.pb || "";
      if (ld && pb) return `LD:${ld} PB:${pb}`;
      if (ld) return `LD:${ld}`;
      if (pb) return `PB:${pb}`;
      return null;
    }
    if (tType === "parfum" || tType === "perfume") {
      const vol = meas.volume || "";
      if (vol) return `Vol: ${vol} ml`;
      return null;
    }
    if (tType === "aksesoris" || tType === "gelang" || tType === "accessories") {
      const subtype = sizeTemplate?.measurements?._subtype || "";
      if (subtype === "tas") {
        const p = meas.panjang || "-";
        const l = meas.lebar || "-";
        const t = meas.tinggi || "-";
        return `P: ${p} L: ${l} T: ${t} cm`;
      }
      if (subtype === "gelang") {
        return meas.lingkar ? `Lingkar: ${meas.lingkar} cm` : null;
      }
      if (subtype === "tali") {
        return meas.panjangTali ? `P. Tali: ${meas.panjangTali} cm` : null;
      }
      if (subtype === "klip") {
        const p = meas.panjang || "-";
        const l = meas.lebar || "-";
        return `P: ${p} L: ${l} cm`;
      }
      if (subtype === "lainnya") {
        return meas.detail || null;
      }

      // Legacy fallback
      const p = meas.panjang || "";
      const l = meas.lebar || "";
      const t = meas.tinggi || "";
      if (p || l || t) {
        return `${p || "-"}/${l || "-"}/${t || "-"} cm`;
      }
      if (meas.lingkar) return `${meas.lingkar} cm`;
      return meas.detail || null;
    }
    return meas.detail || null;
  };

  const getDetailedMeasurementSentence = (size: string, sizeTemplate: any, customMeasurements?: any) => {
    // Cek customMeasurements dulu (ukuran kustom per-produk)
    const measSource = (customMeasurements?.[size]) || (sizeTemplate?.measurements?.[size]);
    if (!measSource) return null;
    const meas = measSource;

    const tType = (sizeTemplate?.type || "").toLowerCase();
    if (tType === "sepatu" || tType === "shoes") {
      const length = meas.insoleLength || meas.insole || "";
      const width = meas.insoleWidth || "";
      if (length && width) return `Panjang Insole: ${length} cm, Lebar Insole: ${width} cm`;
      if (length) return `Panjang Insole: ${length} cm`;
      return null;
    }
    if (tType === "apparel" || tType === "pakaian") {
      const ld = meas.ld || "";
      const pb = meas.pb || "";
      if (ld && pb) return `Lebar Dada (LD): ${ld} cm, Panjang Badan (PB): ${pb} cm`;
      if (ld) return `Lebar Dada (LD): ${ld} cm`;
      if (pb) return `Panjang Badan (PB): ${pb} cm`;
      return null;
    }
    if (tType === "parfum" || tType === "perfume") {
      const vol = meas.volume || "";
      if (vol) return `Volume Bersih: ${vol} ml`;
      return null;
    }
    if (tType === "aksesoris" || tType === "gelang" || tType === "accessories") {
      const subtype = sizeTemplate?.measurements?._subtype || "";
      if (subtype === "tas") {
        const p = meas.panjang || "-";
        const l = meas.lebar || "-";
        const t = meas.tinggi || "-";
        return `Panjang: ${p} cm, Lebar: ${l} cm, Tinggi: ${t} cm`;
      }
      if (subtype === "gelang") {
        return meas.lingkar ? `Lingkar Gelang: ${meas.lingkar} cm` : null;
      }
      if (subtype === "tali") {
        return meas.panjangTali ? `Panjang Tali: ${meas.panjangTali} cm` : null;
      }
      if (subtype === "klip") {
        const p = meas.panjang || "-";
        const l = meas.lebar || "-";
        return `Panjang: ${p} cm, Lebar: ${l} cm`;
      }
      if (subtype === "lainnya") {
        return meas.detail || null;
      }

      // Legacy fallback
      const p = meas.panjang || "";
      const l = meas.lebar || "";
      const t = meas.tinggi || "";
      if (p || l || t) {
        return `Panjang: ${p || "-"} cm, Lebar: ${l || "-"} cm, Tinggi: ${t || "-"} cm`;
      }
      if (meas.lingkar) return `Lingkar: ${meas.lingkar} cm`;
      return meas.detail || null;
    }
    return meas.detail || null;
  };

  // Set default variant saat data pertama kali tiba
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  // Derived selected variant
  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId) || (product?.variants?.[0] || null);

  // Derived Gallery Images (General + Selected Variant Images)
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = [...product.images];
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      return [...selectedVariant.images, ...images];
    }
    return images;
  }, [product, selectedVariant]);

  // When variant changes, reset gallery to first image
  useEffect(() => {
    if (selectedVariantId) {
      setSelectedImage(0);
      setSelectedSize(null);
    }
  }, [selectedVariantId]);

  const selectedSizeInfo = useMemo(() => {
    if (!selectedVariant || !selectedSize) return null;
    return selectedVariant.skus.find(s => s.size === selectedSize) || null;
  }, [selectedVariant, selectedSize]);

  // Ukuran unik yang benar-benar punya SKU di produk ini
  // Gabungkan sizes dari template + customSizes, lalu filter hanya yang ada di SKU
  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return [];
    const templateSizes: string[] = product.detail?.sizeTemplate?.sizes || [];
    const customSizes: string[] = product.detail?.customSizes || [];
    const allSizes = Array.from(new Set([...templateSizes, ...customSizes]));
    // Tampilkan hanya ukuran yang punya SKU di setidaknya 1 varian
    const sizesWithSkus = new Set<string>();
    product.variants.forEach((v: any) => {
      v.skus?.forEach((s: any) => sizesWithSkus.add(s.size));
    });
    return allSizes
      .filter(s => sizesWithSkus.has(s))
      .sort((a, b) => {
        const numA = Number(a), numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
  }, [product]);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 pt-20">
        <main className="mx-auto max-w-7xl px-6">
          <div className="animate-pulse">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="aspect-square rounded-2xl bg-amber-100 border border-amber-200/50" />
              <div className="space-y-6 pt-4">
                <div className="h-10 w-3/4 rounded bg-amber-100" />
                <div className="h-6 w-1/2 rounded bg-amber-100" />
                <div className="h-12 w-1/3 rounded bg-amber-100" />
                <div className="h-40 rounded-xl bg-amber-100" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-black text-[#4A3B2E] uppercase">Produk Tidak Ditemukan</h1>
          <Link href="/products" className="mt-4 inline-block text-sm font-bold text-amber-600 hover:text-amber-800 hover:underline">
            ← Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="  selection:bg-[#4A3B2E] selection:text-white ">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 md:px-20 lg:px-10 ">

        {/* Breadcrumb — fade in cepat */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Link href="/products" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#4A3B2E]/60 hover:text-[#4A3B2E] transition-colors">
            <span className="mr-2">←</span> Kembali ke Katalog
          </Link>
        </motion.div>

        {/* Product Detail Grid */}
        <div className="grid md:gap-8 xl:gap-0 lg:grid-cols-2 items-start">

          {/* Gallery — fade-in + scale */}
          <motion.div
            className="space-y-4 lg:sticky lg:top-14.5 py-2 "
            variants={galleryVariants}
            initial="hidden"
            animate="show"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-200 shadow-sm group  lg:max-w-130 xl:max-w-120  mx-auto">
              <div className="relative  lg:h-130 xl:h-120  w-full z-10">
                {galleryImages[selectedImage] ? (
                  <motion.img
                    key={selectedImage}
                    src={galleryImages[selectedImage].url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.03 }}
                    style={{ imageRendering: "-webkit-optimize-contrast" }}
                    loading="lazy"
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-stone-50 text-stone-300">
                    <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails — stagger fade-in */}
            {galleryImages.length > 1 && (
              <motion.div
                className="flex gap-3 overflow-x-auto pb-2 "
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } } }}
              >
                {galleryImages.map((img: any, idx: number) => (
                  <motion.button
                    key={img.id || idx}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 relative bg-[#FEF4E8]",
                      idx === selectedImage
                        ? "border-[#4A3B2E] shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-amber-200"
                    )}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-16 w-16 md:h-16 md:w-16 object-cover mix-blend-darken"
                    />
                    {idx === selectedImage && (
                      <div className="absolute inset-0 bg-[#4A3B2E]/5" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Product Info — stagger children */}
          <motion.div
            className="space-y-8 pb-10"
            variants={infoVariants}
            initial="hidden"
            animate="show"
          >
            {/* Badges + Nama + Rating */}
            <motion.div variants={infoItem}>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {product.isNew && (
                  <span className="rounded-[3px] bg-[#2267A2] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Terbaru
                  </span>
                )}
                {product.isBestseller && (
                  <span className="rounded-[3px] bg-[#C14444] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Terlaris
                  </span>
                )}
                {product.isPopular && (
                  <span className="rounded-[3px] bg-[#4A3B2E] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Populer
                  </span>
                )}
                {product.categories.map((c: any) => (
                  <span
                    key={c.category.id}
                    className="rounded-[3px] bg-white border border-amber-200/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4A3B2E]"
                  >
                    {c.category.name}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl font-black text-[#4A3B2E] sm:text-2xl md:text-3xl tracking-tight leading-none mb-3">
                {product.name}
              </h1>
              <p className="text-base md:text-lg text-[#4A3B2E]/60 font-medium">
                {product.shortDescription}
              </p>

              {/* Rating */}
              {product.totalReviews > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < Math.round(product.avgRating) ? "" : "opacity-30"}>★</span>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#4A3B2E]">
                    {product.avgRating.toFixed(1)} <span className="text-[#4A3B2E]/50 font-normal">({product.totalReviews} ulasan)</span>
                  </span>
                </div>
              )}
            </motion.div>

            {/* Price */}
            <motion.div variants={infoItem} className="flex flex-col gap-1 py-6 border-y border-amber-200/50">
              {(() => {
                // Harga final aktif: pakai finalPrice SKU jika size dipilih, atau fallback ke varian/produk
                const currentFinalPrice = selectedSizeInfo?.finalPrice
                  ? Number(selectedSizeInfo.finalPrice)
                  : Number(selectedVariant?.finalPrice || product.finalPrice || product.price);

                // Deteksi bigsize: SKU yang punya priceOverride
                const skuPriceOverride = selectedSizeInfo?.priceOverride
                  ? Number(selectedSizeInfo.priceOverride)
                  : null;
                const isBigsizeSelected = !!skuPriceOverride;

                // Harga referensi produk (comparisonPrice/gimmick) — berlaku untuk semua ukuran
                const variantHighestPrice = Number(selectedVariant?.highestPrice || product.highestPrice || product.price || 0);

                // Harga coret — pakai referensi tertinggi yang ada:
                // - Jika bigsize lebih murah dari referensi produk (130k < 150k) → pakai referensi (150k)
                // - Jika bigsize lebih mahal dari referensi (180k > 150k) → pakai priceOverride (180k)
                //   agar harga coret = harga asli bigsize sebelum promo
                // - Ukuran normal: selalu pakai referensi produk (variantHighestPrice)
                const effectiveHighestPrice = isBigsizeSelected
                  ? Math.max(skuPriceOverride!, variantHighestPrice)
                  : variantHighestPrice;

                // Badge diskon: hanya tampil jika ada saving nyata dari harga coret
                const totalDiscountPercent =
                  effectiveHighestPrice > currentFinalPrice
                    ? Math.round(((effectiveHighestPrice - currentFinalPrice) / effectiveHighestPrice) * 100)
                    : 0;

                return (
                  <>
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <p className="text-4xl font-black text-[#4A3B2E] tracking-tight">{formatRupiah(currentFinalPrice)}</p>
                      {totalDiscountPercent > 0 && (
                        <span className="rounded bg-[#C14444] px-2.5 py-1 text-xs font-black uppercase tracking-widest text-white shadow-sm">
                          Hemat {totalDiscountPercent}%
                        </span>
                      )}
                      {isBigsizeSelected && (
                        <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                          Bigsize
                        </span>
                      )}
                    </div>
                    {effectiveHighestPrice > currentFinalPrice && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-base font-bold text-[#4A3B2E]/40 line-through decoration-[#4A3B2E]/30">
                          {formatRupiah(effectiveHighestPrice)}
                        </span>
                        {selectedVariant?.promoName && (
                          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm">
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {selectedVariant.promoName}
                            </span>
                            {selectedVariant.promoMinPurchase && Number(selectedVariant.promoMinPurchase) > 0 ? (
                              <span className="text-[9px] font-bold  tracking-tight opacity-90 border-l border-amber-300 pl-1.5">
                                min. {formatRupiah(selectedVariant.promoMinPurchase).replace("Rp ", "Rp")}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold lowercase tracking-tight opacity-90 border-l border-amber-300 pl-1.5">
                                tanpa min. belanja
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>

            {/* Variant Selection (Colors) */}
            {(product.variants?.length ?? 0) > 0 && (
              <motion.div variants={infoItem} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/60">
                    Warna Terpilih: <span className="text-[#4A3B2E]">{selectedVariant?.color}</span>
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.variants?.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cn(
                        "group relative flex flex-col items-center transition-all outline-none",
                        selectedVariantId === v.id ? "scale-105" : "opacity-70 hover:opacity-100 hover:scale-105"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-full border-[3px] transition-all p-[2px]",
                        selectedVariantId === v.id ? "border-[#4A3B2E]" : "border-transparent"
                      )}>
                        <div className="h-full w-full rounded-full border border-amber-200 bg-white overflow-hidden shadow-sm">
                          {v.images && v.images.length > 0 ? (
                            <img src={v.images[0].url} className="h-full w-full object-cover" alt={v.color} />
                          ) : (
                            <div className="h-full w-full bg-[#4A3B2E]" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Size Selection */}
            {product.detail?.sizeTemplate && (
              <motion.div variants={infoItem} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/60">
                    Pilih Ukuran ({product.detail.sizeTemplate.name})
                  </h3>
                  {selectedSize && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300 bg-white px-2 py-1 rounded shadow-sm border border-amber-100">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        (selectedSizeInfo?.stock || 0) > 0 ? "bg-emerald-500 animate-pulse" : "bg-[#C14444]"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        (selectedSizeInfo?.stock || 0) > 0 ? "text-emerald-700" : "text-[#C14444]"
                      )}>
                        {(selectedSizeInfo?.stock || 0) > 0
                          ? `Stok Tersedia: ${selectedSizeInfo?.stock}`
                          : "Habis Terjual"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {uniqueSizes.map((size) => {
                    const sku = selectedVariant?.skus?.find(s => s.size === size);
                    const isOutOfStock = !sku || sku.stock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={cn(
                          "min-w-[4rem] rounded-lg border-2 px-3 py-2 text-sm font-black transition-all outline-none flex flex-col items-center justify-center",
                          selectedSize === size
                            ? "border-[#4A3B2E] bg-[#4A3B2E] text-white shadow-md scale-105"
                            : isOutOfStock
                              ? "border-amber-200/30 bg-white/30 text-amber-900/20 cursor-not-allowed"
                              : "border-amber-200 bg-white text-[#4A3B2E] hover:border-[#4A3B2E]/50 hover:bg-amber-50 hover:-translate-y-0.5"
                        )}
                      >
                        <span>{size}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedSize ? (
                  (() => {
                    const detailedMeas = getDetailedMeasurementSentence(
                      selectedSize,
                      product.detail?.sizeTemplate,
                      product.detail?.customMeasurements
                    );
                    if (!detailedMeas) return null;
                    return (
                      <div className="text-xs text-amber-900 bg-amber-50/50 p-3 rounded-xl border border-amber-200/50 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block mb-1">Rincian Ukuran {selectedSize}</span>
                        <span className="font-medium text-[#4A3B2E]">{detailedMeas}</span>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-[10px] text-amber-700/60 font-bold italic">
                    * Silakan pilih ukuran untuk melihat ketersediaan stok
                  </p>
                )}
              </motion.div>
            )}

            {/* Specs & Description — fade-up saat scroll */}
            <motion.div variants={infoItem} className=" space-y-8">
              {product.detail && (
                <FadeUpSection>
                  <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-[#4A3B2E]/60 border-b border-amber-200 pb-2">
                    Spesifikasi Produk
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    {(() => {
                      const pType = product.productType?.toLowerCase() || "shoes";
                      return (
                        <>
                          {product.detail.material && (
                            <div className="space-y-1">
                              <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Material Utama</dt>
                              <dd className="font-bold text-[#4A3B2E]">{product.detail.material}</dd>
                            </div>
                          )}
                          {product.detail.outsole && (pType === "shoes" || pType === "sandal") && (
                            <div className="space-y-1">
                              <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Material Sol (Outsole)</dt>
                              <dd className="font-bold text-[#4A3B2E]">{product.detail.outsole}</dd>
                            </div>
                          )}
                          {product.detail.insole && pType === "shoes" && (
                            <div className="space-y-1">
                              <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Insole</dt>
                              <dd className="font-bold text-[#4A3B2E]">{product.detail.insole}</dd>
                            </div>
                          )}
                          {product.detail.closureType && (pType === "shoes" || pType === "apparel" || pType === "accessories") && (
                            <div className="space-y-1">
                              <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Tipe Penutup</dt>
                              <dd className="font-bold text-[#4A3B2E]">{product.detail.closureType}</dd>
                            </div>
                          )}
                          {product.detail.origin && (
                            <div className="space-y-1">
                              <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Asal Produksi</dt>
                              <dd className="font-bold text-[#4A3B2E]">{product.detail.origin}</dd>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="space-y-1">
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Gender</dt>
                      <dd className="font-bold text-[#4A3B2E]">{product.gender}</dd>
                    </div>
                  </dl>
                </FadeUpSection>
              )}

              {product.detail?.description && (
                <FadeUpSection delay={0.1}>
                  <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-[#4A3B2E]/60 border-b border-amber-200 pb-2">
                    Cerita Produk
                  </h3>
                  <div
                    className="prose prose-stone prose-sm max-w-none text-[#4A3B2E]/80 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: product.detail.description }}
                  />
                </FadeUpSection>
              )}

              {product.detail?.notes && (
                <FadeUpSection delay={0.15}>
                  <div className="rounded-2xl bg-white p-6 border border-amber-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full opacity-50 -z-0" />
                    <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-2 relative z-10">
                      <span className="w-2 h-2 bg-amber-500 rounded-sm inline-block" />
                      Catatan Khas Fordza
                    </h3>
                    <p className="text-sm font-bold leading-relaxed text-[#4A3B2E] relative z-10">
                      &ldquo;{product.detail.notes}&rdquo;
                    </p>
                  </div>
                </FadeUpSection>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Testimonials */}
        <FadeUpSection className="mt-16">
          <ProductTestimonials productId={id} />
        </FadeUpSection>

        {/* Related Products */}
        <FadeUpSection className="mt-16">
          <RelatedProducts productId={id} />
        </FadeUpSection>

      </main>
    </div>
  );
}
