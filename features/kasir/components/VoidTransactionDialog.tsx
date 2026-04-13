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
import { Textarea } from "@/components/ui/textarea";
import { useVoidTransaction } from "../hooks";
import { toast } from "sonner";
import { AlertCircle, Lock } from "lucide-react";

interface VoidTransactionDialogProps {
  transactionId: string | null;
  invoiceNo: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VoidTransactionDialog({ 
  transactionId, 
  invoiceNo, 
  isOpen, 
  onClose 
}: VoidTransactionDialogProps) {
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("");
  const voidMutation = useVoidTransaction();

  const handleVoid = () => {
    if (!transactionId) return;
    if (!pin) return toast.error("PIN Admin wajib diisi");
    if (!reason) return toast.error("Alasan pembatalan wajib diisi");

    voidMutation.mutate({ 
      id: transactionId, 
      pin, 
      cancelReason: reason 
    }, {
      onSuccess: (data) => {
        toast.success(data.message || "Transaksi berhasil dibatalkan");
        resetAndClose();
      },
      onError: (error: any) => {
        const errorMsg = error.response?.data?.message || error.message || "Gagal membatalkan transaksi";
        toast.error(errorMsg);
      }
    });
  };

  const resetAndClose = () => {
    setPin("");
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Batalkan Transaksi (VOID)
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan membatalkan invoice <span className="font-mono font-bold text-stone-800">{invoiceNo}</span> dan mengembalikan stok barang ke gudang.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              PIN Otorisasi Admin
            </Label>
            <Input
              id="pin"
              type="password"
              placeholder="Masukkan 6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-[0.5em] font-bold"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Pembatalan</Label>
            <Textarea
              id="reason"
              placeholder="Contoh: Salah input barang, Pelanggan batal beli, dsb."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={resetAndClose} disabled={voidMutation.isPending}>
            Batal
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleVoid} 
            disabled={voidMutation.isPending}
            className="gap-2"
          >
            {voidMutation.isPending ? "Memproses..." : "Konfirmasi VOID"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
