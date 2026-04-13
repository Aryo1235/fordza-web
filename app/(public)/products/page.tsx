"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  shortDescription: string;
  price: string | number;
  avgRating: number;
  totalReviews: number;
  images: { id: string; url: string }[];
  categories: { category: { id: string; name: string } }[];
}

interface Meta {
  totalItems: number;
  totalPage: number;
  currentPage: number;
  limit: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/products?page=${page}&limit=12`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProducts(json.data);
          setMeta(json.meta);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [page]);

  const formatRupiah = (price: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/products" className="text-xl font-bold tracking-tight text-zinc-900">
            FORDZA
          </Link>
          <nav className="flex gap-6 text-sm font-medium text-zinc-600">
            <Link href="/products" className="text-zinc-900">Produk</Link>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Semua Produk</h1>
          <p className="mt-2 text-zinc-500">
            {meta ? `Menampilkan ${products.length} dari ${meta.totalItems} produk` : "Memuat..."}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
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

        {/* Product Grid */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-zinc-100">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 sm:p-4">
                  {/* Categories */}
                  {product.categories.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {product.categories.slice(0, 2).map((c) => (
                        <span
                          key={c.category.id}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                        >
                          {c.category.name}
                        </span>
                      ))}
                    </div>
                  )}

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

        {/* Pagination */}
        {meta && meta.totalPage > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Sebelumnya
            </button>
            <span className="px-4 text-sm text-zinc-500">
              Halaman {meta.currentPage} dari {meta.totalPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
              disabled={page >= meta.totalPage}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
