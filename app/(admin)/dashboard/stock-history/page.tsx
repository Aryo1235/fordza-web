"use client";

import { useState,useMemo  } from "react";
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
  Layers,
  Package as PackageIcon
} from "lucide-react";
import { useStockLogs, useSkuStockLogs } from "@/features/products/hooks";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StockLogsPage() {
  const [activeTab, setActiveTab] = useState<string>("universal");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Hook untuk log universal
  const { data: universalData, isLoading: isUniversalLoading } = useStockLogs({
    page,
    limit,
    search,
    type: type || undefined,
  }, { enabled: activeTab === "universal" });

  // Hook untuk log SKU (detail)
  const { data: skuData, isLoading: isSkuLoading } = useSkuStockLogs({
    page,
    limit,
    search,
    type: type || undefined,
  }, { enabled: activeTab === "sku" });

  const isLoading = activeTab === "universal" ? isUniversalLoading : isSkuLoading;
  const currentData = activeTab === "universal" ? universalData : skuData;
  
  // Gunakan useMemo untuk mapping logs agar tidak recalculate saat re-render ringan
  const logs = useMemo(() => currentData?.data || [], [currentData]);

  const handleExportExcel = async () => {
    const endpoint = activeTab === "universal" 
      ? "/api/admin/stock/logs/export" 
      : "/api/admin/stock/logs/sku/export";
    
    await downloadFile(
      endpoint,
      `Laporan_Histori_Stok_${activeTab === "universal" ? "Universal" : "Detail_SKU"}_Fordza.xlsx`,
      { search, type, format: "xlsx" }
    );
  };

  const handleExportPDF = async () => {
    const endpoint = activeTab === "universal" 
      ? "/api/admin/stock/logs/export" 
      : "/api/admin/stock/logs/sku/export";
      
    await downloadFile(
      endpoint,
      `Laporan_Histori_Stok_${activeTab === "universal" ? "Universal" : "Detail_SKU"}_Fordza.pdf`,
      { search, type, format: "pdf" }
    );
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case "SALE":
        return (
          <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 font-bold">
            <ArrowDownLeft className="w-3 h-3 mr-1" /> JUAL
          </Badge>
        );
      case "RESTOCK":
        return (
          <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50 font-bold">
            <ArrowUpRight className="w-3 h-3 mr-1" /> MASUK
          </Badge>
        );
      case "VOID":
        return (
          <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50 font-bold">
            <RotateCcw className="w-3 h-3 mr-1" /> VOID
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-stone-200 text-stone-600 bg-stone-50 font-bold">
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

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-white border border-stone-200 p-1 h-12 shadow-sm rounded-xl">
              <TabsTrigger value="universal" className="px-6 h-10 rounded-lg data-[state=active]:bg-[#3C3025] data-[state=active]:text-white flex items-center gap-2">
                <PackageIcon className="w-4 h-4" /> Ringkasan Produk
              </TabsTrigger>
              <TabsTrigger value="sku" className="px-6 h-10 rounded-lg data-[state=active]:bg-[#3C3025] data-[state=active]:text-white flex items-center gap-2">
                <Layers className="w-4 h-4" /> Detail Varian & Ukuran
              </TabsTrigger>
            </TabsList>

            {/* Filter Bar (Inside Tabs Header area for compact look) */}
            <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-stone-200 shadow-sm grow ml-8 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Cari kode, nama, atau catatan..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 h-10 border-none shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="w-px h-6 bg-stone-100" />
              <select
                className="h-10 px-3 bg-transparent text-xs font-bold text-stone-500 uppercase outline-none cursor-pointer"
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1); }}
              >
                <option value="">Semua Aktivitas</option>
                <option value="SALE">Penjualan</option>
                <option value="RESTOCK">Stok Masuk</option>
                <option value="VOID">Pembatalan</option>
                <option value="ADJUSTMENT">Penyesuaian</option>
              </select>
            </div>
          </div>

          <TabsContent value="universal" className="mt-0">
            <Card className="border-stone-200 shadow-sm overflow-hidden text-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-stone-50">
                      <TableRow>
                        <TableHead style={{ width: 160 }} className="text-[10px] font-bold text-stone-400 uppercase">Waktu</TableHead>
                        <TableHead className="text-[10px] font-bold text-stone-400 uppercase">Produk</TableHead>
                        <TableHead style={{ width: 120 }} className="text-[10px] font-bold text-stone-400 uppercase">Tipe</TableHead>
                        <TableHead className="text-right text-[10px] font-bold text-stone-400 uppercase">Perubahan</TableHead>
                        <TableHead className="text-right text-[10px] font-bold text-stone-400 uppercase">Stok Sisa</TableHead>
                        <TableHead className="text-[10px] font-bold text-stone-400 uppercase">Operator</TableHead>
                        <TableHead className="text-[10px] font-bold text-stone-400 uppercase">Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? <EmptyRows count={limit} /> : logs.length === 0 ? <NoData colSpan={7} /> : logs.map((log: any) => (
                        <TableRow key={log.id} className="hover:bg-stone-50/50 transition-colors group">
                          <TableCell className="text-stone-500 text-[10px] font-bold uppercase">{formatDate(log.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-stone-800 text-sm">{log.product?.name}</span>
                              <span className="text-[10px] text-stone-400 font-mono uppercase">{log.product?.productCode}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getLogBadge(log.type)}</TableCell>
                          <TableCell className="text-right font-black"><DeltaBadge delta={log.delta} /></TableCell>
                          <TableCell className="text-right font-mono text-stone-600 font-bold">{log.currentStock}</TableCell>
                          <TableCell className="text-[10px] font-bold text-stone-500 uppercase">{log.operator?.name || "Sistem"}</TableCell>
                          <TableCell className="text-xs text-stone-400 italic truncate max-w-[150px]">{log.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <PaginationFooter meta={currentData?.meta} page={page} limit={limit} setPage={setPage} setLimit={setLimit} isLoading={isLoading} />
            </Card>
          </TabsContent>

          <TabsContent value="sku" className="mt-0">
            <Card className="border-stone-200 shadow-sm overflow-hidden text-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-stone-50">
                      <TableRow>
                        <TableHead style={{ width: 160 }} className="text-[10px] font-bold text-stone-400 uppercase">Waktu</TableHead>
                        <TableHead className="text-[10px] font-bold text-stone-400 uppercase">Produk</TableHead>
                        <TableHead className="text-[10px] font-bold text-stone-400 uppercase">Warna</TableHead>
                        <TableHead className="text-[10px] font-bold text-stone-400 uppercase">Ukuran</TableHead>
                        <TableHead style={{ width: 120 }} className="text-[10px] font-bold text-stone-400 uppercase">Tipe</TableHead>
                        <TableHead className="text-right text-[10px] font-bold text-stone-400 uppercase">Perubahan</TableHead>
                        <TableHead className="text-right text-[10px] font-bold text-stone-400 uppercase">Stok SKU</TableHead>
                        <TableHead className="text-[10px] font-bold text-stone-400 uppercase">Operator</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? <EmptyRows count={limit} /> : logs.length === 0 ? <NoData colSpan={8} /> : logs.map((log: any) => (
                        <TableRow key={log.id} className="hover:bg-stone-50/50 transition-colors">
                          <TableCell className="text-stone-500 text-[10px] font-bold uppercase">{formatDate(log.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-stone-800 text-sm whitespace-nowrap">
                                {log.sku?.variant?.product?.name || "Produk Terhapus"}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono uppercase">
                                {log.sku?.variant?.product?.productCode || "CODE-N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-white text-stone-600 font-bold text-[10px] uppercase border-stone-200">
                              {log.color || log.sku?.variant?.color || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-black text-stone-700">{log.size || log.sku?.size || "-"}</TableCell>
                          <TableCell>{getLogBadge(log.type)}</TableCell>
                          <TableCell className="text-right font-black"><DeltaBadge delta={log.delta} /></TableCell>
                          <TableCell className="text-right font-mono text-stone-800 font-bold">{log.currentStock}</TableCell>
                          <TableCell className="text-[10px] font-bold text-stone-500 uppercase">{log.operator?.name || "Sistem"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <PaginationFooter meta={currentData?.meta} page={page} limit={limit} setPage={setPage} setLimit={setLimit} isLoading={isLoading} />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-stone-200 text-[11px] text-stone-500 shadow-sm font-medium">
          <Filter className="w-3 h-3 text-stone-400" />
          <p>
            {activeTab === "universal" 
              ? "Tampilan Ringkasan Produk merangkum total pergerakan stok tanpa membedakan warna dan ukuran."
              : "Tampilan Detail Varian merangkum mutasi stok spesifik per SKU (warna & ukuran)."}
          </p>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function EmptyRows({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}><TableCell colSpan={10} className="h-12 animate-pulse bg-stone-50/50" /></TableRow>
  ));
}

function NoData({ colSpan }: { colSpan: number }) {
  return <TableRow><TableCell colSpan={colSpan} className="h-32 text-center text-stone-400 font-medium">Belum ada riwayat pergerakan stok.</TableCell></TableRow>;
}

function DeltaBadge({ delta }: { delta: number }) {
  return <span className={delta > 0 ? "text-green-600" : "text-red-600"}>{delta > 0 ? `+${delta}` : delta}</span>;
}

function formatDate(date: string) {
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id });
}

function PaginationFooter({ meta, page, limit, setPage, setLimit, isLoading }: any) {
  if (!meta) return null;
  return (
    <div className="border-t bg-stone-50/30">
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        isLoading={isLoading}
        label="logs"
      />
    </div>
  );
}
