"use client";

import { useState } from "react";
import { Search, Printer } from "lucide-react";
import { toast } from "sonner";
import { InvoiceModal, useCheckInvoice, type Transaction } from "@/features/kasir";
import { getTransactionById } from "@/features/transactions";

export default function CetakUlangPage() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [modalTransaction, setModalTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { isFetching: loading, refetch } = useCheckInvoice(invoiceNo);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo.trim()) return toast.warning("Masukkan nomor invoice");

    const res = await refetch();
    if (res.isError || !res.data?.success) {
      toast.error((res.error as any)?.message || res.data?.message || "Gagal mencari transaksi");
      return;
    }

    const json = res.data;
    if (!json.data || json.data.length === 0) {
      toast.error("Transaksi tidak ditemukan");
      return;
    }

    const found = json.data.find((t: any) => t.invoiceNo.toLowerCase() === invoiceNo.trim().toLowerCase());
    
    if (!found) {
      toast.error("Nomor invoice tidak ditemukan. Periksa kembali penulisannya.");
      return;
    }

    // Karena API list tidak menyertakan items, kita ambil detail lengkapnya
    try {
      const fullDetail = await getTransactionById(found.id, false);
      setModalTransaction(fullDetail);
      setShowModal(false); // Jangan langsung buka modal
    } catch (err) {
      console.error("Detail fetch error:", err);
      toast.error("Gagal memuat rincian produk untuk struk ini.");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-800">Cetak Ulang Struk</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Masukkan nomor invoice untuk mencetak ulang struk transaksi
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white border border-stone-200 rounded-sm p-5 mb-5">
        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
          Nomor Invoice
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="Contoh: FDZ-20260408-0001"
              className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-sm text-sm font-mono focus:outline-none focus:border-stone-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold text-white rounded-sm flex items-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: "#3C3025" }}
          >
            <Search className="w-3.5 h-3.5" />
            {loading ? "Mencari..." : "Cari"}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2">
          Format: FDZ-YYYYMMDD-XXXX (contoh: FDZ-20260408-0001)
        </p>
      </form>

      {/* Result Preview */}
      {modalTransaction && (
        <div className="bg-white border border-stone-200 rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="px-4 py-3 border-b flex items-center justify-between"
            style={{ backgroundColor: "#3C3025" }}>
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">Transaksi Ditemukan</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${
              modalTransaction.status === "PAID"
                ? "bg-green-400 text-green-900"
                : "bg-red-400 text-red-900"
            }`}>
              {modalTransaction.status}
            </span>
          </div>

          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">No. Invoice</span>
              <span className="font-mono font-semibold" style={{ color: "#3C3025" }}>{modalTransaction.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Tanggal</span>
              <span>{new Date(modalTransaction.createdAt).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Kasir</span>
              <span>{modalTransaction.kasir?.name || modalTransaction.kasir?.username || "-"}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Total Belanja</span>
              <span style={{ color: "#3C3025" }}>Rp {modalTransaction.totalPrice.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#3C3025" }}
            >
              <Printer className="w-4 h-4" />
              Buka Struk & Cetak
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showModal && modalTransaction && (
        <InvoiceModal
          transaction={modalTransaction}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
