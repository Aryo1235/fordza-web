"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FEF4E8]">
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
            Maaf, halaman yang Anda cari tidak ditemukan.
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
            onClick={() => router.push("/")}
            size="lg"
            className="bg-[#3C3025] hover:bg-[#2a2318] text-white"
          >
            <Home className="h-4 w-4 mr-2" />
            Ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
