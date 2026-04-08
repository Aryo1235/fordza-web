"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, Printer, Eye } from "lucide-react";
import { toast } from "sonner";
import { InvoiceModal, useKasirTransactions, type Transaction } from "@/features/kasir";

export default function RiwayatPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  
  // Real filters to pass to the query (to avoid fetching on every keystroke)
  const [filters, setFilters] = useState({ search: "", dateFrom: "", dateTo: "" });

  const { data: transactionsData, isLoading: loading } = useKasirTransactions(
    page, 20, filters.search, filters.dateFrom, filters.dateTo
  );
  
  const transactions: Transaction[] = transactionsData?.data || [];
  const meta = transactionsData?.meta || { total: 0, totalPages: 1 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilters({ search, dateFrom, dateTo });
  };
  
  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setFilters({ search: "", dateFrom: "", dateTo: "" });
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-stone-800">Riwayat Transaksi</h1>
        <p className="text-sm text-stone-500 mt-0.5">Daftar semua transaksi yang telah diproses</p>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="bg-white border border-stone-200 rounded-sm p-3 mb-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs text-stone-500 block mb-1">Cari No. Invoice</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="FDZ-..."
              className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-stone-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Dari Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-8 pr-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-stone-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Sampai Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pl-8 pr-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-stone-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold text-white rounded-sm"
          style={{ backgroundColor: "#3C3025" }}
        >
          Filter
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="px-4 py-2 text-sm font-semibold text-stone-600 border border-stone-300 rounded-sm hover:bg-stone-50"
        >
          Reset
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200" style={{ backgroundColor: "#f5f0e8" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">No. Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Kasir</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-stone-200 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400 text-sm">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: "#3C3025" }}>
                      {tx.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs">
                      {new Date(tx.createdAt).toLocaleString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs">
                      {tx.kasir?.name || tx.kasir?.username || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-800">
                      Rp {tx.totalPrice.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold ${
                        tx.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-colors"
                          title="Cetak Ulang"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50">
            <p className="text-xs text-stone-500">
              Total: {meta.total} transaksi
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-stone-300 rounded-sm disabled:opacity-40"
              >
                ← Sebelumnya
              </button>
              <span className="px-3 py-1 text-xs text-stone-600">
                {page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1 text-xs border border-stone-300 rounded-sm disabled:opacity-40"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedTx && (
        <InvoiceModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
