"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Activity,
  Coins,
  AlertTriangle,
  Search,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useShiftsAdmin, useShiftsStatsAdmin, useCashiersAdmin } from "@/features/shifts";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/shared/DataTable";

export function ShiftsClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [kasirId, setKasirId] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Queries
  const { data: shiftsData, isLoading: isShiftsLoading } = useShiftsAdmin({
    page,
    limit,
    search: debouncedSearch,
    status: status === "ALL" ? undefined : status,
    kasirId: kasirId === "ALL" ? undefined : kasirId,
  });

  const { data: stats, isLoading: isStatsLoading } = useShiftsStatsAdmin();
  const { data: cashiers = [] } = useCashiersAdmin();

  const shifts = shiftsData?.data || [];
  const meta = shiftsData?.meta;

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      header: "Kasir",
      cell: (shift: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-[#3C3025] text-sm">
            {shift.admin?.name || "Kasir"}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            @{shift.admin?.username || shift.adminId}
          </span>
        </div>
      ),
    },
    {
      header: "Waktu (Buka - Tutup)",
      cell: (shift: any) => (
        <div className="flex flex-col gap-0.5 text-xs font-medium text-stone-600">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Buka: {format(new Date(shift.startTime), "dd MMM yyyy HH:mm", { locale: localeId })}
          </span>
          {shift.endTime && (
            <span className="flex items-center gap-1 text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
              Tutup: {format(new Date(shift.endTime), "dd MMM yyyy HH:mm", { locale: localeId })}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Modal Awal",
      cell: (shift: any) => (
        <span className="font-semibold text-[#3C3025] text-sm">
          {formatIDR(shift.startingCash)}
        </span>
      ),
    },
    {
      header: "Laporan Uang Fisik",
      cell: (shift: any) => (
        <span className="font-bold text-[#3C3025] text-sm">
          {shift.actualEndingCash != null ? formatIDR(Number(shift.actualEndingCash)) : "-"}
        </span>
      ),
    },
    {
      header: "Status / Selisih",
      cell: (shift: any) => {
        const expected = Number(shift.expectedEndingCash || 0);
        const actual = Number(shift.actualEndingCash || 0);
        const disparity = actual - expected;
        const isClosed = shift.status === "CLOSED";

        if (!isClosed) {
          return (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2 py-0.5 text-[10px]">
              AKTIF (OPEN)
            </Badge>
          );
        }

        return (
          <div className="inline-flex flex-col items-start gap-1">
            {disparity < 0 ? (
              <>
                <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 font-bold text-[10px] px-2 py-0.5 border-none">
                  MINUS
                </Badge>
                <span className="text-[11px] text-red-600 font-black">
                  - {formatIDR(Math.abs(disparity))}
                </span>
              </>
            ) : disparity > 0 ? (
              <>
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50 font-bold text-[10px] px-2 py-0.5 border-none">
                  LEBIH
                </Badge>
                <span className="text-[11px] text-orange-600 font-black">
                  + {formatIDR(disparity)}
                </span>
              </>
            ) : (
              <Badge variant="outline" className="bg-stone-50 text-stone-600 border-stone-200 font-bold text-[10px] px-2 py-0.5">
                PAS (BALANCE)
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (shift: any) => (
        <Link
          href={`/dashboard/shifts/${shift.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#8C6D58] hover:text-[#5c4433] bg-[#F7F5F2] hover:bg-[#EFECE7] rounded-lg border border-[#E3DFD8] transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="p-0 space-y-6 flex flex-col">
      <PageHeader
        title="Laporan Laci Kasir"
        description="Pantau aktivitas kas, laci aktif, dan selisih uang fisik kasir secara terpusat untuk rekonsiliasi keuangan toko."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Shift Status */}
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Shift Kerja Aktif & Tutup
              <Activity className="h-4 w-4 text-stone-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-[#3C3025]">
                  {stats?.totalActiveShifts || 0} <span className="text-sm font-semibold text-stone-400">Aktif</span>
                </p>
                <p className="text-[10px] text-stone-400 mt-1">
                  {stats?.totalClosedShifts || 0} shift telah ditutup & diaudit
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Total Actual Cash */}
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Total Setoran Fisik (Tutup Laci)
              <Coins className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-[#3C3025]">
                  {formatIDR(stats?.totalActualCash || 0)}
                </p>
                <p className="text-[10px] text-stone-400 mt-1">
                  Akumulasi kas fisik yang masuk ke kasir
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Disparity Cases */}
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Selisih Laci (MINUS)
              <AlertTriangle className="h-4 w-4 text-red-550 animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-red-600">
                  {formatIDR(stats?.totalMinusAmount || 0)}
                </p>
                <p className="text-[10px] text-stone-400 mt-1">
                  Terdeteksi {stats?.totalMinusCases || 0} kasus laci kasir minus
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="relative w-full sm:max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Cari nama kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-stone-200 focus:ring-stone-200 text-sm rounded-lg"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Kasir:</span>
            <Select value={kasirId} onValueChange={(val) => { setKasirId(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-stone-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kasir</SelectItem>
                {cashiers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || `@${c.username}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Status:</span>
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 border-stone-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Shift</SelectItem>
                <SelectItem value="OPEN">Aktif (OPEN)</SelectItem>
                <SelectItem value="CLOSED">Selesai (CLOSED)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-3 h-3 text-stone-400" />
            Daftar Aktivitas Laci Kasir ({shiftsData?.meta?.totalItems || 0} Items)
          </p>
        </div>
        <DataTable
          columns={columns}
          data={shifts}
          isLoading={isShiftsLoading}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          showNumber={true}
          className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
        />
      </div>
    </div>
  );
}
