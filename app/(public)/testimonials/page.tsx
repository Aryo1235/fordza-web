"use client";

import { usePublicTestimonials } from "@/features/testimonials/hooks";
import { TestimonialOverview } from "@/features/testimonials/components/TestimonialOverview";
import { TestimonialCard } from "@/features/testimonials/components/TestimonialCard";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageSquareQuote } from "lucide-react";
import { PublicPagination } from "@/components/shared/PublicPagination";

import { Suspense } from "react";

function TestimonialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") || undefined;

  const [page, setPage] = useState(1);
  const limit = 9; // 3x3 grid

  const { data: response, isLoading } = usePublicTestimonials({ productId, page, limit });

  const testimonials = response?.data || [];
  const meta = response?.meta;
  const stats = response?.stats;

  // Nama produk dinamis jika ada productId
  const productName = testimonials.length > 0 && productId
    ? testimonials[0].product?.name
    : "Fordza";

  return (
    <div className="min-h-screen bg-[#FDFCFB]  pb-20">
      {/* Header Section */}
      <section className="bg-[#4A3B2E] pt-24 pb-32 px-4 relative overflow-hidden px-8">
        {/* Back Button */}
        <div className=" mx-auto relative z-30">
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

        <div className=" mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 text-amber-400 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-amber-400/30">
            <MessageSquareQuote className="w-4 h-4" />
            Suara Pelanggan
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none">
            Apa Kata Mereka Tentang <br />
            <span className="text-amber-400">
              {isLoading ? "..." : productName}?
            </span>
          </h1>
          <p className="text-zinc-300 text-lg max-w-2xl mx-auto font-medium">
            {productId
              ? `Ulasan jujur dari mereka yang telah mencoba ${productName}. Kepercayaan Anda adalah prioritas kami.`
              : "Kepercayaan Anda adalah prioritas kami. Lihat ribuan ulasan jujur dari pelanggan kami di seluruh Indonesia."}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className=" mx-auto px-8 -mt-16 relative z-20">
        {stats ? (
          <TestimonialOverview stats={stats} />
        ) : (
          <div className="h-64 bg-white rounded-3xl animate-pulse border border-zinc-100" />
        )}
      </section>

      {/* Main List */}
      <section className="mx-auto px-8 mt-8">
        <h2 className="text-2xl font-black text-[#4A3B2E] italic uppercase mb-8 flex items-center gap-3">
          <div className="w-10 h-1 bg-amber-400" />
          Testimoni Terbaru
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-zinc-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t: any) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPage > 1 && (
              <PublicPagination
                currentPage={page}
                totalPage={meta.totalPage}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 font-medium">Belum ada testimoni yang ditampilkan.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function TestimonialsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCFB] animate-pulse" />}>
      <TestimonialsContent />
    </Suspense>
  );
}

