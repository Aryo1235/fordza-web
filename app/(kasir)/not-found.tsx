"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { useRouter } from "next/navigation";

export default function KasirNotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-2xl bg-[#f5e6cf] flex items-center justify-center">
            <FileQuestion className="h-12 w-12 text-[#3C3025]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[#3C3025]">404</h1>
          <h2 className="text-xl font-semibold text-foreground">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-muted-foreground">
            Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-[#3C3025] text-[#3C3025] hover:bg-[#f5e6cf]"
          >
            Kembali
          </Button>
          <Button
            onClick={() => router.push("/pos")}
            className="bg-[#3C3025] hover:bg-[#2a2318] text-white"
          >
            Ke POS
          </Button>
        </div>
      </div>
    </div>
  );
}
