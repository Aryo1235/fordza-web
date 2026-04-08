"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import RelatedProducts from "@/components/RelatedProducts";

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
    closureType: string | null;
    outsole: string | null;
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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/products/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProduct(json.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

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
                {product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage].url}
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
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
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
            <p className="text-3xl font-bold text-zinc-900">{formatRupiah(product.price)}</p>

            {/* Specs */}
            {product.detail && (
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Spesifikasi
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {product.detail.material && (
                    <>
                      <dt className="text-zinc-500">Material</dt>
                      <dd className="font-medium text-zinc-900">{product.detail.material}</dd>
                    </>
                  )}
                  {product.detail.closureType && (
                    <>
                      <dt className="text-zinc-500">Tipe Penutup</dt>
                      <dd className="font-medium text-zinc-900">{product.detail.closureType}</dd>
                    </>
                  )}
                  {product.detail.outsole && (
                    <>
                      <dt className="text-zinc-500">Outsole</dt>
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
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Deskripsi
                </h3>
                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">
                  {product.detail.description}
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
