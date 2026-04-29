"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn, formatNumber, parseNumber } from "@/lib/utils";
import { useOpenShift } from "../hooks";

interface ShiftBlockerModalProps {
  isOpen: boolean;
  onShiftOpened: (shiftId: string) => void;
  kasirName: string;
}

export function ShiftBlockerModal({ isOpen, onShiftOpened, kasirName }: ShiftBlockerModalProps) {
  // Simpan sebagai string terformat (misal: "500.000"), nilai aslinya di-parse saat submit
  const [displayValue, setDisplayValue] = useState<string>("");
  const openShiftMutation = useOpenShift();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, ""); // Hapus semua titik pemisah ribuan
    if (!/^\d*$/.test(raw)) return; // Blok karakter non-angka
    setDisplayValue(raw === "" ? "" : formatNumber(raw)); // Format otomatis saat mengetik
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseNumber(displayValue);

    if (!displayValue || numericValue <= 0) {
      toast.error("Format Kas Tidak Valid", {
        description: "Harap masukkan nominal uang fisik yang benar (lebih dari 0).",
      });
      return;
    }

    openShiftMutation.mutate(
      { startingCash: numericValue },
      {
        onSuccess: (data) => {
          toast.success("Shift Berhasil Dibuka!", {
            description: `Modal Rp ${formatNumber(numericValue)} berhasil direkam. Selamat bekerja!`,
          });
          onShiftOpened(data.id);
        },
        onError: (error: any) => {
          toast.error("Gagal Membuka Shift", {
            description: error?.response?.data?.message || "Terjadi kesalahan saat membuka shift.",
          });
        }
      }
    );
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">Buka Shift Kasir</DialogTitle>
          <DialogDescription className="text-center">
            Halo <strong>{kasirName}</strong>, Anda belum membuka laci hari ini.
            <br />
            Hitung fisik uang di laci, konfirmasi nominalnya di bawah.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="startingCash">Modal Awal Laci</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-medium text-sm">Rp</span>
              <Input
                id="startingCash"
                type="text"
                inputMode="numeric"
                placeholder="500.000"
                className={cn("pl-9 tabular-nums", displayValue ? "font-bold text-lg" : "")}
                value={displayValue}
                onChange={handleChange}
                autoFocus
              />
            </div>
            {displayValue && parseNumber(displayValue) > 0 && (
              <p className="text-sm text-blue-700 font-semibold bg-blue-50 px-3 py-2 rounded-md">
                ✓ Modal dikonfirmasi: <span className="text-blue-900">Rp {displayValue}</span>
              </p>
            )}
            <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1 font-medium bg-yellow-50 p-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" /> Angka akan terformat otomatis saat Anda mengetik
            </p>
          </div>

          <DialogFooter className="sm:justify-center flex-col sm:flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              className="w-full text-md font-bold"
              disabled={openShiftMutation.isPending}
            >
              {openShiftMutation.isPending ? "Menyimpan Dokumen..." : "SAYA BERTANGGUNG JAWAB & BUKA LACI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
