"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion, Home, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#FEF4E8]">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="h-32 w-32 rounded-3xl bg-white shadow-sm border border-border flex items-center justify-center">
            <FileQuestion className="h-16 w-16 text-[#3C3025]" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-[#3C3025]">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-muted-foreground text-lg">
            Maaf, halaman yang Anda cari tidak ditemukan. Mungkin produk sudah tidak tersedia atau URL salah.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
            className="border-[#3C3025] text-[#3C3025] hover:bg-[#f5e6cf]"
          >
            Kembali
          </Button>
          <Button
            onClick={() => router.push("/products")}
            variant="outline"
            size="lg"
            className="border-[#3C3025] text-[#3C3025] hover:bg-[#f5e6cf]"
          >
            <Search className="h-4 w-4 mr-2" />
            Lihat Produk
          </Button>
          <Button
            onClick={() => router.push("/")}
            size="lg"
            className="bg-[#3C3025] hover:bg-[#2a2318] text-white"
          >
            <Home className="h-4 w-4 mr-2" />
            Ke Beranda
          </Button>
        </div>

        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Butuh bantuan? Hubungi kami di{" "}
            <a href="mailto:support@fordza.com" className="text-[#3C3025] hover:underline font-medium">
              support@fordza.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
