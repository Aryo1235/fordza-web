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
import { jsPDF } from "jspdf";

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

  const generateShiftPDF = (shift: any) => {
    const doc = new jsPDF({ unit: "mm", format: [80, 160], orientation: "portrait" });

    let y = 10;
    const lineH = 5;
    const marginX = 5;
    const rightAlignX = 75;

    const formatRp = (amount: number) => {
      return `Rp ${amount.toLocaleString("id-ID")}`;
    };

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FORDZA SHOP", 40, y, { align: "center" });
    y += lineH;
    doc.text("LAPORAN TUTUP SHIFT", 40, y, { align: "center" });
    y += lineH;
    doc.setFontSize(8);
    doc.text("(Z-REPORT)", 40, y, { align: "center" });
    y += lineH;

    doc.line(marginX, y, rightAlignX, y);
    y += lineH * 0.8;

    // Info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`ID Shift    : ${shift.id}`, marginX, y); y += lineH * 0.8;
    doc.text(`Kasir       : ${shift.admin?.name || shift.admin?.username || "-"}`, marginX, y); y += lineH * 0.8;
    doc.text(`Buka Shift  : ${formatDate(shift.startTime)}`, marginX, y); y += lineH * 0.8;
    doc.text(`Tutup Shift : ${formatDate(shift.endTime)}`, marginX, y); y += lineH * 0.8;
    
    doc.line(marginX, y, rightAlignX, y);
    y += lineH * 0.8;

    // Omzet Penjualan
    doc.setFont("helvetica", "bold");
    doc.text("OMZET PENJUALAN SHIFT", marginX, y);
    y += lineH;
    doc.setFont("helvetica", "normal");
    doc.text("- Penjualan Tunai (Cash)", marginX, y);
    doc.text(formatRp(shift.cashSales || 0), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;
    doc.text("- Penjualan QRIS", marginX, y);
    doc.text(formatRp(shift.qrisSales || 0), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;
    doc.text("- Penjualan Debit", marginX, y);
    doc.text(formatRp(shift.debitSales || 0), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;

    const totalSales = (shift.cashSales || 0) + (shift.qrisSales || 0) + (shift.debitSales || 0);
    doc.setFont("helvetica", "bold");
    doc.text("Total Penjualan", marginX, y);
    doc.text(formatRp(totalSales), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;

    doc.line(marginX, y, rightAlignX, y);
    y += lineH * 0.8;

    // Audit Laci Kasir
    doc.setFont("helvetica", "bold");
    doc.text("AUDIT LACI KASIR", marginX, y);
    y += lineH;
    doc.setFont("helvetica", "normal");
    doc.text("- Modal Awal (Starting)", marginX, y);
    doc.text(formatRp(shift.startingCash || 0), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;
    doc.text("- Omzet Tunai (Cash)", marginX, y);
    doc.text(formatRp(shift.cashSales || 0), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;

    doc.setFont("helvetica", "bold");
    doc.text("Uang Laci Expected", marginX, y);
    doc.text(formatRp(shift.expectedEndingCash || 0), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;
    doc.text("Uang Laci Fisik (Actual)", marginX, y);
    doc.text(formatRp(shift.actualEndingCash || 0), rightAlignX, y, { align: "right" });
    y += lineH * 0.8;

    const diff = (shift.actualEndingCash || 0) - (shift.expectedEndingCash || 0);
    doc.text("SELISIH (VARIANCE)", marginX, y);
    doc.text(`${diff === 0 ? "Rp 0 (PAS)" : formatRp(diff)}`, rightAlignX, y, { align: "right" });
    y += lineH * 0.8;

    doc.line(marginX, y, rightAlignX, y);
    y += lineH * 0.8;

    // SOP setoran
    doc.setFont("helvetica", "italic");
    doc.text(`* Nominal Setoran Cash: ${formatRp(shift.cashSales || 0)}`, marginX, y); y += lineH * 0.8;
    doc.text(`* Sisa Uang Laci (Modal): ${formatRp(shift.startingCash || 0)}`, marginX, y); y += lineH * 1.2;

    // Signatures
    doc.setFont("helvetica", "normal");
    doc.text("Ttd Kasir,", marginX, y);
    doc.text("Ttd Supervisor,", rightAlignX, y, { align: "right" });
    y += lineH * 2.5;

    doc.text("(..........................)", marginX, y);
    doc.text("(..........................)", rightAlignX, y, { align: "right" });
    y += lineH;

    const formattedDate = new Date().toISOString().split("T")[0];
    doc.save(`Laporan_Shift_${shift.id}_${formattedDate}.pdf`);
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
        onSuccess: async (data: any) => {
          toast.success("Shift Berhasil Ditutup", {
            description: `Fisik Rp ${formatNumber(numericValue)} telah direkam. Mengunduh laporan shift PDF...`,
          });
          
          try {
            generateShiftPDF(data);
          } catch (pdfError) {
            console.error("Gagal generate PDF shift:", pdfError);
            toast.error("Gagal mengunduh PDF laporan shift");
          }

          // Berikan jeda 1.5 detik agar unduhan terinisiasi dengan baik oleh browser sebelum logout/redirect
          setTimeout(async () => {
            await fetch("/api/admin/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }, 1500);
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
