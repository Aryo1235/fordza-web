"use client";

import { useState } from "react";
import { X, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

interface AdminPinModalProps {
  onSuccess: (pin: string) => void;
  onCancel: () => void;
}

export default function AdminPinModal({ onSuccess, onCancel }: AdminPinModalProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/kasir/auth/verify-pin", { pin });
      
      if (res.data.success) {
        toast.success("Otorisasi Admin Berhasil");
        onSuccess(pin);
      } else {
        setError("PIN Admin salah!");
        setPin("");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("PIN Admin salah!");
      } else {
        setError("Gagal memverifikasi PIN");
      }
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-amber-600 px-4 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold tracking-tight">Otorisasi Diskon Besar</h3>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center space-y-2 mb-4">
            <p className="text-stone-600 text-sm leading-relaxed">
              Total diskon melebihi <span className="font-bold text-stone-900 text-base">Rp 300.000</span>. 
              Diperlukan PIN Admin untuk melanjutkan transaksi ini.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin" className="text-xs font-bold text-stone-500 uppercase">Input PIN Admin</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="text-center text-3xl tracking-[1em] h-14 bg-stone-50 border-stone-200 focus:ring-amber-500 rounded-lg"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 py-6 font-bold text-stone-500"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="flex-1 py-6 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
            >
              {isLoading ? "Memverifikasi..." : "Verifikasi PIN"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
