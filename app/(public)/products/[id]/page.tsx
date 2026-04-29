"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { use } from "react";
import { RelatedProducts, ProductTestimonials, usePublicProduct, type Product } from "@/features/products";
import { cn } from "@/lib/utils";


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

    // Start with general product images
    const images = [...product.images];

    // Jika ada varian yang dipilih DAN varian itu punya gambar sendiri, kita utamakan muncul di depan
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      const variantImgs = selectedVariant.images;
      // Prepend or replace? The user said: "muncul gambar ittuh tergantung ia klik warna hitam atau coklat"
      // Let's prepend them so they appear first
      return [...variantImgs, ...images];
    }

    return images;
  }, [product, selectedVariant]);

  // When variant changes, reset gallery to first image (which will be the variant image)
  useEffect(() => {
    if (selectedVariantId) {
      setSelectedImage(0);
      setSelectedSize(null); // Reset ukuran saat ganti warna
    }
  }, [selectedVariantId]);

  // Hitung stok untuk ukuran yang dipilih
  const selectedSizeInfo = useMemo(() => {
    if (!selectedVariant || !selectedSize) return null;
    return selectedVariant.skus.find(s => s.size === selectedSize) || null;
  }, [selectedVariant, selectedSize]);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10">
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
    <div className="min-h-screen bg-zinc-50 selection:bg-[#4A3B2E] selection:text-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 md:py-12">

        {/* Breadcrumb / Back Navigation */}
        <div className="mb-8">
          <Link href="/products" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#4A3B2E]/60 hover:text-[#4A3B2E] transition-colors">
            <span className="mr-2">←</span> Kembali ke Katalog
          </Link>
        </div>

        {/* Product Detail */}
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Gallery */}
          <div className="space-y-4 lg:sticky lg:top-18">
            <div className="relative overflow-hidden rounded-2xl bg-[#FEF4E8] shadow-sm ring-1 ring-amber-200/50 group">
              {/* Ornamen Segitiga Khas Fordza (Di dalam frame) */}
              <div
                className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-[#4A3B2E] z-0 opacity-[0.03]"
                style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
              />
              <div className="relative aspect-square z-10">
                {galleryImages[selectedImage] ? (
                  <img
                    src={galleryImages[selectedImage].url}
                    alt={product.name}
                    className="h-full w-full object-cover mix-blend-darken transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#FEF4E8] text-amber-200">
                    <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {galleryImages.map((img: any, idx: number) => (
                  <button
                    key={img.id || idx}
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
                      className="h-16 w-16 md:h-20 md:w-20 object-cover mix-blend-darken"
                    />
                    {idx === selectedImage && (
                      <div className="absolute inset-0 bg-[#4A3B2E]/5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8 pb-10">
            <div>
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

              <h1 className="text-2xl font-black text-[#4A3B2E] sm:text-3xl md:text-4xl tracking-tight leading-none mb-3">
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
                      <span key={i} className={i < Math.round(product.avgRating) ? "" : "opacity-30"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#4A3B2E]">
                    {product.avgRating.toFixed(1)} <span className="text-[#4A3B2E]/50 font-normal">({product.totalReviews} ulasan)</span>
                  </span>
                </div>
              )}
            </div>
            {/* Price */}
            <div className="flex flex-col gap-1 py-6 border-y border-amber-200/50">
              {(() => {
                // Prioritaskan harga akhir (setelah diskon) dari ukuran (Bigsize) jika ada
                const currentFinalPrice = selectedSizeInfo?.finalPrice
                  ? Number(selectedSizeInfo.finalPrice)
                  : Number(selectedVariant?.finalPrice || product.finalPrice || product.price);

                const highestPrice = Number(selectedVariant?.highestPrice || product.highestPrice || product.price);

                // Hitung total diskon (Gimmick + Promo) secara reaktif untuk ukuran yang dipilih
                let totalDiscountPercent = selectedVariant?.totalDiscountPercent || product.totalDiscountPercent || 0;
                if (selectedSizeInfo?.finalPrice && highestPrice > currentFinalPrice) {
                  totalDiscountPercent = Math.round(((highestPrice - currentFinalPrice) / highestPrice) * 100);
                }

                return (
                  <>
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <p className="text-4xl font-black text-[#4A3B2E] tracking-tight">{formatRupiah(currentFinalPrice)}</p>
                      {totalDiscountPercent > 0 && (
                        <span className="rounded bg-[#C14444] px-2.5 py-1 text-xs font-black uppercase tracking-widest text-white shadow-sm">
                          Hemat {totalDiscountPercent}%
                        </span>
                      )}
                    </div>

                    {highestPrice > currentFinalPrice && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-base font-bold text-[#4A3B2E]/40 line-through decoration-[#4A3B2E]/30">
                          {formatRupiah(highestPrice)}
                        </span>
                        {selectedVariant?.promoName && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm">
                            {selectedVariant.promoName}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Variant Selection (Colors) */}
            {(product.variants?.length ?? 0) > 0 && (
              <div className="space-y-4">
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
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full border-[3px] transition-all p-[2px]",
                          selectedVariantId === v.id ? "border-[#4A3B2E]" : "border-transparent"
                        )}
                      >
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
              </div>
            )}

            {/* Size Template */}
            {product.detail?.sizeTemplate && (
              <div className="space-y-4">
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
                  {product.detail?.sizeTemplate && product.detail.sizeTemplate.sizes.map((size) => {
                    const sku = selectedVariant?.skus?.find(s => s.size === size);
                    const isOutOfStock = !sku || sku.stock === 0;

                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={cn(
                          "min-w-[3.5rem] rounded-lg border-2 px-3 py-2.5 text-sm font-black transition-all outline-none",
                          selectedSize === size
                            ? "border-[#4A3B2E] bg-[#4A3B2E] text-white shadow-md scale-105"
                            : isOutOfStock
                              ? "border-amber-200/30 bg-white/30 text-amber-900/20 cursor-not-allowed"
                              : "border-amber-200 bg-white text-[#4A3B2E] hover:border-[#4A3B2E]/50 hover:bg-amber-50 hover:-translate-y-0.5"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {!selectedSize && (
                  <p className="text-[10px] text-amber-700/60 font-bold italic">
                    * Silakan pilih ukuran untuk melihat ketersediaan stok
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons
            <div className="pt-6">
              <button
                disabled={!selectedSize || (selectedSizeInfo?.stock || 0) === 0}
                className={cn(
                  "w-full py-4 px-8 rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-300",
                  (!selectedSize || (selectedSizeInfo?.stock || 0) === 0)
                    ? "bg-amber-200/50 text-[#4A3B2E]/40 cursor-not-allowed"
                    : "bg-[#4A3B2E] text-white hover:bg-[#342920] shadow-lg hover:shadow-xl hover:-translate-y-1"
                )}
              >
                {!selectedSize
                  ? "Pilih Ukuran Dulu"
                  : (selectedSizeInfo?.stock || 0) === 0
                    ? "Stok Habis"
                    : "Beli Sekarang"}
              </button>
            </div> */}

            {/* Specs & Info Accordion (Stylized as blocks) */}
            <div className="pt-8 space-y-8">
              {product.detail && (
                <div>
                  <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-[#4A3B2E]/60 border-b border-amber-200 pb-2">
                    Spesifikasi Produk
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    {product.detail.material && (
                      <div className="space-y-1">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Material Utama</dt>
                        <dd className="font-bold text-[#4A3B2E]">{product.detail.material}</dd>
                      </div>
                    )}
                    {product.detail.outsole && (
                      <div className="space-y-1">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Material Sol</dt>
                        <dd className="font-bold text-[#4A3B2E]">{product.detail.outsole}</dd>
                      </div>
                    )}
                    {product.detail.origin && (
                      <div className="space-y-1">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Asal Produksi</dt>
                        <dd className="font-bold text-[#4A3B2E]">{product.detail.origin}</dd>
                      </div>
                    )}
                    <div className="space-y-1">
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Gender</dt>
                      <dd className="font-bold text-[#4A3B2E]">{product.gender}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Description */}
              {product.detail?.description && (
                <div>
                  <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-[#4A3B2E]/60 border-b border-amber-200 pb-2">
                    Cerita Produk
                  </h3>
                  <div
                    className="prose prose-stone prose-sm max-w-none text-[#4A3B2E]/80 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: product.detail.description }}
                  />
                </div>
              )}

              {/* Product Notes for End User */}
              {product.detail?.notes && (
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
              )}
            </div>
          </div>
        </div>

        {/* Testimonials (Lazy Loaded) */}
        <ProductTestimonials productId={id} />

        {/* Related Products (KNN) */}
        <section className="mt-16">
          <RelatedProducts productId={id} />
        </section>
      </main>
    </div>
  );
}
