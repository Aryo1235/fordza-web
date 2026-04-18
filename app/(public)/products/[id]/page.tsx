"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { use } from "react";
import { RelatedProducts } from "@/features/products";
import { cn } from "@/lib/utils";

interface ProductDetail {
  id: string;
  name: string;
  shortDescription: string;
  price: string | number;
  productType: string;
  gender: string;
  isPopular: boolean;
  isBestseller: boolean;
  isNew: boolean;
  avgRating: number;
  totalReviews: number;
  images: { id: string; url: string }[];
  categories: { category: { id: string; name: string; imageUrl: string } }[];
  detail: {
    description: string;
    notes: string | null;
    careInstructions: string | null;
    material: string | null;
    outsole: string | null;
    closureType: string | null;
    origin: string | null;
    sizeTemplate: { id: string; name: string; type: string; sizes: string[] } | null;
  } | null;
  testimonials: {
    id: string;
    customerName: string;
    rating: number;
    content: string;
    createdAt: string;
  }[];
  variants: {
    id: string;
    color: string;
    basePrice: any;
    comparisonPrice: any;
    discountPercent: number | null;
  }[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/products/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProduct(json.data);
          if (json.data.variants?.length > 0) {
            setSelectedVariantId(json.data.variants[0].id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // Derived selected variant
  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId) || (product?.variants?.[0] || null);

  // Derived Gallery Images (General + Selected Variant Images)
  const galleryImages = useMemo(() => {
    if (!product) return [];
    
    // Start with general product images
    const images = [...product.images];
    
    // If a variant is selected AND it has images, we want to prioritize/include them
    if (selectedVariant && (selectedVariant as any).images?.length > 0) {
      const variantImgs = (selectedVariant as any).images;
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
    }
  }, [selectedVariantId]);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/products" className="text-xl font-bold tracking-tight text-zinc-900">
              FORDZA
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="animate-pulse">
            <div className="grid gap-10 md:grid-cols-2">
              <div className="aspect-square rounded-2xl bg-zinc-200" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-zinc-200" />
                <div className="h-5 w-1/2 rounded bg-zinc-200" />
                <div className="h-10 w-1/3 rounded bg-zinc-200" />
                <div className="h-32 rounded bg-zinc-200" />
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
          <h1 className="text-2xl font-bold text-zinc-900">Produk Tidak Ditemukan</h1>
          <Link href="/products" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            ← Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/products" className="text-xl font-bold tracking-tight text-zinc-900">
            FORDZA
          </Link>
          <Link href="/products" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            ← Kembali
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Product Detail */}
        <div className="grid gap-10 md:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
              <div className="relative aspect-square">
                {galleryImages[selectedImage] ? (
                  <img
                    src={galleryImages[selectedImage].url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-100 text-zinc-300">
                    <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {galleryImages.map((img: any, idx: number) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 overflow-hidden rounded-lg ring-2 transition-all ${
                      idx === selectedImage
                        ? "ring-zinc-900"
                        : "ring-transparent hover:ring-zinc-300"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isNew && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Baru
                </span>
              )}
              {product.isBestseller && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Bestseller
                </span>
              )}
              {product.isPopular && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Populer
                </span>
              )}
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {product.categories.map((c) => (
                <span
                  key={c.category.id}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                >
                  {c.category.name}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{product.name}</h1>
            <p className="text-zinc-500">{product.shortDescription}</p>

            {/* Rating */}
            {product.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(product.avgRating) ? "" : "opacity-30"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-zinc-500">
                  {product.avgRating.toFixed(1)} ({product.totalReviews} ulasan)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex flex-col gap-1">
               {(() => {
                   const finalPrice = Number(selectedVariant?.basePrice || product.price);
                   const gimmickPrice = selectedVariant?.comparisonPrice ? Number(selectedVariant.comparisonPrice) : null;
                   const discount = selectedVariant?.discountPercent ? Math.round(selectedVariant.discountPercent) : 0;

                   return (
                       <>
                           <p className="text-3xl font-bold text-zinc-900">{formatRupiah(finalPrice)}</p>
                           {gimmickPrice && gimmickPrice > finalPrice && (
                               <div className="flex items-center gap-2">
                                   <span className="text-sm text-zinc-400 line-through">
                                       {formatRupiah(gimmickPrice)}
                                   </span>
                                   <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                                       Hemat {discount}%
                                   </span>
                               </div>
                           )}
                       </>
                   );
               })()}
            </div>

            {/* Variant Selection (Colors) */}
            {product.variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Pilih Warna
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        // If variant has image, we want to show it.
                        // For simplicity in this demo, we'll reset selectedImage to index that could represent variant image
                        // or just rely on the gallery Prepended logic (implemented below)
                      }}
                      className={cn(
                        "group relative flex flex-col items-center gap-2 transition-all",
                        selectedVariantId === v.id ? "scale-105" : "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                      )}
                    >
                      <div 
                        className={cn(
                          "h-10 w-10 rounded-full border-2 transition-all p-0.5",
                          selectedVariantId === v.id ? "border-zinc-900 scale-110" : "border-transparent"
                        )}
                      >
                         <div className="h-full w-full rounded-full border border-zinc-200 bg-zinc-100 overflow-hidden">
                            { (v as any).images && (v as any).images.length > 0 ? (
                               <img src={(v as any).images[0].url} className="h-full w-full object-cover" alt={v.color} />
                            ) : (
                               <div className="h-full w-full bg-gradient-to-br from-zinc-300 to-zinc-500" />
                            )}
                         </div>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tighter">
                        {v.color}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Specs */}
            {product.detail && (
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Spesifikasi
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {product.detail.material && (
                    <>
                      <dt className="text-zinc-500">Material Utama</dt>
                      <dd className="font-medium text-zinc-900">{product.detail.material}</dd>
                    </>
                  )}
                  {product.detail.outsole && (
                    <>
                      <dt className="text-zinc-500">Material Sol (Outsole)</dt>
                      <dd className="font-medium text-zinc-900">{product.detail.outsole}</dd>
                    </>
                  )}
                  {product.detail.origin && (
                    <>
                      <dt className="text-zinc-500">Asal</dt>
                      <dd className="font-medium text-zinc-900">{product.detail.origin}</dd>
                    </>
                  )}
                  <dt className="text-zinc-500">Gender</dt>
                  <dd className="font-medium text-zinc-900">{product.gender}</dd>
                  <dt className="text-zinc-500">Tipe</dt>
                  <dd className="font-medium text-zinc-900 capitalize">{product.productType}</dd>
                </dl>
              </div>
            )}

            {/* Description */}
            {product.detail?.description && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Deskripsi Produk
                </h3>
                <div 
                  className="prose prose-zinc prose-sm max-w-none text-zinc-700"
                  dangerouslySetInnerHTML={{ __html: product.detail.description }}
                />
              </div>
            )}

            {/* Product Notes for End User */}
            {product.detail?.notes && (
              <div className="mt-8 rounded-2xl bg-amber-50/50 p-6 border border-amber-100/50 shadow-sm">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-800 flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500 rounded-full" />
                  Catatan Khas Fordza
                </h3>
                <p className="text-sm italic leading-relaxed text-amber-900/80">
                  &ldquo;{product.detail.notes}&rdquo;
                </p>
              </div>
            )}

            {/* Size Template */}
            {product.detail?.sizeTemplate && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Ukuran Tersedia ({product.detail.sizeTemplate.name})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.detail.sizeTemplate.sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Testimonials */}
        {product.testimonials.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-zinc-900">Ulasan Pelanggan</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.testimonials.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">{t.customerName}</span>
                    <div className="flex text-amber-400 text-sm">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600">{t.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Products (KNN) */}
        <section className="mt-16">
          <RelatedProducts productId={id} />
        </section>
      </main>
    </div>
  );
}
