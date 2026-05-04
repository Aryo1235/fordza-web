"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { usePublicCategories } from "@/features/categories/hooks";
import { PublicCategoryCard } from "@/features/categories/components/PublicCategoryCard";
import { PublicPagination } from "@/components/shared/PublicPagination";
import { Category } from "@/features/categories/types";

function CategoriesContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 9; // 3x3 grid

  const { data: response, isLoading } = usePublicCategories(page, limit);

  const categories: Category[] = response?.data || [];
  const meta = response?.meta;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header Section */}
      <section className="bg-[#4A3B2E] pt-24 pb-20 px-4 relative overflow-hidden px-8">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto relative z-30">
          <button
            onClick={() => router.back()}
            className="absolute -top-20 left-0 flex items-center gap-2 text-white/60 hover:text-amber-400 transition-colors text-sm font-bold group"
          >
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-amber-400/20 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Kembali
          </button>
        </div>

        {/* Background Ornaments */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 text-amber-400 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-amber-400/30">
            <LayoutGrid className="w-4 h-4" />
            Koleksi Pilihan
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none">
            Jelajahi <span className="text-amber-400">Kategori</span> Kami
          </h1>
          <p className="text-zinc-300 text-lg max-w-2xl mx-auto font-medium">
            Temukan koleksi eksklusif Fordza yang dirancang khusus untuk memenuhi gaya dan kebutuhan Anda,
            mulai dari gaya formal hingga kasual.
          </p>
        </div>
      </section>

      {/* Main Category List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-zinc-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <PublicCategoryCard key={category.id} category={category} />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPage > 1 && (
                <div className="mt-12 border-t border-zinc-100 pt-8">
                  <PublicPagination
                    currentPage={page}
                    totalPage={meta.totalPage}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <LayoutGrid className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium">Belum ada kategori yang tersedia.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCFB] animate-pulse" />}>
      <CategoriesContent />
    </Suspense>
  );
}
