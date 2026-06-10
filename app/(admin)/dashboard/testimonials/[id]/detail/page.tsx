"use client";

import { use, useEffect } from "react";
import { useTestimonial } from "@/features/testimonials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";
import { 
  ArrowLeft,
  Edit, 
  Calendar, 
  AlertTriangle, 
  ShoppingBag,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function TestimonialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Fetch Testimonial Details
  const { 
    data: testimonial, 
    isLoading, 
    error 
  } = useTestimonial(id);

  // Handle errors
  useEffect(() => {
    if (error) {
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || "Gagal mengambil data testimoni";
      toast.error(errMsg);
      console.error("Error loading testimonial:", error);
    }
  }, [error]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-20 w-full bg-stone-100 animate-pulse rounded-xl" />
        <div className="h-96 w-full bg-stone-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Error state or Not Found
  if (!testimonial) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-20 text-center space-y-4 bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-stone-800">Detail Testimoni Tidak Ditemukan</h3>
        <p className="text-sm text-stone-500">Testimoni mungkin telah dihapus atau ID tidak valid.</p>
        <Link href="/dashboard/testimonials">
          <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-xl mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Moderasi Testimoni
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <BreadcrumbsHeader
        title={`Ulasan dari ${testimonial.customerName}`}
        breadcrumbs={[
          { label: "Testimoni", href: "/dashboard/testimonials" },
          { label: "Detail Testimoni" },
        ]}
        backUrl="/dashboard/testimonials"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Testimonial details (Col-span 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Konten Ulasan</h3>
              <Badge className={testimonial.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" : "bg-stone-50 text-stone-500 border-stone-200 font-bold"} variant="outline">
                {testimonial.isActive ? "Aktif / Ditampilkan" : "Diarsipkan"}
              </Badge>
            </div>

            {/* Customer Rating & Stars */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-sm font-bold text-[#3C3025] border border-stone-200">
                {testimonial.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-850">{testimonial.customerName}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < testimonial.rating ? "fill-amber-500 text-amber-500" : "text-stone-200"}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-500 ml-1">({testimonial.rating}.0 / 5.0)</span>
                </div>
              </div>
            </div>

            {/* Testimonial Quote Content */}
            <div className="p-5 rounded-2xl bg-[#FEF4E8]/20 border border-[#f0d4bd]/40 relative overflow-hidden">
              <span className="absolute -left-2 -top-5 text-[120px] text-[#3C3025] font-serif leading-none select-none pointer-events-none opacity-[0.06]">“</span>
              <p className="text-sm font-medium italic text-stone-700 leading-relaxed relative z-10 pl-2">
                "{testimonial.content}"
              </p>
            </div>

            {/* Audit Logs / Date */}
            <div className="flex items-center gap-2 text-stone-400 text-xs pt-4 border-t border-stone-100">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                Dikirim pada: <b>{new Date(testimonial.createdAt).toLocaleDateString("id-ID", {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Product Linked & Actions (Col-span 1) */}
        <div className="space-y-6">
          
          {/* Product Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-50 pb-3">Produk yang Diulas</h3>
            
            <div className="space-y-4">
              {/* Product Image */}
              <div className="w-full aspect-square rounded-xl bg-stone-50 border border-stone-100 overflow-hidden flex items-center justify-center text-stone-400 relative">
                {testimonial.product?.images?.[0]?.url ? (
                  <img
                    src={testimonial.product.images[0].url}
                    alt={testimonial.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="h-8 w-8 text-stone-300" />
                    <span className="text-xs font-semibold text-stone-400">Tidak ada gambar</span>
                  </div>
                )}
              </div>

              {/* Product Text details */}
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-bold text-stone-850">{testimonial.product?.name}</h4>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">{testimonial.product?.productCode}</p>
                </div>

                <div className="pt-2 border-t border-stone-50 flex justify-between items-center text-xs">
                  <span className="text-stone-400">Kategori:</span>
                  <span className="font-bold text-stone-700">
                    {testimonial.product?.categories?.[0]?.category?.name || "Lainnya"}
                  </span>
                </div>
              </div>

              {/* View product details button */}
              <Link href={`/dashboard/products/${testimonial.productId}/detail`} className="block w-full">
                <Button variant="outline" className="w-full text-xs font-bold border-stone-200 hover:bg-stone-50 rounded-xl h-9">
                  Detail Katalog Produk
                </Button>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
