"use client";

import { use, useState, useEffect } from "react";
import { useBanner } from "@/features/banners";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";
import { 
  ArrowLeft,
  Edit, 
  ExternalLink, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Image as ImageIcon,
  Link2
} from "lucide-react";
import { toast } from "sonner";

export default function BannerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Fetch Banner Details
  const { 
    data: banner, 
    isLoading, 
    error 
  } = useBanner(id);

  // Handle errors
  useEffect(() => {
    if (error) {
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || "Gagal mengambil data banner";
      const traceId = (error as any)?.response?.data?.traceId;
      toast.error(errMsg);
      console.error(`Error loading banner (Trace ID: ${traceId || "N/A"}):`, error);
    }
  }, [error]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-20 w-full bg-zinc-100 animate-pulse rounded-xl" />
        <div className="h-96 w-full bg-zinc-100 animate-pulse rounded-xl" />
        <div className="h-40 w-full bg-zinc-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Error state
  if (!banner) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-zinc-800">Detail Banner Tidak Ditemukan</h3>
        <p className="text-sm text-zinc-500">Banner mungkin telah dihapus atau ID banner tidak valid.</p>
        <Link href="/dashboard/banners">
          <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-xl mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Banner
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <BreadcrumbsHeader
        title={banner.title}
        breadcrumbs={[
          { label: "Banner", href: "/dashboard/banners" },
          { label: "Detail Banner" },
        ]}
        backUrl="/dashboard/banners"
        action={
          <Link href={`/dashboard/banners/${banner.id}`}>
            <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-lg h-9 font-semibold text-xs px-4">
              <Edit className="h-4 w-4 mr-2" /> Edit Banner
            </Button>
          </Link>
        }
      />

      {/* Card 1: Banner Widescreen Image Preview */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Pratinjau Gambar Banner</h3>
          <Badge className={banner.isActive ? "bg-green-50 text-green-700 border-green-200 font-bold" : "bg-zinc-50 text-zinc-500 border-zinc-200 font-bold"} variant="outline">
            {banner.isActive ? "Aktif" : "Non-aktif"}
          </Badge>
        </div>
        
        {/* Landscape Banner Preview */}
        <div className="w-full aspect-[21/9] md:aspect-[3/1] rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center text-zinc-400 relative shadow-inner">
          {banner.imageUrl ? (
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-12 w-12 text-zinc-300 animate-pulse" />
              <span className="text-xs">Gambar banner tidak tersedia</span>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Banner Detailed Metadata */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-50 pb-3 mb-4">
          Informasi Detail Banner
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Judul Banner</span>
              <p className="text-sm font-bold text-zinc-800 mt-1">{banner.title}</p>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <Link2 className="h-3 w-3" /> URL Tujuan
              </span>
              {banner.linkUrl ? (
                <a 
                  href={banner.linkUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline mt-1 break-all"
                >
                  {banner.linkUrl}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-zinc-450 italic mt-1">Tidak diarahkan ke URL (Hanya Gambar)</p>
              )}
            </div>
          </div>

          <div className="space-y-4 md:border-l md:border-zinc-100 md:pl-6">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Tanggal Dibuat
              </span>
              <p className="text-sm font-semibold text-zinc-700 mt-1">
                {new Date(banner.createdAt).toLocaleDateString("id-ID", {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3" /> Penayangan
              </span>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {banner.isActive 
                  ? "Banner saat ini sedang aktif dan ditayangkan di halaman depan (Home) pelanggan."
                  : "Banner disembunyikan dan tidak akan ditayangkan di halaman depan."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
