"use client";

import Link from "next/link";
import { ProductCard } from "@/features/landing-page/ProductCard";
import { useRelatedProducts } from "@/features/products";

interface RecommendedProduct {
  id: string;
  name: string;
  price: string | number;
  isPopular?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  variants?: any[];
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

export function RelatedProducts({ productId }: Props) {
  const { data, isLoading: loading, isError } = useRelatedProducts(productId);
  const products = data?.data?.recommendations || [];

  // Jangan render apa-apa jika error atau tidak ada rekomendasi
  if (!loading && (isError || products.length === 0)) {
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
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-5 pb-4 custom-scrollbar items-stretch"
          style={{ scrollPaddingLeft: "0px" }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="snap-start shrink-0 w-[65%] sm:w-[45%] md:w-[31%] lg:w-[31%] xl:w-[23.5%] flex flex-col">
              <div className="animate-pulse rounded-2xl bg-white p-3 shadow-sm h-full flex flex-col flex-1">
                <div className="aspect-square rounded-xl bg-zinc-200 w-full" />
                <div className="mt-3 flex flex-1 flex-col gap-2">
                  <div className="h-4 w-3/4 rounded bg-zinc-200" />
                  <div className="h-3 w-1/2 rounded bg-zinc-200" />
                  <div className="mt-auto h-5 w-2/3 rounded bg-zinc-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Cards Carousel */}
      {!loading && products.length > 0 && (
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-4 pb-4 custom-scrollbar items-stretch"
          style={{ scrollPaddingLeft: "0px" }}
        >
          {products.map((product: RecommendedProduct) => {
            // Mapping RecommendedProduct to Product interface for ProductCard
            const productForCard = {
              ...product,
              images: product.image ? [{ url: product.image }] : [],
              price: product.price,
            } as any;

            return (
              <div
                key={product.id}
                className="snap-start shrink-0 w-[65%] sm:w-[45%] md:w-[31%] lg:w-[31%] xl:w-[23.5%] relative p-1 flex flex-col items-stretch"
              >
                {/* 
                  Kunci Perbaikan: 
                  h-full memaksa container ini memenuhi tinggi maksimal grid.
                  [&>div]:h-full memaksa element root pertama di dalam ProductCard untuk ikut setinggi 100% 
                */}
                <div className="h-full [&>div]:h-full">
                  <ProductCard product={productForCard} />
                </div>

                {/* Similarity Badge Overlay */}
                <div className="absolute top-4 right-4 z-20 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm shadow-sm">
                  Match: {product.distance}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}