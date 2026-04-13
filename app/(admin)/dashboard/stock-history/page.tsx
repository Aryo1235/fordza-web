"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  History,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Settings2,
  Filter,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useStockLogs } from "@/features/products/hooks";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { downloadFile } from "@/lib/download";

export default function StockLogsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useStockLogs({
    page,
    limit,
    search,
    type: type || undefined,
  });

  const logs = data?.data || [];

  const handleExportExcel = async () => {
    await downloadFile(
      "/api/admin/stock/logs/export",
      "Laporan_Histori_Stok_Fordza.xlsx",
      {
        search,
        type,
        format: "xlsx",
      },
    );
  };

  const handleExportPDF = async () => {
    await downloadFile(
      "/api/admin/stock/logs/export",
      "Laporan_Histori_Stok_Fordza.pdf",
      {
        search,
        type,
        format: "pdf",
      },
    );
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case "SALE":
        return (
          <Badge
            variant="outline"
            className="border-red-200 text-red-600 bg-red-50 font-bold"
          >
            <ArrowDownLeft className="w-3 h-3 mr-1" /> JUAL
          </Badge>
        );
      case "RESTOCK":
        return (
          <Badge
            variant="outline"
            className="border-green-200 text-green-600 bg-green-50 font-bold"
          >
            <ArrowUpRight className="w-3 h-3 mr-1" /> MASUK
          </Badge>
        );
      case "VOID":
        return (
          <Badge
            variant="outline"
            className="border-amber-200 text-amber-600 bg-amber-50 font-bold"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> VOID
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-stone-200 text-stone-600 bg-stone-50 font-bold"
          >
            <Settings2 className="w-3 h-3 mr-1" /> ADJ
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/30">
      <div className="p-6 pb-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Histori Pergerakan Stok"
          description="Lacak setiap perubahan keluar-masuk barang secara real-time"
          icon={<History className="w-6 h-6 text-amber-700" />}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-green-200 text-green-700 hover:bg-green-50 font-bold text-xs"
            onClick={handleExportExcel}
            disabled={isLoading || logs.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs"
            onClick={handleExportPDF}
            disabled={isLoading || logs.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm font-medium">
          <div className="md:col-span-3 space-y-1.5">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Cari Log
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Cari kode produk, nama barang, atau catatan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 h-10 bg-white border-stone-200 focus:ring-stone-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Tipe Aktivitas
            </p>
            <select
              className="w-full h-10 px-3 rounded-md border border-stone-200 bg-white text-sm font-semibold focus:ring-1 focus:ring-stone-200 outline-none"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua Tipe</option>
              <option value="SALE">Penjualan</option>
              <option value="RESTOCK">Stok Masuk</option>
              <option value="VOID">Pembatalan (Void)</option>
              <option value="ADJUSTMENT">Penyesuaian Manual</option>
            </select>
          </div>
        </div>

        <Card className="border-stone-200 shadow-sm overflow-hidden text-sm">
          <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
              <History className="w-3 h-3" />
              Stock Movement Audit Log ({data?.meta?.total || 0} Records)
            </p>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <TableHead
                      style={{ width: 180 }}
                      className="text-[10px] font-bold text-stone-400 uppercase"
                    >
                      Waktu
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-stone-400 uppercase">
                      Produk
                    </TableHead>
                    <TableHead
                      style={{ width: 120 }}
                      className="text-[10px] font-bold text-stone-400 uppercase"
                    >
                      Tipe
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-stone-400 uppercase">
                      Perubahan
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-stone-400 uppercase">
                      Stok Sisa
                    </TableHead>
                    <TableHead className="text-[10px] font-bold text-stone-400 uppercase">
                      Operator
                    </TableHead>
                    <TableHead
                      style={{ maxWidth: 200 }}
                      className="text-[10px] font-bold text-stone-400 uppercase"
                    >
                      Catatan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: limit }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell
                          colSpan={7}
                          className="h-12 animate-pulse bg-stone-50/50"
                        />
                      </TableRow>
                    ))
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-stone-400 font-medium"
                      >
                        Belum ada riwayat pergerakan stok.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log: any) => (
                      <TableRow
                        key={log.id}
                        className="hover:bg-stone-50/50 transition-colors group"
                      >
                        <TableCell className="text-stone-500 text-[10px] font-bold uppercase">
                          {format(
                            new Date(log.createdAt),
                            "dd MMM yyyy, HH:mm",
                            { locale: id },
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-stone-800 text-sm group-hover:text-stone-900">
                              {log.product?.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono tracking-tighter uppercase">
                              {log.product?.productCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getLogBadge(log.type)}</TableCell>
                        <TableCell className="text-right font-black">
                          <span
                            className={
                              log.delta > 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {log.delta > 0 ? `+${log.delta}` : log.delta}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-stone-600 font-bold">
                          {log.currentStock}
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-stone-500 uppercase">
                          {log.operator?.name || log.operator?.username || (
                            <span className="text-stone-300">Sistem</span>
                          )}
                        </TableCell>
                        <TableCell
                          style={{ maxWidth: 200 }}
                          className="text-xs text-stone-400 italic truncate font-medium"
                        >
                          {log.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Pagination Footer */}
          {data?.meta && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              totalItems={data.meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              isLoading={isLoading}
              label="logs"
            />
          )}
        </Card>

        {/* Info */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-stone-200 text-[11px] text-stone-500 shadow-sm font-medium">
          <Filter className="w-3 h-3 text-stone-400" />
          <p>
            Gunakan pencarian untuk melerai histori berdasarkan{" "}
            <b>Nama Produk</b> atau <b>Kode Barang</b> tertentu.
          </p>
        </div>
      </div>
    </div>
  );
}
