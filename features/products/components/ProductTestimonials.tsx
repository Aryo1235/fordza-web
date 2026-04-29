"use client";

import { usePublicTestimonials } from "@/features/testimonials/hooks";
import Link from "next/link";
import { Star, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  customerName: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface ProductTestimonialsProps {
  productId: string;
}

export function ProductTestimonials({ productId }: ProductTestimonialsProps) {
  const { data: response, isLoading: loading } = usePublicTestimonials({ productId, limit: 4 });
  const testimonials = response?.data || [];
  const totalItems = response?.meta?.totalItems || 0;

  // Jika sedang loading, tampilkan skeleton sederhana
  if (loading) {
    return (
      <section className="mt-16">
        <h2 className="mb-6 text-xl font-bold text-zinc-900">Ulasan Pelanggan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-[var(--fordza-cream)] p-6 shadow-sm border border-[var(--fordza-cream-dark)]"
            >
              <div className="mb-4 flex justify-between">
                <div className="h-5 w-32 rounded bg-amber-100" />
                <div className="h-4 w-20 rounded bg-amber-100" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-amber-50" />
                <div className="h-4 w-5/6 rounded bg-amber-50" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Jika tidak ada ulasan, jangan tampilkan section ini
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 bg-white py-10 px-6 sm:px-10 rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden">
      {/* Ornamen Latar */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FEF4E8] rounded-bl-[100px] -z-0 opacity-50" />
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-[#4A3B2E] uppercase flex items-center gap-2">
            <MessageSquareQuote className="w-6 h-6 text-amber-500" />
            Ulasan Pelanggan
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Apa kata mereka yang sudah menggunakan produk ini?
          </p>
        </div>
        
        {totalItems > 4 && (
          <Link 
            href={`/testimonials?productId=${productId}`}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-[#4A3B2E] bg-[#FEF4E8] border border-amber-200 rounded-lg hover:bg-[#4A3B2E] hover:text-white transition-all whitespace-nowrap"
          >
            Lihat Semua ({totalItems})
          </Link>
        )}
      </div>

      <div className="relative z-10 grid gap-4 sm:grid-cols-2">
        {testimonials.map((t: Testimonial) => (
          <div
            key={t.id}
            className="group rounded-xl bg-[#FEF4E8] p-6 border border-amber-100/50 hover:border-amber-300 transition-all hover:shadow-md hover:-translate-y-1"
          >
            <div className="mb-3 flex items-center justify-between border-b border-amber-200/50 pb-3">
              <span className="font-bold text-[#4A3B2E] font-mono tracking-tight">{t.customerName}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "w-3.5 h-3.5",
                      i < t.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-amber-200"
                    )} 
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-[#4A3B2E]/80 leading-relaxed italic line-clamp-4">
              "{t.content}"
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
