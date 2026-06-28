// app/(public)/promo/page.tsx
// Halaman publik: daftar produk yang sedang dalam promo aktif

import type { Metadata } from "next";
import { Suspense } from "react";
import { PromoHero } from "@/features/promo/components/PromoHero";
import { PromoHeader } from "@/features/promo/components/PromoHeader";
import { PromoGridWrapper } from "@/features/promo/components/PromoGridWrapper";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";

export const metadata: Metadata = {
  title: "Promo & Diskon Terbaik — FORDZA",
  description:
    "Temukan penawaran eksklusif dan diskon terbaik dari koleksi Fordza. Produk premium menswear Indonesia dengan harga spesial — hanya untuk waktu terbatas.",
  openGraph: {
    title: "Promo & Diskon Terbaik — FORDZA",
    description:
      "Penawaran eksklusif koleksi Fordza. Diskon produk premium menswear Indonesia.",
  },
};

export default async function PromoPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-[#FDFCFB] mt-14">

      {/* Hero — full width, identik dengan halaman Kategori & About */}
      <PromoHero />

      {/* Konten Grid — di dalam container seperti halaman lainnya */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">

        {/* Search + Sort Header */}
        <Suspense fallback={<div className="h-16 w-full bg-zinc-50 animate-pulse rounded-xl mb-8" />}>
          <PromoHeader />
        </Suspense>

        {/* Grid Produk Promo */}
        <Suspense fallback={<ProductGridSkeleton />} key={JSON.stringify(searchParams)}>
          <PromoGridWrapper searchParams={searchParams} />
        </Suspense>

      </main>
    </div>
  );
}

