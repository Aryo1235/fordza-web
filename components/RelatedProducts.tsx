"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RecommendedProduct {
  id: string;
  name: string;
  price: string | number;
  gender: string;
  productType: string;
  shortDescription: string;
  avgRating: number;
  totalReviews: number;
  image: string | null;
  categories: string[];
  distance: number;
}

interface Props {
  productId: string;
}

export default function RelatedProducts({ productId }: Props) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/recommend/${productId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProducts(json.data.recommendations);
        } else {
          setError(json.message || "Gagal memuat rekomendasi");
        }
      })
      .catch(() => {
        setError("Terjadi kesalahan saat memuat rekomendasi");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  // Jangan render apa-apa jika error atau tidak ada rekomendasi
  if (!loading && (error || products.length === 0)) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Produk Serupa</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Rekomendasi berdasarkan kemiripan kategori, material, gender, tipe produk, dan harga
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-3 shadow-sm">
              <div className="aspect-square rounded-lg bg-zinc-200" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-zinc-200" />
                <div className="h-3 w-1/2 rounded bg-zinc-200" />
                <div className="h-5 w-2/3 rounded bg-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Cards */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-zinc-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-300">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Similarity Badge */}
                <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  Jarak: {product.distance}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4">
                {/* Categories & Attributes */}
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {product.gender && product.gender !== "Unisex" && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                      {product.gender}
                    </span>
                  )}
                  {product.productType && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 capitalize">
                      {product.productType}
                    </span>
                  )}
                  {product.categories?.length > 0 && product.categories.slice(0, 1).map((catName) => (
                    <span
                      key={catName}
                      className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                    >
                      {catName}
                    </span>
                  ))}
                </div>

                <h3 className="text-sm font-semibold leading-snug text-zinc-900 line-clamp-2">
                  {product.name}
                </h3>

                {/* Rating */}
                {product.totalReviews > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <span className="text-amber-500">★</span>
                    <span>{product.avgRating.toFixed(1)}</span>
                    <span>({product.totalReviews})</span>
                  </div>
                )}

                <p className="mt-2 text-sm font-bold text-zinc-900">
                  {formatRupiah(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
