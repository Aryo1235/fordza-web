"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { cn, formatNumber, parseNumber } from "@/lib/utils";
import { useCloseShift } from "../hooks";

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloseShiftModal({ isOpen, onClose }: CloseShiftModalProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  const closeShiftMutation = useCloseShift();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "");
    if (!/^\d*$/.test(raw)) return;
    setDisplayValue(raw === "" ? "" : formatNumber(raw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseNumber(displayValue);

    if (!displayValue || numericValue < 0) {
      toast.error("Format Kas Tidak Valid", {
        description: "Harap masukkan nominal uang hasil tutup laci yang benar.",
      });
      return;
    }

    closeShiftMutation.mutate(
      { actualEndingCash: numericValue },
      {
        onSuccess: async () => {
          toast.success("Shift Berhasil Ditutup", {
            description: `Fisik Rp ${formatNumber(numericValue)} telah direkam. Sesi kerja Anda selesai.`,
          });
          await fetch("/api/admin/auth/logout", { method: "POST" });
          window.location.href = "/login";
        },
        onError: (error: any) => {
          toast.error("Gagal Menutup Shift", {
            description: error?.response?.data?.message || "Terjadi kesalahan saat menutup shift.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden gap-0">
        {/* Header Merah */}
        <div className="bg-red-600 px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Tutup Laci & Akhiri Shift</h2>
              <p className="text-red-100 text-xs mt-0.5">Aksi ini tidak dapat dibatalkan</p>
            </div>
          </div>
        </div>

        {/* Peringatan */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-700 text-sm leading-relaxed">
            Setelah Anda submit, data penjualan shift ini akan diakumulasi dan akun Anda akan
            otomatis <strong>keluar dari sistem</strong>.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-5">
            {/* Instruksi */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-800">Langkah Penutupan:</p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-0.5 pl-1">
                <li>Hitung semua uang fisik yang ada di laci sekarang</li>
                <li>Masukkan total hitungan di bawah ini</li>
                <li>Klik tombol Tutup Shift</li>
              </ol>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <Label htmlFor="actualEndingCash" className="text-sm font-semibold text-gray-700">
                Total Uang Fisik di Laci Saat Ini
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 font-medium text-sm">Rp</span>
                </div>
                <Input
                  id="actualEndingCash"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  className={cn(
                    "pl-10 h-12 text-base border-gray-300 focus:border-red-400 focus:ring-red-400",
                    displayValue ? "font-bold text-gray-900" : "text-gray-400"
                  )}
                  value={displayValue}
                  onChange={handleChange}
                  autoFocus
                />
              </div>

              {/* Preview */}
              {displayValue ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Jumlah yang dilaporkan</span>
                  <span className="text-base font-bold text-gray-800">Rp {displayValue}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 pl-1">Masukkan angka, titik akan muncul otomatis</p>
              )}
            </div>
          </div>

          {/* Footer Tombol */}
          <div className="px-6 pb-6 flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all"
              disabled={closeShiftMutation.isPending || !displayValue}
            >
              {closeShiftMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Melaporkan Audit...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  TUTUP SHIFT & KELUAR
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full h-10 text-gray-600 border-gray-300 hover:bg-gray-50 font-medium text-sm rounded-lg"
              disabled={closeShiftMutation.isPending}
            >
              Batalkan, Kembali ke Kasir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
